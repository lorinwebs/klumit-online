import { NextRequest, NextResponse } from 'next/server';
import { isAllowedKlumitOnlineWebsiteTelegramPage, sendTelegramMessage } from '@/lib/telegram';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const NOTIFICATION_COOLDOWN = 30 * 60 * 1000; // 30 דקות

export async function POST(request: NextRequest) {
  let body: { viewerCount?: number; pageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const viewerCount = body.viewerCount as number;
    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.trim() : '';

    if (!pageUrl || !isAllowedKlumitOnlineWebsiteTelegramPage(pageUrl)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    if (!viewerCount || viewerCount < 10) {
      return NextResponse.json({ success: false, error: 'Viewer count below threshold' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

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
      if (now - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        return NextResponse.json({ success: false, error: 'Notification sent recently' }, { status: 429 });
      }
    }

    const message = `🔥 <b>גידול בתנועה באתר!</b>

👥 מספר צופים: <b>${viewerCount}</b>
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    const result = await sendTelegramMessage(message, { kind: 'pageUrl', pageUrl });

    if (result) {
      await supabaseAdmin.from('klumit_system_notifications').insert({
        notification_type: 'high_traffic',
        viewer_count: viewerCount,
        sent_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: result });
  } catch (error: unknown) {
    console.error('Error in notify-high-traffic API:', error);
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    if (errMsg.includes('relation') || errMsg.includes('does not exist')) {
      try {
        const viewerCount = body.viewerCount as number;
        const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.trim() : '';
        if (!pageUrl || !isAllowedKlumitOnlineWebsiteTelegramPage(pageUrl)) {
          return NextResponse.json({ success: true, skipped: true });
        }
        const message = `🔥 <b>גידול בתנועה באתר!</b>

👥 מספר צופים: <b>${viewerCount}</b>
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;
        const result = await sendTelegramMessage(message, { kind: 'pageUrl', pageUrl });
        return NextResponse.json({ success: result });
      } catch (fallbackError) {
        return NextResponse.json(
          { success: false, error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 });
  }
}
