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
      className="relative min-h-[80vh] md:min-h-[90vh] flex items-center"
    >
      <div className={`w-full grid md:grid-cols-2 gap-8 md:gap-16 items-center ${
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
          className={`text-right flex flex-col justify-center h-full px-4 md:px-12 ${
            index % 2 === 0 ? 'md:order-2' : 'md:order-1'
          }`}
        >
          <div className="mb-6">
            <span className="text-xs uppercase tracking-[0.3em] text-gray-400 font-light">
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          
          <h3 className="text-3xl md:text-5xl lg:text-6xl font-light luxury-font leading-tight text-[#1a1a1a] mb-4">
            {product.title}
          </h3>
          
          <p className="text-2xl md:text-3xl font-light text-[#1a1a1a] mb-8">
            ₪{price}
          </p>

          {(product.descriptionHtml || product.description) && (
            <div 
              className="text-base md:text-lg lg:text-xl font-light leading-loose text-gray-500 mb-10 max-w-lg luxury-font"
              dangerouslySetInnerHTML={{ 
                __html: (product.descriptionHtml || product.description || '').substring(0, 250) + '...' 
              }}
            />
          )}
          
          <Link
            href={`/products/${product.handle}`}
            className="inline-block border border-[#1a1a1a] text-[#1a1a1a] px-8 md:px-10 py-3 md:py-4 text-xs md:text-sm tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury text-center w-fit"
          >
            צפה בפרטים
          </Link>
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
        // Query with sortKey and timestamp to bypass cache
        const PRODUCTS_QUERY_NOCACHE = `
          query getProducts($first: Int!) {
            products(first: $first, sortKey: UPDATED_AT, reverse: true) {
              edges {
                node {
                  id
                  title
                  handle
                  description
                  descriptionHtml
                  productType
                  updatedAt
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  images(first: 5) {
                    edges {
                      node {
                        url
                        altText
                      }
                    }
                  }
                  variants(first: 10) {
                    edges {
                      node {
                        id
                        title
                        price {
                          amount
                          currencyCode
                        }
                        availableForSale
                        quantityAvailable
                      }
                    }
                  }
                }
              }
            }
          }
        `;
        
        // Add cache-busting query parameter
        const cacheBuster = `_cb=${Date.now()}`;
        const data = await shopifyClient.request<{
          products: { edges: Array<{ node: Product }> };
        }>(PRODUCTS_QUERY_NOCACHE + `# ${cacheBuster}`, {
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
    <section ref={containerRef} className="w-full bg-white pt-20 md:pt-32 pb-10 md:pb-16 relative overflow-hidden">
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
              key={`x-${product.id}`}
              product={product}
              index={index}
              totalProducts={products.length}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </div>

        {/* All Collection Button - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-24 md:mt-32"
        >
          <Link
            href="/products"
            className="inline-block border border-[#1a1a1a] text-[#1a1a1a] px-10 md:px-14 py-4 md:py-5 text-sm md:text-base tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury"
          >
            כל הקולקציה
          </Link>
        </motion.div>

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
