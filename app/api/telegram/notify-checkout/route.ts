import { NextRequest, NextResponse } from 'next/server';
import { notifyCheckoutVisit } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Don't send notifications from localhost
    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    if (isLocalhost) {
      console.log('Skipping Telegram notification (localhost)');
      return NextResponse.json({ success: true, skipped: true });
    }
    
    const result = await notifyCheckoutVisit({
      userEmail: body.userEmail,
      userPhone: body.userPhone,
      itemsCount: body.itemsCount,
      totalValue: body.totalValue,
    });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in notify-checkout API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
