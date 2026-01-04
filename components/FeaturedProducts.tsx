'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { shopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';

interface Product {
  id: string;
  title: string;
  handle: string;
  description?: string;
  descriptionHtml?: string;
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

interface FeaturedProductItemProps {
  product: Product;
  index: number;
  totalProducts: number;
  scrollYProgress: MotionValue<number>;
}

function FeaturedProductItem({ product, index, totalProducts, scrollYProgress }: FeaturedProductItemProps) {
  const productScrollProgress = useTransform(
    scrollYProgress,
    [
      index / totalProducts,
      (index + 1) / totalProducts,
    ],
    [0, 1]
  );

  const imageY = useTransform(productScrollProgress, [0, 1], [100, -100]);
  const textY = useTransform(productScrollProgress, [0, 1], [-50, 50]);
  const opacity = useTransform(productScrollProgress, [0, 0.3, 0.7, 1], [0.3, 1, 1, 0.3]);

  const firstVariant = product.variants.edges[0]?.node;
  const firstImage = product.images.edges[0]?.node;
  
  // פורמט מחיר פרימיום
  const formatPrice = (amount: string) => {
    const num = parseFloat(amount);
    return Math.round(num).toLocaleString('he-IL');
  };
  
  const price = formatPrice(product.priceRange.minVariantPrice.amount);

  return (
    <motion.div
      style={{ opacity }}
      className="relative min-h-[80vh] md:min-h-[90vh] flex items-center"
    >
      <div className={`w-full grid md:grid-cols-2 gap-4 md:gap-8 items-start ${
        index % 2 === 0 ? '' : 'md:grid-flow-col-dense'
      }`}>
        {/* Image */}
        <motion.div
          style={{ y: imageY }}
          className={`relative aspect-[3/4] overflow-hidden bg-[#f9f9f9] ${
            index % 2 === 0 ? 'md:order-1' : 'md:order-2'
          }`}
        >
          {firstImage?.url ? (
            <Image
              src={firstImage.url}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={index === 0}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-light">
              אין תמונה
            </div>
          )}
        </motion.div>

        {/* Product Info */}
        <motion.div
          style={{ y: textY }}
          className={`text-right ${
            index % 2 === 0 ? 'md:order-2' : 'md:order-1'
          }`}
        >
          <div className="mb-2">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          
          {/* Name, Price, Button in one row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
            <div className="flex-1">
              <h3 className="text-2xl md:text-4xl font-light luxury-font leading-tight text-[#1a1a1a] mb-2">
                {product.title}
              </h3>
              <p className="text-xl md:text-2xl font-light text-[#1a1a1a]">
                ₪{price}
              </p>
            </div>
            
            <Link
              href={`/products/${product.handle}`}
              className="inline-block border border-[#1a1a1a] text-[#1a1a1a] px-6 md:px-8 py-2 md:py-3 text-xs md:text-sm tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury text-center whitespace-nowrap"
            >
              צפה בפרטים
            </Link>
          </div>

          {(product.descriptionHtml || product.description) && (
            <div 
              className="text-sm md:text-base font-light leading-relaxed text-gray-600 line-clamp-2 mt-4"
              dangerouslySetInnerHTML={{ 
                __html: (product.descriptionHtml || product.description || '').substring(0, 150) + '...' 
              }}
            />
          )}

          {index === totalProducts - 1 && (
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-block border border-gray-300 text-gray-600 px-6 md:px-8 py-2 md:py-3 text-xs md:text-sm tracking-luxury uppercase font-light hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-luxury text-center"
              >
                כל הקולקציה
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });
  
  // Scroll indicator opacity - fades out at the very end (98%)
  const scrollIndicatorOpacity = useTransform(scrollYProgress, [0.9, 0.98], [1, 0]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await shopifyClient.request<{
          products: { edges: Array<{ node: Product }> };
        }>(PRODUCTS_QUERY, {
          first: 50,
        });
        // Take only first 4-5 products
        const allProducts = data.products.edges.map((edge) => edge.node);
        setProducts(allProducts.slice(0, 5));
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // פורמט מחיר פרימיום
  const formatPrice = (amount: string) => {
    const num = parseFloat(amount);
    return Math.round(num).toLocaleString('he-IL');
  };

  if (loading) {
    return (
      <section className="w-full bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="space-y-32">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse h-[80vh]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section ref={containerRef} className="w-full bg-white py-20 md:py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 md:mb-32"
        >
          <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light mb-4 block">
            Featured Collection
          </span>
          <h2 className="text-4xl md:text-6xl font-light luxury-font text-[#1a1a1a] mb-4">
            הקולקציה הנבחרת
          </h2>
          <p className="text-sm md:text-base font-light text-gray-600 max-w-2xl mx-auto">
            גלה את התיקים המובילים שלנו - שילוב מושלם של איכות, עיצוב ופונקציונליות
          </p>
        </motion.div>

        {/* Products with Vertical Scroll Animation */}
        <div className="space-y-32 md:space-y-48">
          {products.map((product, index) => (
            <FeaturedProductItem
              key={product.id}
              product={product}
              index={index}
              totalProducts={products.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>

        {/* Scroll Indicator - fades out after scrolling 15% */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          style={{ opacity: scrollIndicatorOpacity }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 hidden md:block"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex flex-col items-center gap-2 text-gray-400"
          >
            <span className="text-xs uppercase tracking-widest font-light">גלול</span>
            <div className="w-px h-8 bg-gray-300" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
