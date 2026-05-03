import { NextRequest, NextResponse } from 'next/server';
import { badgeSchema, buildDisplayName } from '../../../lib/badge/schema';
import { generateBadgePng } from '../../../lib/badge/png';
import { createSupabaseAdminClient } from '../../../lib/supabase/admin';

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'נתונים לא תקינים' }, { status: 400 }); }

  const parsed = badgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'שגיאת validation' }, { status: 400 });
  }

  const { _hp, ...data } = parsed.data;
  if (_hp) return NextResponse.json({ ok: true }); // honeypot

  const admin = createSupabaseAdminClient();

  // Insert row
  const { data: row, error: insertErr } = await admin
    .from('reunion_badges')
    .insert(data)
    .select('id')
    .single();

  if (insertErr || !row) {
    console.error('Badge insert error:', insertErr);
    return NextResponse.json({ error: 'שגיאת שמירה' }, { status: 500 });
  }

  // Generate PNG and upload (non-blocking on error)
  try {
    const pngBuffer = await generateBadgePng(data as import('../../components/badge/Badge').BadgeData);
    const pngPath = `badges/${row.id}.png`;

    const { error: uploadErr } = await admin.storage
      .from('reunion-badges')
      .upload(pngPath, pngBuffer, { contentType: 'image/png', upsert: false });

    if (!uploadErr) {
      await admin.from('reunion_badges').update({ png_path: pngPath }).eq('id', row.id);
    } else {
      console.error('PNG upload error:', uploadErr);
    }
  } catch (err) {
    console.error('PNG generation error:', err);
  }

  // Get count
  const { data: countData } = await admin.rpc('reunion_badges_count');

  return NextResponse.json({ ok: true, id: row.id, count: countData ?? 0 });
}

export async function GET() {
  const admin = createSupabaseAdminClient();

  const { data: rows, error } = await admin
    .from('reunion_badges')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'שגיאת קריאה' }, { status: 500 });

  // Batch signed URLs
  const paths = (rows ?? []).filter(r => r.png_path).map(r => r.png_path as string);
  let signedUrls: Record<string, string> = {};

  if (paths.length > 0) {
    const { data: signed } = await admin.storage
      .from('reunion-badges')
      .createSignedUrls(paths, 60 * 60); // 1 hour

    (signed ?? []).forEach(s => {
      if (s.signedUrl) signedUrls[s.path] = s.signedUrl;
    });
  }

  const result = (rows ?? []).map(r => ({
    ...r,
    signed_url: r.png_path ? (signedUrls[r.png_path] ?? null) : null,
  }));

  return NextResponse.json({ rows: result });
}
