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

/**
 * The date by which an order placed at `orderedAt` should have arrived, as YYYY-MM-DD
 * in Israel time: the longest delivery time above, counted in Sunday–Thursday business days.
 */
export function estimatedDeliveryDate(orderedAt: Date): string {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(orderedAt)
    .split('-')
    .map(Number);

  // UTC midnight of the Israeli calendar date, so stepping a day at a time ignores clock changes
  const date = new Date(Date.UTC(year, month - 1, day));
  let businessDaysLeft = STORE_POLICY.deliveryBusinessDays.max;
  while (businessDaysLeft > 0) {
    date.setUTCDate(date.getUTCDate() + 1);
    const weekday = date.getUTCDay();
    if (weekday !== 5 && weekday !== 6) businessDaysLeft--; // Friday and Saturday don't count
  }
  return date.toISOString().slice(0, 10);
}
