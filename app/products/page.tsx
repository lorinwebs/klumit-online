'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { shopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';

interface Product {
  id: string;
  title: string;
  handle: string;
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await shopifyClient.request<{
          products: { edges: Array<{ node: Product }> };
        }>(PRODUCTS_QUERY, {
          first: 50,
        });
        setProducts(data.products.edges.map((edge) => edge.node));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow w-full px-4 py-12 md:py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse aspect-[4/5]" />
            ))}
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
                />
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

