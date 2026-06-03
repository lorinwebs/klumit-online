import { NextRequest, NextResponse } from 'next/server';
import { isAllowedKlumitOnlineWebsiteTelegramPage, notifyWhatsAppShare } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const productUrl = typeof body.productUrl === 'string' ? body.productUrl.trim() : '';
    if (!productUrl || !isAllowedKlumitOnlineWebsiteTelegramPage(productUrl)) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const result = await notifyWhatsAppShare(
      {
        productTitle: body.productTitle,
        productUrl,
        productPrice: body.productPrice,
      },
      { kind: 'pageUrl', pageUrl: productUrl }
    );

    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error in notify-whatsapp-share API:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
