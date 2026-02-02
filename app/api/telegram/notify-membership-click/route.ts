import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, escapeHtml, breakUrlForTelegram } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Don't send notifications from localhost
    const isLocalhost = body.pageUrl?.includes('localhost') || body.pageUrl?.includes('127.0.0.1');
    if (isLocalhost) {
      console.log('Skipping Telegram notification (localhost)');
      return NextResponse.json({ success: true, skipped: true });
    }
    
    const urlBroken = body.pageUrl ? breakUrlForTelegram(body.pageUrl) : '';
    
    const message = `💳 <b>לחיצה על בר מועדון לקוחות עליון</b>

🔗 דף: ${escapeHtml(urlBroken)}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    const result = await sendTelegramMessage(message);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in notify-membership-click API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
