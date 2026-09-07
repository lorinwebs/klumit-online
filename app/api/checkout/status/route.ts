import { NextRequest, NextResponse } from 'next/server';
import { getDraftOrderSummary, refToDraftGid, verifyRef } from '@/lib/checkout-orders';

export const dynamic = 'force-dynamic';

/**
 * Polled by /checkout/success until the Grow webhook has completed the order.
 * GET /api/checkout/status?ref=<draft id>&sig=<signature>
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref') || '';
  const sig = request.nextUrl.searchParams.get('sig');

  if (!verifyRef(ref, sig)) {
    return NextResponse.json({ error: 'invalid_reference' }, { status: 403 });
  }

  try {
    const draft = await getDraftOrderSummary(refToDraftGid(ref));
    if (!draft) {
      return NextResponse.json({ state: 'not_found' }, { status: 404 });
    }

    const paid = draft.status === 'COMPLETED' && draft.order !== null;

    return NextResponse.json(
      {
        state: paid ? 'paid' : 'pending',
        draftName: draft.name,
        orderName: draft.order?.name ?? null,
        financialStatus: draft.order?.financialStatus ?? null,
        total: draft.total,
        currency: draft.currency,
        items: draft.items,
        customer: {
          fullName: draft.customer.fullName,
          email: draft.customer.email,
          addressLine: draft.customer.addressLine,
          city: draft.customer.city,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('checkout status failed:', error);
    return NextResponse.json({ state: 'error' }, { status: 500 });
  }
}
