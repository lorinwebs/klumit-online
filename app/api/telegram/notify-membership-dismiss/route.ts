import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, escapeHtml } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userAgent, pageUrl } = body;

    const message = `❌ <b>משתמש סגר את כפתור מועדון החברים</b>

🔗 דף: ${pageUrl ? escapeHtml(pageUrl) : 'לא צוין'}
📱 User Agent: ${userAgent ? escapeHtml(userAgent.substring(0, 100)) : 'לא צוין'}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    const result = await sendTelegramMessage(message);

    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Error in notify-membership-dismiss API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
