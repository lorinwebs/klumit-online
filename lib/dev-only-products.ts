/**
 * Internal test products (e.g. the payment-flow test product, handle `dev-test-payment`).
 *
 * In Shopify they are UNLISTED, so the Storefront API never returns them in lists, search or
 * collections – only when fetched directly by handle. This tag closes that last door:
 * outside `next dev` a direct fetch is treated as "product not found".
 */
export const DEV_ONLY_PRODUCT_TAG = 'dev-only';

export function isDevOnlyProductHidden(product: { tags?: string[] | null }): boolean {
  if (process.env.NODE_ENV === 'development') return false;
  return (product.tags ?? []).some((tag) => tag.trim().toLowerCase() === DEV_ONLY_PRODUCT_TAG);
}
