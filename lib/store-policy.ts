import { CONTACT } from '@/lib/contact';

/**
 * Shipping and returns terms, shared by checkout, the visible FAQ copy and the
 * structured data so they always state the same numbers as /shipping and /returns.
 * The live rate itself is set on the Israel market in Shopify — keep the two in sync.
 */
export const STORE_POLICY = {
  freeShippingThreshold: 500,
  standardShippingPrice: 39,
  deliveryBusinessDays: { min: 2, max: 5 },
  returnWindowDays: 14,
  saleExchangeWindowHours: 48,
  returnCourierFee: 29.9,
} as const;

export type DeliveryMethod = 'shipping' | 'pickup';

export const PICKUP_LABEL = `איסוף עצמי מהחנות – ${CONTACT.address}`;

/** Home delivery is free from the threshold up; store pickup is always free. */
export function deliveryFee(method: DeliveryMethod, subtotal: number): number {
  if (method === 'pickup') return 0;
  return subtotal >= STORE_POLICY.freeShippingThreshold ? 0 : STORE_POLICY.standardShippingPrice;
}
