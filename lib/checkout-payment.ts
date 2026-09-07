import 'server-only';
import { createPaymentProcess, GROW_PAYMENT_URL_TTL_MS } from '@/lib/grow';
import { SITE_URL, type DraftOrderSummary } from '@/lib/checkout-orders';

export interface CheckoutPaymentSession {
  ref: string;
  sig: string;
  draftName: string;
  paymentUrl: string;
  processId: string;
  expiresAt: number;
  summary: {
    currency: string;
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    items: DraftOrderSummary['items'];
    customer: DraftOrderSummary['customer'];
  };
}

/**
 * Opens a Grow payment process for an existing draft order and returns everything the
 * payment page needs. The Grow URL is short-lived, so the page can call this again.
 */
export async function createPaymentSessionForDraft(draft: DraftOrderSummary): Promise<CheckoutPaymentSession> {
  const successUrl = `${SITE_URL}/checkout/success?ref=${draft.ref}&sig=${draft.sig}`;
  const cancelUrl = `${SITE_URL}/checkout/payment?response=cancel`;
  const notifyUrl = `${SITE_URL}/api/grow/webhook`;

  const process = await createPaymentProcess({
    sum: draft.total,
    description: `KLUMIT הזמנה ${draft.name.replace(/^#/, '')}`,
    fullName: draft.customer.fullName,
    phone: draft.customer.phone,
    email: draft.customer.email || undefined,
    invoiceName: draft.customer.fullName,
    successUrl,
    cancelUrl,
    notifyUrl,
    customFields: {
      cField1: draft.ref,
      cField2: 'klumit-web',
    },
    products: [
      ...draft.items.map((item) => ({
        description: item.variantTitle ? `${item.title} ${item.variantTitle}` : item.title,
        quantity: item.quantity,
        price: item.unitPrice,
      })),
      ...(draft.shipping > 0 ? [{ description: 'משלוח', quantity: 1, price: draft.shipping }] : []),
    ],
  });

  return {
    ref: draft.ref,
    sig: draft.sig,
    draftName: draft.name,
    paymentUrl: process.url,
    processId: process.processId,
    expiresAt: Date.now() + GROW_PAYMENT_URL_TTL_MS,
    summary: {
      currency: draft.currency,
      subtotal: draft.subtotal,
      shipping: draft.shipping,
      discount: draft.discount,
      total: draft.total,
      items: draft.items,
      customer: draft.customer,
    },
  };
}
