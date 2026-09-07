import {
  shopifyClient,
  PRODUCTS_LIST_QUERY,
  getCategorySearchQuery,
} from '@/lib/shopify';
import { getSaleInfo } from '@/lib/product-sale';
import { matchesCatalogCategory, type CatalogCategory } from '@/lib/product-search';

/** Catalog product shape returned by PRODUCTS_LIST_QUERY */
export interface CatalogProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  productType: string;
  tags: string[];
  createdAt: string;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  compareAtPriceRange?: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants?: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price?: { amount: string; currencyCode: string };
        compareAtPrice?: { amount: string; currencyCode: string } | null;
        selectedOptions?: Array<{ name: string; value: string }>;
      };
    }>;
  };
}

/**
 * Server-side catalog fetch — same filtering as MytheresaGrid's client useEffect.
 * Used so homepage and /products ship real /products/{handle} links in HTML.
 */
export async function fetchCatalogProducts(
  category: CatalogCategory = 'all',
  maxProducts?: number
): Promise<CatalogProduct[]> {
  const searchQuery = getCategorySearchQuery(category);
  const first =
    typeof maxProducts === 'number' && category === 'ss26'
      ? Math.min(Math.max(maxProducts + 4, 12), 24)
      : 100;

  try {
    const data = await shopifyClient.request<{
      products: { edges: Array<{ node: CatalogProduct }> };
    }>(PRODUCTS_LIST_QUERY, {
      first,
      query: searchQuery,
      sortKey: 'CREATED_AT',
      reverse: true,
    });

    let allProducts = data.products.edges.map((edge) => edge.node);

    if (category === 'sale') {
      allProducts = allProducts.filter((product) => getSaleInfo(product) !== null);
    }

    if (category === 'bags' || category === 'wallets' || category === 'belts') {
      allProducts = allProducts.filter((product) => matchesCatalogCategory(product, category));
    }

    if (typeof maxProducts === 'number') {
      allProducts = allProducts.slice(0, maxProducts);
    }

    return allProducts;
  } catch (error) {
    console.error('Error fetching catalog products:', error);
    return [];
  }
}
