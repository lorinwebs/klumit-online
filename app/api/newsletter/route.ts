import { NextResponse } from 'next/server';
import {
  sendTelegramMessage,
  escapeHtml,
  isAllowedKlumitOnlineWebsiteTelegramPage,
  gatePageUrlFromAllowedRequestHost,
} from '@/lib/telegram';
import nodemailer from 'nodemailer';

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = optionalString(body.email);
    const firstName = optionalString(body.firstName);
    const lastName = optionalString(body.lastName);
    const phone = optionalString(body.phone);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const time = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });
    const isKClub = Boolean(firstName || lastName || phone);
    const title = isKClub ? 'הצטרפות ל-The K Club' : 'הצטרפות לניוזלטר';

    const detailLines = [
      firstName ? `שם פרטי: <code>${escapeHtml(firstName)}</code>` : null,
      lastName ? `שם משפחה: <code>${escapeHtml(lastName)}</code>` : null,
      `אימייל: <code>${escapeHtml(email)}</code>`,
      phone ? `טלפון: <code>${escapeHtml(phone)}</code>` : null,
    ].filter(Boolean);

    // 1. Send Telegram notification (HTML format)
    const telegramMessage = `📧 <b>${title}</b>

${detailLines.join('\n')}
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

        const textDetails = [
          firstName ? `שם פרטי: ${firstName}` : null,
          lastName ? `שם משפחה: ${lastName}` : null,
          `אימייל: ${email}`,
          phone ? `טלפון: ${phone}` : null,
          `תאריך: ${time}`,
        ]
          .filter(Boolean)
          .join('\n');

        const htmlDetails = [
          firstName ? `<p><strong>שם פרטי:</strong> ${escapeHtml(firstName)}</p>` : null,
          lastName ? `<p><strong>שם משפחה:</strong> ${escapeHtml(lastName)}</p>` : null,
          `<p><strong>אימייל:</strong> ${escapeHtml(email)}</p>`,
          phone ? `<p><strong>טלפון:</strong> ${escapeHtml(phone)}</p>` : null,
          `<p><strong>תאריך:</strong> ${time}</p>`,
        ]
          .filter(Boolean)
          .join('\n');

        await transporter.sendMail({
          from: smtpUser,
          to: 'klumitltd@gmail.com',
          subject: isKClub
            ? `${email} הצטרף ל-The K Club`
            : `${email} הצטרף למועדון החברים`,
          text: `הצטרפות חדשה:\n\n${textDetails}`,
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>${title}</h2>
              ${htmlDetails}
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
