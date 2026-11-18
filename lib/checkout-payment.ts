import 'server-only';
import {
  createPaymentLink,
  getGrowConfig,
  GROW_PAYMENT_URL_TTL_MS,
  type GrowOpenMode,
  type GrowProductLine,
} from '@/lib/grow';
import { SITE_URL, type DraftOrderSummary } from '@/lib/checkout-orders';

export interface CheckoutPaymentSession {
  ref: string;
  sig: string;
  draftName: string;
  paymentUrl: string;
  /** Grow paymentLinkProcessId – used as the iframe key; never shown to the customer. */
  processId: string;
  expiresAt: number;
  /** Full-page redirect to the Grow payment page (default) or iframe (GROW_OPEN_MODE). */
  openMode: GrowOpenMode;
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

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/**
 * Grow derives the payment-link total from its product lines, so the lines must add up to
 * the draft total exactly. Itemise when they do (nicer invoice); otherwise – e.g. when a
 * discount code was applied – collapse to a single line for the order total.
 */
export function buildPaymentLinkProducts(draft: DraftOrderSummary): GrowProductLine[] {
  const itemised: GrowProductLine[] = draft.items.map((item) => ({
    productName: item.variantTitle ? `${item.title} ${item.variantTitle}` : item.title,
    quantity: item.quantity,
    price: roundMoney(item.unitPrice),
  }));
  if (draft.shipping > 0) {
    itemised.push({ productName: 'משלוח', quantity: 1, price: roundMoney(draft.shipping) });
  }

  const itemisedTotal = roundMoney(itemised.reduce((sum, line) => sum + line.price * line.quantity, 0));
  if (itemised.length && Math.abs(itemisedTotal - draft.total) < 0.01) {
    return itemised;
  }

  const itemCount = draft.items.reduce((sum, item) => sum + item.quantity, 0);
  return [
    {
      productName: `הזמנה ${draft.name.replace(/^#/, '')} (${itemCount} פריטים${draft.shipping > 0 ? ' כולל משלוח' : ''})`,
      quantity: 1,
      price: roundMoney(draft.total),
    },
  ];
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Creates a Grow payment link (through Make) for an existing draft order and returns
 * everything the payment page needs. Safe to call again for the same draft – e.g. after a
 * cancel inside the form or when the stored session expired.
 */
export async function createPaymentSessionForDraft(draft: DraftOrderSummary): Promise<CheckoutPaymentSession> {
  const successUrl = `${SITE_URL}/checkout/success?ref=${draft.ref}&sig=${draft.sig}`;
  const cancelUrl = `${SITE_URL}/checkout/payment?response=cancel`;
  const orderNumber = draft.name.replace(/^#/, '');
  const { firstName, lastName } = splitName(draft.customer.fullName);

  const link = await createPaymentLink({
    reference: draft.ref,
    title: `KLUMIT הזמנה ${orderNumber}`,
    description: `KLUMIT הזמנה ${orderNumber}`,
    sum: draft.total,
    fullName: draft.customer.fullName,
    firstName,
    lastName,
    phone: draft.customer.phone,
    email: draft.customer.email || undefined,
    successUrl,
    cancelUrl,
    products: buildPaymentLinkProducts(draft),
    customField2: 'klumit-web',
  });

  return {
    ref: draft.ref,
    sig: draft.sig,
    draftName: draft.name,
    paymentUrl: link.url,
    processId: link.paymentLinkProcessId || `${draft.ref}-${Date.now()}`,
    expiresAt: Date.now() + GROW_PAYMENT_URL_TTL_MS,
    openMode: getGrowConfig().openMode,
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
