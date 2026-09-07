/** Minimal product shape needed for sale detection (catalog grid + server fetch). */
export interface SaleCheckProduct {
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode?: string;
    };
  };
  compareAtPriceRange?: {
    minVariantPrice: {
      amount: string;
      currencyCode?: string;
    };
  };
  variants?: {
    edges: Array<{
      node: {
        compareAtPrice?: { amount: string; currencyCode?: string } | null;
      };
    }>;
  };
}

export function getSaleInfo(product: SaleCheckProduct) {
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const compareAt = parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount || '0');
  const variantCompare = product.variants?.edges
    .map((e) => parseFloat(e.node.compareAtPrice?.amount || '0'))
    .find((v) => v > price);
  const original = compareAt > price ? compareAt : variantCompare && variantCompare > price ? variantCompare : 0;
  if (!original || original <= price) return null;
  const percent = Math.round(((original - price) / original) * 100);
  if (percent <= 0) return null;
  return { original, percent, price };
}
