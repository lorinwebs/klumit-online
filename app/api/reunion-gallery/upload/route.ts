import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage, escapeHtml } from '@/lib/telegram';

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const BOARD_ID = '5090027047';
const PAID_COLUMN_ID = 'color_mm0m3qfz';

async function verifyPaid(name: string): Promise<boolean> {
  if (!MONDAY_API_KEY) return false;

  const query = `
    query {
      boards(ids: [${BOARD_ID}]) {
        items_page(limit: 500) {
          items {
            name
            column_values(ids: ["${PAID_COLUMN_ID}"]) {
              id
              text
              value
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: MONDAY_API_KEY,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) return false;

  const data = await response.json();
  const items = data.data?.boards?.[0]?.items_page?.items || [];

  const match = items.find(
    (item: any) => item.name.trim() === name.trim()
  );

  if (!match) return false;

  const paidCol = match.column_values.find((c: any) => c.id === PAID_COLUMN_ID);
  if (!paidCol) return false;

  try {
    const parsed = JSON.parse(paidCol.value);
    return parsed.label === 'כן' || parsed.index === 1;
  } catch {
    return paidCol.text === 'כן';
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploaderName = formData.get('uploader_name') as string | null;

    if (!file || !uploaderName) {
      return NextResponse.json({ error: 'Missing file or uploader name' }, { status: 400 });
    }

    const isPaid = await verifyPaid(uploaderName);
    if (!isPaid) {
      return NextResponse.json({ error: 'לא ניתן להעלות - יש לשלם קודם' }, { status: 403 });
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Only images and videos are allowed' }, { status: 400 });
    }

    const maxSize = isVideo ? 1024 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max: ${isVideo ? '1GB' : '20MB'}` },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4');
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const filePath = `uploads/${timestamp}-${randomId}.${ext}`;

    const supabase = createSupabaseAdminClient();

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: storageError } = await supabase.storage
      .from('mekif-chet-reunion')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (storageError) throw storageError;

    const { error: dbError } = await supabase.from('reunion_uploads').insert({
      uploader_name: uploaderName,
      file_path: filePath,
      file_type: isImage ? 'image' : 'video',
      file_size: file.size,
    });

    if (dbError) throw dbError;

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/mekif-chet-reunion/${filePath}`;

    const { data: userUploads } = await supabase
      .from('reunion_uploads')
      .select('file_type')
      .eq('uploader_name', uploaderName);

    const userImages = userUploads?.filter(u => u.file_type === 'image').length || 0;
    const userVideos = userUploads?.filter(u => u.file_type === 'video').length || 0;

    const { count: totalCount } = await supabase
      .from('reunion_uploads')
      .select('*', { count: 'exact', head: true });

    const parts = [];
    if (userImages > 0) parts.push(`${userImages} תמונות`);
    if (userVideos > 0) parts.push(`${userVideos} סרטונים`);

    sendTelegramMessage(
      `📸 <b>גלריית מקיף ח׳</b>\n\n` +
      `👤 <b>${escapeHtml(uploaderName)}</b> העלה/תה ${isImage ? 'תמונה' : 'סרטון'}\n` +
      `📊 סה״כ של ${escapeHtml(uploaderName)}: ${parts.join(' ו-')}\n` +
      `📁 סה״כ בגלריה: ${totalCount || 0} קבצים\n` +
      `🕐 ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`
    ).catch(() => {});

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
