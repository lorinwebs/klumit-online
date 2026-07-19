import { NextRequest, NextResponse } from 'next/server';
import { isAllowedKlumitOnlineWebsiteTelegramPage, notifyNewUser } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.trim() : '';
    if (!pageUrl || !isAllowedKlumitOnlineWebsiteTelegramPage(pageUrl)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    if (!phone) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const result = await notifyNewUser(phone, userId || 'unknown', { kind: 'pageUrl', pageUrl });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in notify-new-user API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
