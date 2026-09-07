/** Product-type categories that can be matched against title/productType. */
export type ProductCategory = 'bags' | 'wallets' | 'belts';

/** Every catalog tab, including the virtual ones (all / new season / sale). */
export type CatalogCategory = ProductCategory | 'all' | 'ss26' | 'sale';

/** Hebrew / English / Russian words shoppers type, mapped to catalog categories. */
const CATEGORY_KEYWORDS: Record<ProductCategory, string[]> = {
  bags: [
    'bag',
    'bags',
    'handbag',
    'handbags',
    'tote',
    'תיק',
    'תיקים',
    'תיקי',
    'сумка',
    'сумки',
  ],
  wallets: [
    'wallet',
    'wallets',
    'ארנק',
    'ארנקים',
    'кошелек',
    'кошелёк',
    'кошельки',
  ],
  belts: [
    'belt',
    'belts',
    'חגורה',
    'חגורות',
    'חגור',
    'ремень',
    'ремни',
  ],
};

type SearchableProduct = {
  title: string;
  vendor?: string | null;
  productType?: string | null;
  tags?: string[] | null;
};

export function matchesCatalogCategory(
  product: SearchableProduct,
  category: CatalogCategory
): boolean {
  // Virtual tabs (all / ss26 / sale) are not product types – everything matches.
  if (!(category in CATEGORY_KEYWORDS)) return true;
  const type = (product.productType || '').toLowerCase();
  const title = product.title.toLowerCase();
  return CATEGORY_KEYWORDS[category as ProductCategory].some(
    (keyword) => type.includes(keyword) || title.includes(keyword)
  );
}

function categoryForToken(token: string): ProductCategory | null {
  const normalized = token.toLowerCase();
  if (normalized.length < 2) return null;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    ProductCategory,
    string[],
  ][]) {
    if (
      keywords.some(
        (keyword) =>
          keyword === normalized ||
          (normalized.length >= 3 && (keyword.startsWith(normalized) || normalized.startsWith(keyword)))
      )
    ) {
      return category;
    }
  }
  return null;
}

/** Match a free-text query against product fields, expanding HE/RU category words to EN types. */
export function productMatchesSearch(product: SearchableProduct, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [product.title, product.vendor, product.productType, ...(product.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return q.split(/\s+/).every((token) => {
    const category = categoryForToken(token);
    if (category && matchesCatalogCategory(product, category)) return true;
    return haystack.includes(token);
  });
}
