/**
 * True when no variant can be purchased (all unavailable or no variants).
 */
export function isProductSoldOut(product: {
  variants?: { edges?: Array<{ node: { availableForSale: boolean } }> } | null;
}): boolean {
  const edges = product.variants?.edges;
  if (!edges?.length) return true;
  return !edges.some((e) => e.node.availableForSale);
}
