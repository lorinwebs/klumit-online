import { NextRequest, NextResponse } from 'next/server';
import { isAllowedKlumitOnlineWebsiteTelegramPage, notifyAddToCart } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.trim() : '';
    if (!pageUrl || !isAllowedKlumitOnlineWebsiteTelegramPage(pageUrl)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const productTitle = typeof body.productTitle === 'string' ? body.productTitle.trim() : '';
    if (!productTitle) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const result = await notifyAddToCart(
      {
        productTitle,
        variantTitle: body.variantTitle,
        price: body.price,
        currency: body.currency,
        userEmail: body.userEmail,
        userPhone: body.userPhone,
      },
      { kind: 'pageUrl', pageUrl }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in notify-add-to-cart API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
