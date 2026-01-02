import { NextRequest, NextResponse } from 'next/server';
import { createPaymentLink } from '@/lib/grow';

export const dynamic = 'force-dynamic';

/**
 * API endpoint ליצירת Payment Link ב-Grow
 * 
 * נקרא מדף ה-checkout לאחר יצירת הזמנה ב-Shopify
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { 
      amount, 
      reference, 
      description, 
      customerEmail, 
      customerPhone, 
      customerName,
      successUrl,
      cancelUrl 
    } = body;

    // בדיקות תקינות
    if (!amount || !reference) {
      console.error('Missing required fields:', { amount, reference });
      return NextResponse.json(
        { error: 'Missing required fields: amount, reference' },
        { status: 400 }
      );
    }

    // בדיקה ש-GROW_API_KEY מוגדר
    if (!process.env.GROW_API_KEY) {
      console.error('GROW_API_KEY is not set');
      return NextResponse.json(
        { 
          error: 'GROW_API_KEY לא מוגדר',
          details: 'אנא הגדר את GROW_API_KEY ב-.env.local'
        },
        { status: 500 }
      );
    }

    console.log('Creating payment link with:', {
      amount: parseFloat(amount),
      reference: String(reference),
      hasEmail: !!customerEmail,
      hasPhone: !!customerPhone,
    });

    // יצירת Payment Link
    const paymentLink = await createPaymentLink({
      amount: parseFloat(amount),
      reference: String(reference),
      description,
      customerEmail,
      customerPhone,
      customerName,
      successUrl,
      cancelUrl,
    });

    console.log('Payment link created successfully:', {
      paymentId: paymentLink.paymentId,
      hasLink: !!paymentLink.paymentLink,
    });

    return NextResponse.json({
      success: true,
      paymentLink: paymentLink.paymentLink,
      paymentId: paymentLink.paymentId,
    });

  } catch (error) {
    console.error('Error creating payment link:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
    });

    return NextResponse.json(
      { 
        error: 'Failed to create payment link',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

