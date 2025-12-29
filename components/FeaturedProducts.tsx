'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';

interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
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

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const nextProduct = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const prevProduct = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  // פורמט מחיר פרימיום
  const formatPrice = (amount: string) => {
    const num = parseFloat(amount);
    return Math.round(num).toLocaleString('he-IL');
  };

  if (loading) {
    return (
      <section className="w-full bg-[#fdfcfb] py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center min-h-[70vh]">
            <div className="bg-gray-200 animate-pulse aspect-[4/5]" />
            <div className="space-y-6">
              <div className="bg-gray-200 animate-pulse h-12 w-3/4" />
              <div className="bg-gray-200 animate-pulse h-32 w-full" />
              <div className="bg-gray-200 animate-pulse h-8 w-1/2" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex];
  const firstVariant = currentProduct.variants.edges[0]?.node;
  const firstImage = currentProduct.images.edges[0]?.node;
  const price = formatPrice(currentProduct.priceRange.minVariantPrice.amount);

  return (
    <section className="w-full bg-[#fdfcfb] py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-4">
        <div className="relative min-h-[70vh] flex items-center justify-center">
          {/* Navigation Arrows */}
          <button
            onClick={prevProduct}
            className="absolute right-0 z-10 p-4 bg-white/80 hover:bg-white border border-gray-200 transition-luxury hidden md:flex items-center justify-center"
            aria-label="מוצר קודם"
          >
            <ChevronRight size={24} className="text-[#1a1a1a]" />
          </button>

          {/* Product Display */}
          <div className="w-full max-w-6xl mx-16 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Image */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`image-${currentIndex}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                className="relative aspect-[4/5] overflow-hidden bg-[#f5f5f5]"
              >
                {firstImage?.url ? (
                  <Image
                    src={firstImage.url}
                    alt={currentProduct.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-light">
                    אין תמונה
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Product Info */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`info-${currentIndex}`}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
                className="text-right space-y-6"
              >
                <div>
                  <h3 className="text-3xl md:text-4xl font-light luxury-font mb-3 leading-tight text-[#1a1a1a]">
                    {currentProduct.title}
                  </h3>
                  <p className="text-sm font-light text-gray-600 tracking-luxury mb-6">
                    תיק ערב בעבודת יד • עור אמיתי • ניטים בגימור זהב
                  </p>
                </div>

                {currentProduct.description && (
                  <div 
                    className="text-base md:text-lg font-light leading-relaxed text-gray-600"
                    dangerouslySetInnerHTML={{ 
                      __html: currentProduct.description.substring(0, 250) + '...' 
                    }}
                  />
                )}

                <div className="pt-4 space-y-6">
                  <div>
                    <p className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-2">
                      ₪{price}
                    </p>
                    <p className="text-xs font-light text-gray-500">כולל מע״מ</p>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/products/${currentProduct.handle}`}
                      className="inline-block border border-[#1a1a1a] text-[#1a1a1a] px-8 py-3 text-sm tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury"
                    >
                      צפה בפרטים
                    </Link>
                    <Link
                      href="/products"
                      className="inline-block border border-gray-300 text-gray-600 px-8 py-3 text-sm tracking-luxury uppercase font-light hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-luxury"
                    >
                      כל הקולקציה
                    </Link>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next Button */}
          <button
            onClick={nextProduct}
            className="absolute left-0 z-10 p-4 bg-white/80 hover:bg-white border border-gray-200 transition-luxury hidden md:flex items-center justify-center"
            aria-label="מוצר הבא"
          >
            <ChevronLeft size={24} className="text-[#1a1a1a]" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prevProduct}
            className="p-2 border border-gray-200 hover:border-[#1a1a1a] transition-luxury"
            aria-label="מוצר קודם"
          >
            <ChevronRight size={20} className="text-[#1a1a1a]" />
          </button>
          <span className="text-sm font-light text-gray-600">
            {currentIndex + 1} / {products.length}
          </span>
          <button
            onClick={nextProduct}
            className="p-2 border border-gray-200 hover:border-[#1a1a1a] transition-luxury"
            aria-label="מוצר הבא"
          >
            <ChevronLeft size={20} className="text-[#1a1a1a]" />
          </button>
        </div>
      </div>
    </section>
  );
}

