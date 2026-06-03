import { NextResponse } from 'next/server';
import { isAllowedKlumitOnlineWebsiteTelegramPage, sendTelegramMessage, escapeHtml } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { language, pageUrl: rawPageUrl, userAgent } = body;

    const pageUrl = typeof rawPageUrl === 'string' ? rawPageUrl.trim() : '';
    if (!pageUrl || !isAllowedKlumitOnlineWebsiteTelegramPage(pageUrl)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const languageNames: Record<string, string> = {
      he: 'עברית',
      en: 'English',
      ru: 'Русский',
    };

    const message = `🌐 <b>החלפת שפה באתר</b>

שפה חדשה: <b>${escapeHtml(languageNames[language] || language)}</b>
דף: ${escapeHtml(pageUrl)}
User-Agent: ${userAgent ? escapeHtml(String(userAgent).substring(0, 120)) : 'לא ידוע'}
זמן: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

    await sendTelegramMessage(message, { kind: 'pageUrl', pageUrl });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send language change notification:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
