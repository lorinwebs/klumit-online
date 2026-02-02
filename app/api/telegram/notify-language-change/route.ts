import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { language, pageUrl, userAgent } = body;

    // Check if running on localhost
    const isLocalhost = pageUrl && (pageUrl.includes('localhost') || pageUrl.includes('127.0.0.1'));
    
    if (isLocalhost) {
      console.log('Skipping Telegram notification on localhost');
      return NextResponse.json({ success: true, skipped: true });
    }

    const languageNames: Record<string, string> = {
      he: 'עברית',
      en: 'English',
      ru: 'Русский'
    };

    const message = `
🌐 *החלפת שפה באתר*

שפה חדשה: *${languageNames[language] || language}*
דף: ${pageUrl || 'לא ידוע'}
זמן: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
    `.trim();

    await sendTelegramMessage(message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send language change notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
