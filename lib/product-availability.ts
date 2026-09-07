/**
 * True when no variant can be purchased (all unavailable or no variants).
 */
export function isProductSoldOut(product: {
  variants?: { edges?: Array<{ node: { availableForSale: boolean } }> } | null;
}): boolean {
  const edges = product.variants?.edges;
  if (!edges || edges.length === 0) return true;
  return !edges.some((e) => e.node.availableForSale);
}

export type VariantStockState = 'available' | 'in_cart' | 'sold_out';

/**
 * Distinguish true sold-out from "last unit(s) already in this shopper's cart".
 * Shopify often reports quantityAvailable: 0 / availableForSale: false after the
 * last unit is held in cart — that must not look like a failed purchase.
 */
export function getVariantStockState(opts: {
  availableForSale?: boolean;
  quantityAvailable?: number | null;
  cartQuantity: number;
}): VariantStockState {
  const availableForSale = opts.availableForSale !== false;
  const remaining = opts.quantityAvailable;
  const cartQuantity = opts.cartQuantity;

  if (cartQuantity > 0) {
    if (remaining !== undefined && remaining !== null && cartQuantity >= remaining) {
      return 'in_cart';
    }
    if (
      (remaining !== undefined && remaining !== null && remaining <= 0) ||
      !availableForSale
    ) {
      return 'in_cart';
    }
  }

  if (!availableForSale) return 'sold_out';
  if (remaining !== undefined && remaining !== null && remaining <= 0) return 'sold_out';
  return 'available';
}
