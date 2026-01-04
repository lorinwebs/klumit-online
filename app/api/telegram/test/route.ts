import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await sendTelegramMessage('🧪 בדיקה - הבוט עובד!');
  
  return NextResponse.json({
    success: result,
    message: result ? 'Message sent!' : 'Failed to send message',
    timestamp: new Date().toISOString(),
  });
}

