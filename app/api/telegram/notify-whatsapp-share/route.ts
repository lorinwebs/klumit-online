import { NextRequest, NextResponse } from 'next/server';
import { notifyWhatsAppShare } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const result = await notifyWhatsAppShare({
      productTitle: body.productTitle,
      productUrl: body.productUrl,
      productPrice: body.productPrice,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in notify-whatsapp-share API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
