import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/grow';
import { updateShopifyOrder } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

/**
 * Webhook endpoint לקבלת עדכונים מ-Grow
 * 
 * URL: https://your-domain.com/api/grow/webhook
 * 
 * הגדרה ב-Grow Dashboard:
 * - URL: https://your-domain.com/api/grow/webhook
 * - Webhook Key: (המפתח שמוגדר ב-GROW_WEBHOOK_KEY)
 * - Events: Payment Links / כל העסקאות
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // אימות Webhook
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-api-key');
    // המרת null ל-undefined עבור TypeScript
    const signatureValue = signature ?? undefined;
    
    if (!verifyWebhookSignature(body, signatureValue)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // עיבוד ה-webhook לפי סוג האירוע
    const eventType = body.event || body.type || 'unknown';
    const paymentStatus = body.status || body.payment_status || 'unknown';
    const orderReference = body.reference || body.order_id || body.order_number;

    // אם התשלום הצליח, עדכן את ההזמנה ב-Shopify
    if (paymentStatus === 'paid' || paymentStatus === 'completed' || eventType === 'payment.completed') {
      if (!orderReference) {
        return NextResponse.json(
          { error: 'Missing order reference' },
          { status: 400 }
        );
      }

      try {
        // עדכן את ההזמנה ב-Shopify
        await updateShopifyOrder(orderReference, {
          tags: ['Paid via Grow', 'Payment Completed'],
          note: `תשלום אושר דרך Grow-il ב-${new Date().toLocaleString('he-IL')}`,
        });
      } catch (error) {
        // לא נזרוק שגיאה - נחזיר 200 כדי ש-Grow לא ינסה שוב
        return NextResponse.json({
          success: true,
          message: 'Webhook received but order update failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // החזר תשובה מוצלחת
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint לבדיקת תקינות ה-webhook
export async function GET() {
  return NextResponse.json({
    message: 'Grow Webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}


