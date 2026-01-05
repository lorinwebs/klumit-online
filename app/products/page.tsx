'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { shopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';

interface Product {
  id: string;
  title: string;
  handle: string;
  productType?: string;
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

type TabType = 'bags' | 'belts';

function ProductsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam === 'belts' ? 'belts' : 'bags');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update tab from URL params
    const currentTabParam = searchParams?.get('tab') as TabType | null;
    if (currentTabParam === 'belts') {
      setActiveTab('belts');
    } else {
      setActiveTab('bags');
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        // Build query filter based on active tab
        let queryFilter = '';
        if (activeTab === 'bags') {
          queryFilter = '(product_type:תיק OR product_type:bag OR product_type:תיקים OR product_type:bags)';
        } else if (activeTab === 'belts') {
          queryFilter = '(product_type:חגורות OR product_type:belt OR product_type:belts OR product_type:חגורה)';
        }

        const data = await shopifyClient.request<{
          products: { edges: Array<{ node: Product }> };
        }>(PRODUCTS_QUERY, {
          first: 50,
          query: queryFilter || undefined,
        });
        setProducts(data.products.edges.map((edge) => edge.node));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [activeTab]);

  return (
    <>
      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse aspect-[4/5]" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-20">
          <p className="text-gray-400 font-light text-lg">לא נמצאו מוצרים בקטגוריה זו</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
          {products.map((product) => {
            const firstVariant = product.variants.edges[0]?.node;
            const firstImage = product.images.edges[0]?.node;
            
            return (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                handle={product.handle}
                price={product.priceRange.minVariantPrice.amount}
                currencyCode={product.priceRange.minVariantPrice.currencyCode}
                image={firstImage?.url}
                variantId={firstVariant?.id || ''}
                available={firstVariant?.availableForSale || false}
                quantityAvailable={firstVariant?.quantityAvailable}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-grow w-full px-4 py-12 md:py-16" role="main">
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse aspect-[4/5]" />
            ))}
          </div>
        }>
          <ProductsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

