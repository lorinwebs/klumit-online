import { NextRequest, NextResponse } from 'next/server';
import { GROW_WEBHOOK_KEY, verifyWebhookSignature } from '@/lib/grow';
import { updateShopifyOrder } from '@/lib/shopify-admin';

/**
 * Webhook endpoint לקבלת עדכוני תשלום מ-Grow
 * 
 * URL: https://your-domain.com/api/grow/webhook
 * 
 * הגדר ב-Grow:
 * - לינק לעדכון השרת: https://your-domain.com/api/grow/webhook
 * - פרמטר מזהה: order_id או order_number
 * - סוג: עדכון לאחר ביצוע עסקה
 * - דיווחים: Payment Links / כל העסקאות
 * - פורמט: JSON
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // אימות Webhook
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-api-key');
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // בדיקה שהתשלום הצליח
    const paymentStatus = body.status || body.paymentStatus || body.transactionStatus;
    const isPaid = paymentStatus === 'paid' || paymentStatus === 'completed' || paymentStatus === 'success';

    if (!isPaid) {
      // אם התשלום לא הצליח, רק נרשום לוג
      console.log('Payment not completed:', body);
      return NextResponse.json({ received: true, status: 'not_paid' });
    }

    // קבלת מזהה ההזמנה
    const orderReference = body.reference || body.orderReference || body.metadata?.orderReference;
    
    if (!orderReference) {
      console.error('No order reference in webhook:', body);
      return NextResponse.json(
        { error: 'Missing order reference' },
        { status: 400 }
      );
    }

    // עדכון ההזמנה ב-Shopify
    try {
      await updateShopifyOrder(orderReference, {
        tags: ['Paid via Grow'],
        note: `תשלום אושר דרך Grow. תאריך: ${new Date().toLocaleString('he-IL')}`,
        financialStatus: 'paid',
      });

      console.log(`Order ${orderReference} updated successfully via Grow webhook`);
    } catch (error) {
      console.error('Error updating Shopify order:', error);
      // נחזיר 200 כדי ש-Grow לא ינסה שוב, אבל נרשום את השגיאה
      return NextResponse.json({ 
        received: true, 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // החזרת תשובה חיובית ל-Grow
    return NextResponse.json({ 
      received: true, 
      status: 'success',
      orderReference 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint לבדיקה
export async function GET() {
  return NextResponse.json({ 
    message: 'Grow webhook endpoint is active',
    webhookKey: GROW_WEBHOOK_KEY ? `${GROW_WEBHOOK_KEY.substring(0, 10)}...` : 'not set'
  });
}

