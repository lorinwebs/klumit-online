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
        price: {
          amount: string;
          currencyCode: string;
        };
      };
    }>;
  };
}

export default function SalesPage() {
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
        // Filter products that might be on sale (you can customize this logic)
        // For now, we'll show all products with a sale badge
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold mb-4">מבצעים מיוחדים</h1>
          <p className="text-xl text-gray-600">
            נצל את ההזדמנות לקנות תיקים יוקרתיים במחירים מיוחדים
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-96" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const firstVariant = product.variants.edges[0]?.node;
              const firstImage = product.images.edges[0]?.node;
              // Calculate a "sale" price (20% off for demo)
              const originalPrice = parseFloat(firstVariant?.price.amount || '0');
              const salePrice = (originalPrice * 0.8).toFixed(2);
              
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  title={product.title}
                  handle={product.handle}
                  price={salePrice}
                  currencyCode={product.priceRange.minVariantPrice.currencyCode}
                  image={firstImage?.url}
                  variantId={firstVariant?.id || ''}
                  available={firstVariant?.availableForSale || false}
                  onSale={true}
                  originalPrice={originalPrice.toFixed(2)}
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




