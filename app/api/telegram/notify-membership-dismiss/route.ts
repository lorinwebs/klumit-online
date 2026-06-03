import { NextRequest, NextResponse } from 'next/server';
import { isAllowedKlumitOnlineWebsiteTelegramPage, sendTelegramMessage, escapeHtml } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAgent, pageUrl: rawPageUrl } = body;

    const pageUrl = typeof rawPageUrl === 'string' ? rawPageUrl.trim() : '';
    if (!pageUrl || !isAllowedKlumitOnlineWebsiteTelegramPage(pageUrl)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const message = `❌ <b>משתמש סגר את כפתור מועדון החברים</b>

🔗 דף: ${escapeHtml(pageUrl)}
📱 User Agent: ${userAgent ? escapeHtml(String(userAgent).substring(0, 100)) : 'לא צוין'}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    const result = await sendTelegramMessage(message, { kind: 'pageUrl', pageUrl });

    return NextResponse.json({ success: result });
  } catch (error: unknown) {
    console.error('Error in notify-membership-dismiss API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
