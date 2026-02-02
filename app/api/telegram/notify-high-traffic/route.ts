import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, escapeHtml } from '@/lib/telegram';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 דקות

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const viewerCount = body.viewerCount as number;
    
    // Don't send notifications from localhost
    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    if (isLocalhost) {
      console.log('Skipping Telegram notification (localhost)');
      return NextResponse.json({ success: true, skipped: true });
    }
    
    if (!viewerCount || viewerCount < 10) {
      return NextResponse.json({ success: false, error: 'Viewer count below threshold' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    
    // בדיקה אם נשלחה הודעה לאחרונה (cooldown) - שמירה ב-DB
    const now = Date.now();
    const { data: lastNotification } = await supabaseAdmin
      .from('klumit_system_notifications')
      .select('sent_at')
      .eq('notification_type', 'high_traffic')
      .order('sent_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastNotification?.sent_at) {
      const lastNotificationTime = new Date(lastNotification.sent_at).getTime();
      if ((now - lastNotificationTime) < NOTIFICATION_COOLDOWN) {
        return NextResponse.json({ success: false, error: 'Notification sent recently' }, { status: 429 });
      }
    }

    const message = `🔥 <b>גידול בתנועה באתר!</b>

👥 מספר צופים: <b>${viewerCount}</b>
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    const result = await sendTelegramMessage(message);
    
    if (result) {
      // שמירת ההודעה ב-DB
      await supabaseAdmin
        .from('klumit_system_notifications')
        .insert({
          notification_type: 'high_traffic',
          viewer_count: viewerCount,
          sent_at: new Date().toISOString(),
        });
    }

    return NextResponse.json({ success: result });
  } catch (error: any) {
    console.error('Error in notify-high-traffic API:', error);
    // אם הטבלה לא קיימת, ננסה לשלוח בכל זאת (fallback)
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
      try {
        const body = await request.json();
        const viewerCount = body.viewerCount as number;
        const message = `🔥 <b>גידול בתנועה באתר!</b>

👥 מספר צופים: <b>${viewerCount}</b>
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;
        const result = await sendTelegramMessage(message);
        return NextResponse.json({ success: result });
      } catch (fallbackError) {
        return NextResponse.json({ success: false, error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' }, { status: 500 });
      }
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
