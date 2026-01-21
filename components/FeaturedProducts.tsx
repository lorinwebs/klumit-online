'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { shopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';

interface Product {
  id: string;
  title: string;
  handle: string;
  productType: string;
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
}

interface CategoryProducts {
  bags: Product[];
  wallets: Product[];
  belts: Product[];
}

// Horizontal scroll carousel for each category
function CategoryCarousel({ 
  title, 
  subtitle,
  products, 
  delay = 0 
}: { 
  title: string; 
  subtitle: string;
  products: Product[]; 
  delay?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;
      // RTL: scrollLeft is negative or 0 at start, goes more negative as you scroll
      const absScrollLeft = Math.abs(scrollLeft);
      setCanScrollRight(absScrollLeft > 10);
      setCanScrollLeft(absScrollLeft < maxScroll - 10);
    }
  };

  useEffect(() => {
    // Check scroll after a small delay to ensure DOM is ready
    const timer = setTimeout(checkScroll, 100);
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      return () => {
        clearTimeout(timer);
        ref.removeEventListener('scroll', checkScroll);
      };
    }
    return () => clearTimeout(timer);
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      // RTL: scroll direction is inverted
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const formatPrice = (amount: string) => {
    const num = parseFloat(amount);
    return Math.round(num).toLocaleString('he-IL');
  };

  // Product Image Carousel Component
  function ProductImageCarousel({ product }: { product: Product }) {
    const router = useRouter();
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const touchStartX = useRef<number>(0);
    const touchEndX = useRef<number>(0);
    const hasSwiped = useRef<boolean>(false);
    const swipeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const images = product.images.edges;

    if (images.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <span className="text-sm">אין תמונה</span>
        </div>
      );
    }

    const handleTouchStart = (e: React.TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      hasSwiped.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (touchStartX.current === 0) return;
      touchEndX.current = e.touches[0].clientX;
      // אם יש תנועה משמעותית, זה swipe
      if (Math.abs(touchStartX.current - touchEndX.current) > 10) {
        hasSwiped.current = true;
      }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartX.current) {
        touchStartX.current = 0;
        touchEndX.current = 0;
        return;
      }
      
      if (touchEndX.current === 0) {
        // אם אין תנועה, זה tap - תן ל-Link לעבוד
        touchStartX.current = 0;
        hasSwiped.current = false;
        return;
      }
      
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;

      // רק אם זה swipe משמעותי, נשנה תמונה ונמנע navigation
      if (Math.abs(distance) > minSwipeDistance && hasSwiped.current) {
        e.preventDefault();
        e.stopPropagation();
        
        if (distance > 0) {
          // Swipe left - next image
          setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        } else {
          // Swipe right - previous image
          setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        }
        
        // שמור את מצב ה-swipe לזמן קצר כדי למנוע click
        if (swipeTimeoutRef.current) {
          clearTimeout(swipeTimeoutRef.current);
        }
        swipeTimeoutRef.current = setTimeout(() => {
          hasSwiped.current = false;
        }, 500);
      } else {
        // אם אין swipe - נאפס מיד כדי שה-click יעבוד
        hasSwiped.current = false;
      }

      // Reset
      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    const handleClick = () => {
      // אם היה swipe, לא נכנס לדף המוצר
      if (hasSwiped.current) {
        return;
      }
      // אחרת - נווט לדף המוצר
      router.push(`/products/${product.handle}`);
    };

    return (
      <div 
        className="relative w-full h-full block touch-manipulation cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Image Container */}
        <div className="relative w-full h-full">
          <Image
            src={images[currentImageIndex].node.url}
            alt={images[currentImageIndex].node.altText || product.title}
            fill
            className="object-cover transition-opacity duration-500"
            sizes="(max-width: 768px) 34vw, (max-width: 1024px) 30vw, 18vw"
            loading="eager"
            priority
          />
        </div>

        {/* Image Dots Indicator - only show if more than 1 image */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
            {images.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/40 w-1.5'
                }`}
                aria-label={`תמונה ${index + 1} מתוך ${images.length}`}
              />
            ))}
          </div>
        )}

        {/* Hover areas for navigation - left and right halves (desktop only) */}
        {images.length > 1 && (
          <>
            <div
              onMouseEnter={() => {
                setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              className="hidden md:block absolute left-0 top-0 bottom-0 w-1/2 z-10 pointer-events-none"
              aria-label="תמונה קודמת"
            />
            <div
              onMouseEnter={() => {
                setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              className="hidden md:block absolute right-0 top-0 bottom-0 w-1/2 z-10 pointer-events-none"
              aria-label="תמונה הבאה"
            />
          </>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/10 transition-colors duration-500" />
        
        {/* Quick View Button - hidden on mobile */}
        <div className="hidden md:block absolute bottom-4 left-4 right-4 opacity-0 group-hover/card:opacity-100 transform translate-y-4 group-hover/card:translate-y-0 transition-all duration-500 z-10">
          <span className="block w-full bg-white/95 backdrop-blur-sm text-[#1a1a1a] text-center py-3 text-xs tracking-[0.2em] uppercase">
            צפה במוצר
          </span>
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, delay }}
      className="mb-8 md:mb-12"
    >
      {/* Category Header */}
      <div className="flex justify-between items-end mb-8 md:mb-12 px-4 md:px-8">
        <div className="text-left">
          <span className="block text-xs tracking-[0.3em] uppercase text-[#c9a962] mb-2">{subtitle}</span>
          <h2 className="text-3xl md:text-5xl font-light luxury-font text-[#1a1a1a]">{title}</h2>
        </div>
        <Link 
          href="/products?tab=bags" 
          className="text-xs tracking-[0.2em] uppercase text-gray-500 hover:text-[#1a1a1a] transition-colors border-b border-transparent hover:border-gray-400 pb-1"
        >
          צפה בכל
        </Link>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Navigation Arrows */}
        <button
          onClick={() => scroll('left')}
          className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center transition-all duration-300 ${
            canScrollLeft ? 'opacity-100 hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a]' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="הקודם"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={() => scroll('right')}
          className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 md:w-14 md:h-14 bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center transition-all duration-300 ${
            canScrollRight ? 'opacity-100 hover:bg-[#1a1a1a] hover:text-white hover:border-[#1a1a1a]' : 'opacity-0 pointer-events-none'
          }`}
          aria-label="הבא"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Scrollable Products */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4 snap-x snap-mandatory"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[34vw] md:w-[30vw] lg:w-[22vw] xl:w-[18vw] snap-start group/card"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Product Image with Luxury Frame */}
                <div className="relative p-2 bg-white mb-4 shadow-[0_2px_15px_rgba(0,0,0,0.08)] group-hover/card:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-shadow duration-500">
                  <div className="relative aspect-[3/4] bg-[#f5f5f3] overflow-hidden">
                    <ProductImageCarousel product={product} />
                  </div>
                </div>

                {/* Product Info - Minimal - Clickable on mobile */}
                <Link href={`/products/${product.handle}`} className="flex items-start justify-between gap-2">
                  <h3 className="text-lg md:text-xl font-light text-[#1a1a1a] text-left group-hover/card:text-gray-600 transition-colors flex-1 min-w-0">
                    {product.title}
                  </h3>
                  <p className="text-base md:text-lg font-light text-gray-500 text-right flex-shrink-0 whitespace-nowrap">
                    ₪{formatPrice(product.priceRange.minVariantPrice.amount)}
                  </p>
                </Link>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturedProducts() {
  const [categories, setCategories] = useState<CategoryProducts>({
    bags: [],
    wallets: [],
    belts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Query products from collection "2026" sorted by newest first
        const data = await shopifyClient.request<{
          products: { edges: Array<{ node: Product }> };
        }>(PRODUCTS_QUERY, {
          first: 50,
          query: 'collection:2026',
          sortKey: 'CREATED_AT',
          reverse: true,
        });

        const allProducts = data.products.edges.map((edge) => edge.node);
        
        // Categorize products by productType or title keywords
        const categorized: CategoryProducts = {
          bags: [],
          wallets: [],
          belts: []
        };

        allProducts.forEach(product => {
          const type = (product.productType || '').toLowerCase();
          const title = product.title.toLowerCase();
          
          if (type.includes('bag') || type.includes('תיק') || title.includes('תיק') || title.includes('bag')) {
            categorized.bags.push(product);
          } else if (type.includes('wallet') || type.includes('ארנק') || title.includes('ארנק') || title.includes('wallet')) {
            categorized.wallets.push(product);
          } else if (type.includes('belt') || type.includes('חגור') || title.includes('חגור') || title.includes('belt')) {
            categorized.belts.push(product);
          }
        });

        // If no categorization found, split products evenly
        if (categorized.bags.length === 0 && categorized.wallets.length === 0 && categorized.belts.length === 0) {
          categorized.bags = allProducts.slice(0, 3);
          categorized.wallets = allProducts.slice(3, 6);
          categorized.belts = allProducts.slice(6, 9);
        }

        setCategories(categorized);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-[#fdfcfb] py-16 md:py-24">
        <div className="max-w-[1800px] mx-auto">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-20 px-4 md:px-8">
              <div className="h-8 w-32 bg-gray-200 animate-pulse mb-8 mr-auto" />
              <div className="flex gap-6 overflow-hidden">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex-shrink-0 w-[75vw] md:w-[30vw]">
                    <div className="aspect-[3/4] bg-gray-200 animate-pulse mb-4" />
                    <div className="h-5 bg-gray-200 animate-pulse w-2/3 mr-auto mb-2" />
                    <div className="h-4 bg-gray-200 animate-pulse w-1/3 mr-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const hasProducts = categories.bags.length > 0 || categories.wallets.length > 0 || categories.belts.length > 0;

  if (!hasProducts) {
    return null;
  }

  return (
    <section className="w-full bg-[#fdfcfb] pt-8 md:pt-12 pb-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Section Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-10 px-4"
        >
          <span className="text-xs tracking-[0.4em] uppercase text-[#c9a962] mb-4 block">2026</span>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-light luxury-font text-[#1a1a1a]">הקולקציה</h2>
        </motion.div>

        {/* Category Carousels */}
        {categories.bags.length > 0 && (
          <CategoryCarousel 
            title="תיקים" 
            subtitle="Bags" 
            products={categories.bags} 
            delay={0} 
          />
        )}
        
        {categories.wallets.length > 0 && (
          <CategoryCarousel 
            title="ארנקים" 
            subtitle="Wallets" 
            products={categories.wallets} 
            delay={0.1} 
          />
        )}
        
        {categories.belts.length > 0 && (
          <CategoryCarousel 
            title="חגורות" 
            subtitle="Belts" 
            products={categories.belts} 
            delay={0.2} 
          />
        )}

      </div>
    </section>
  );
}
