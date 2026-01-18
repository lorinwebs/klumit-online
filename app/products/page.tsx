import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { createServerShopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';
import ProductsClient from './ProductsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'קטלוג מוצרים',
  description: 'קולקציית תיקים יוקרתיים מאיטליה - RENTAO ANGI ו-CARLINO GROUP. תיקי עור איכותיים, תיקי גב, תיקי צד וחגורות. משלוח חינם מעל 500₪.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/products',
  },
};

interface Product {
  id: string;
  title: string;
  handle: string;
  productType?: string;
  vendor?: string;
  priceRange: {
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
  variants: {
    edges: Array<{
      node: {
        id: string;
        availableForSale: boolean;
        quantityAvailable: number;
      };
    }>;
  };
}

type TabType = 'bags' | 'belts' | 'wallets';

function getQueryFilter(tab: TabType): string {
  switch (tab) {
    case 'bags':
      return '(product_type:תיק OR product_type:bag OR product_type:תיקים OR product_type:bags)';
    case 'belts':
      return '(product_type:חגורות OR product_type:belt OR product_type:belts OR product_type:חגורה)';
    case 'wallets':
      return '(product_type:ארנק OR product_type:wallet OR product_type:ארנקים OR product_type:wallets)';
    default:
      return '(product_type:תיק OR product_type:bag OR product_type:תיקים OR product_type:bags)';
  }
}

async function fetchProducts(tab: TabType): Promise<Product[]> {
  const shopifyClient = createServerShopifyClient();
  const queryFilter = getQueryFilter(tab);

  try {
    const data = await shopifyClient.request<{
      products: { edges: Array<{ node: Product }> };
    }>(PRODUCTS_QUERY, {
      first: 50,
      query: queryFilter,
    });

    return data.products.edges.map((edge) => edge.node);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

interface PageProps {
  searchParams: Promise<{ tab?: string; vendor?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const activeTab = (params.tab as TabType) || 'bags';
  const selectedVendor = params.vendor || 'all';
  
  const products = await fetchProducts(activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-grow w-full px-4 py-4 md:py-16" role="main">
        <Suspense fallback={
          <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-8 max-w-7xl mx-auto">
            {[...Array(8)].map((_, i) => (
              <div key={`suspense-${i}`} className="bg-gray-200 animate-pulse aspect-[4/5]" />
            ))}
          </div>
        }>
          <ProductsClient 
            initialProducts={products} 
            activeTab={activeTab}
            initialVendor={selectedVendor}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
