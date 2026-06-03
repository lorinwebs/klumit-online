import { NextRequest, NextResponse } from 'next/server';
import { isAllowedKlumitOnlineWebsiteTelegramPage, notifyCheckoutVisit } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.trim() : '';
    if (!pageUrl || !isAllowedKlumitOnlineWebsiteTelegramPage(pageUrl)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const result = await notifyCheckoutVisit(
      {
        userEmail: body.userEmail,
        userPhone: body.userPhone,
        itemsCount: body.itemsCount,
        totalValue: body.totalValue,
      },
      { kind: 'pageUrl', pageUrl }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in notify-checkout API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
