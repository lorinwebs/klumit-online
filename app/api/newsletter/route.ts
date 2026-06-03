import { NextResponse } from 'next/server';
import {
  sendTelegramMessage,
  escapeHtml,
  isAllowedKlumitOnlineWebsiteTelegramPage,
  gatePageUrlFromAllowedRequestHost,
} from '@/lib/telegram';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const time = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

    // 1. Send Telegram notification (HTML format)
    const telegramMessage = `📧 <b>הצטרפות לניוזלטר</b>

אימייל: <code>${escapeHtml(email)}</code>
📅 ${time}`;

    const originOrReferer = request.headers.get('origin') || request.headers.get('referer') || '';
    const gateFromOrigin =
      originOrReferer && isAllowedKlumitOnlineWebsiteTelegramPage(originOrReferer)
        ? originOrReferer
        : null;
    const gateFromHost = gatePageUrlFromAllowedRequestHost(request);
    const gateUrl =
      gateFromOrigin ||
      (gateFromHost && isAllowedKlumitOnlineWebsiteTelegramPage(gateFromHost) ? gateFromHost : null);
    if (gateUrl) {
      await sendTelegramMessage(telegramMessage, { kind: 'pageUrl', pageUrl: gateUrl });
    }

    // 2. Send actual email to klumitltd@gmail.com
    try {
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: smtpUser,
          to: 'klumitltd@gmail.com',
          subject: `${email} הצטרף למועדון החברים`,
          text: `כתובת אימייל חדשה הצטרפה למועדון החברים:\n\n${email}\n\nתאריך: ${time}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>הצטרפות חדשה למועדון החברים</h2>
              <p><strong>אימייל:</strong> ${escapeHtml(email)}</p>
              <p><strong>תאריך:</strong> ${time}</p>
            </div>
          `,
        });
      } else {
        console.warn('SMTP credentials not configured - email not sent. Set SMTP_USER and SMTP_PASS in .env.local');
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process newsletter signup:', error);
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    );
  }
}
