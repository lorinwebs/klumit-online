import { NextRequest, NextResponse } from 'next/server';
import {
  isAllowedKlumitOnlineWebsiteTelegramPage,
  sendTelegramMessage,
  escapeHtml,
  breakUrlForTelegram,
} from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.trim() : '';
    if (!pageUrl || !isAllowedKlumitOnlineWebsiteTelegramPage(pageUrl)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const urlBroken = breakUrlForTelegram(pageUrl);

    const message = `💳 <b>לחיצה על בר מועדון לקוחות עליון</b>

🔗 דף: ${escapeHtml(urlBroken)}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    const result = await sendTelegramMessage(message, { kind: 'pageUrl', pageUrl });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in notify-membership-click API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
