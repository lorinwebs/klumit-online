'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { shopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';
import { useCartStore } from '@/store/cartStore';
import { trackAddToCart } from '@/lib/analytics';

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
  variants?: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        quantityAvailable: number | null;
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
    const wasSwipe = useRef<boolean>(false);
    const lastTapTime = useRef<number>(0);
    const tapTimeout = useRef<NodeJS.Timeout | null>(null);
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
      touchEndX.current = 0;
      wasSwipe.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (touchStartX.current === 0) return;
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
      if (!touchStartX.current) {
        touchStartX.current = 0;
        touchEndX.current = 0;
        wasSwipe.current = false;
        return;
      }
      
      const distance = touchStartX.current - touchEndX.current;
      const minSwipeDistance = 50;

      // אם זה swipe משמעותי, נשנה תמונה ונמנע navigation
      if (Math.abs(distance) > minSwipeDistance) {
        e.preventDefault();
        e.stopPropagation();
        wasSwipe.current = true;
        
        // שמור את המצב ב-element כדי שה-Link יוכל לבדוק
        const element = e.currentTarget as HTMLElement;
        (element as any).wasSwipe = true;
        setTimeout(() => {
          (element as any).wasSwipe = false;
        }, 300);
        
        if (distance > 0) {
          // Swipe left - next image
          setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        } else {
          // Swipe right - previous image
          setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        }
        
        // אפס את המצב אחרי זמן קצר
        setTimeout(() => {
          wasSwipe.current = false;
        }, 300);
      } else if (touchEndX.current === 0 || Math.abs(distance) < 10) {
        // Tap (לא swipe) - תן ל-Link לעבוד (לא נמנע navigation)
        // רק tap כפול יחליף תמונה
        const currentTime = Date.now();
        const timeDiff = currentTime - lastTapTime.current;
        
        // אם זה tap כפול (פחות מ-300ms מהקודם), החלף תמונה
        if (timeDiff < 300 && timeDiff > 0) {
          // Double tap - change image
          e.preventDefault();
          e.stopPropagation();
          
          // שמור את המצב ב-element כדי שה-Link יוכל לבדוק
          const element = e.currentTarget as HTMLElement;
          (element as any).wasDoubleTap = true;
          setTimeout(() => {
            (element as any).wasDoubleTap = false;
          }, 300);
          
          if (tapTimeout.current) {
            clearTimeout(tapTimeout.current);
            tapTimeout.current = null;
          }
          lastTapTime.current = 0;
          if (images.length > 1) {
            setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
          }
          return;
        }
        
        // Single tap - תן ל-Link לעבוד (לא נמנע navigation)
        lastTapTime.current = currentTime;
        
        // אם אין tap כפול תוך 300ms, נאפס
        tapTimeout.current = setTimeout(() => {
          lastTapTime.current = 0;
        }, 300);
      } else {
        // אם אין swipe - נאפס מיד כדי שה-click יעבוד
        wasSwipe.current = false;
      }

      // Reset
      touchStartX.current = 0;
      touchEndX.current = 0;
    };


    const handleMouseEnter = () => {
      if (images.length > 1) {
        setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      }
    };

    return (
      <div 
        data-carousel
        className="relative w-full h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
      >
        {/* Image Container */}
        <div className="relative w-full h-full pointer-events-none">
          <Image
            src={images[currentImageIndex].node.url}
            alt={images[currentImageIndex].node.altText || product.title}
            fill
            className="object-cover transition-opacity duration-300 pointer-events-none"
            sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            loading="lazy"
          />
        </div>

        {/* Image Dots Indicator - minimal */}
        {images.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10 flex gap-0.5 pointer-events-none">
            {images.map((_, index) => (
              <div
                key={index}
                className={`h-0.5 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'bg-[#1a1a1a] w-2' 
                    : 'bg-[#1a1a1a]/30 w-1'
                }`}
                aria-label={`תמונה ${index + 1} מתוך ${images.length}`}
              />
            ))}
          </div>
        )}
        
        {/* Mobile tap hint */}
        {images.length > 1 && (
          <div className="absolute top-1 right-1 md:hidden z-10 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {images.length} תמונות
          </div>
        )}
      </div>
    );
  }

  if (products.length === 0) return null;

  // Show first 12 products in compact grid
  const displayProducts = products.slice(0, 12);

  // Product Card Component with Add to Cart
  function ProductCard({ product, index }: { product: Product; index: number }) {
    const addItem = useCartStore((state) => state.addItem);
    const [isAdding, setIsAdding] = useState(false);
    const [showToast, setShowToast] = useState(false);
    
    // Get first available variant or first variant
    const firstVariant = product.variants?.edges?.[0]?.node;
    const availableVariant = product.variants?.edges?.find(v => v.node.availableForSale)?.node || firstVariant;
    const firstImage = product.images.edges[0]?.node;
    
    const handleAddToCart = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!availableVariant || !availableVariant.availableForSale || isAdding) {
        return;
      }
      
      setIsAdding(true);
      
      try {
        await addItem({
          id: availableVariant.id,
          variantId: availableVariant.id,
          title: product.title,
          price: availableVariant.price.amount,
          currencyCode: availableVariant.price.currencyCode,
          image: firstImage?.url || '',
          available: availableVariant.availableForSale,
          quantityAvailable: availableVariant.quantityAvailable ?? undefined,
          handle: product.handle,
          variantTitle: availableVariant.title,
        });
        
        // Track add to cart
        trackAddToCart({
          id: availableVariant.id,
          name: product.title,
          price: parseFloat(availableVariant.price.amount),
          currency: availableVariant.price.currencyCode,
          variant: availableVariant.title,
          quantity: 1,
        });
        
        // Show toast
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 2000);
      } catch (error) {
        console.error('Error adding to cart:', error);
      } finally {
        setTimeout(() => {
          setIsAdding(false);
        }, 500);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className="group relative"
      >
        <div className="block">
          {/* Product Image - Smaller */}
          <Link 
            href={`/products/${product.handle}`} 
            className="relative aspect-[3/4] bg-[#fafafa] overflow-hidden mb-1 group-hover:opacity-90 transition-opacity duration-300 block"
            onClick={(e) => {
              // אם היה swipe או tap כפול, אל תעבור לדף המוצר
              const carouselDiv = e.currentTarget.querySelector('[data-carousel]') as HTMLElement;
              if (carouselDiv && ((carouselDiv as any).wasSwipe || (carouselDiv as any).wasDoubleTap)) {
                e.preventDefault();
              }
            }}
          >
            <ProductImageCarousel product={product} />
            
            {/* Add to Cart Button - Overlay */}
            {availableVariant && availableVariant.availableForSale && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart(e);
                }}
                disabled={isAdding}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white px-3 md:px-4 py-1.5 md:py-2 text-[9px] md:text-[10px] tracking-luxury uppercase font-light hover:bg-[#2a2a2a] active:bg-[#3a3a3a] transition-all duration-300 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation whitespace-nowrap rounded-sm z-20"
                style={{ WebkitTapHighlightColor: 'transparent' }}
                aria-label="הוסף לעגלה"
              >
                {isAdding ? 'מוסיף...' : 'הוסף לעגלה'}
              </button>
            )}
          </Link>

          {/* Product Info - Compact */}
          <Link href={`/products/${product.handle}`} className="block space-y-1.5 text-center">
            <h3 className="text-[10px] md:text-xs font-light text-[#1a1a1a] group-hover:text-gray-600 transition-colors line-clamp-2">
              {product.title}
            </h3>
            <p className="text-[10px] md:text-xs font-light text-gray-500">
              ₪{formatPrice(product.priceRange.minVariantPrice.amount)}
            </p>
          </Link>
        </div>
        
        {/* Toast Notification */}
        {showToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] text-white px-3 py-2 text-[10px] rounded z-20 pointer-events-none"
          >
            נוסף לעגלה
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8, delay }}
      className="mb-6 md:mb-8"
    >
      {/* Category Header */}
      <div className="flex justify-between items-end mb-2 md:mb-3 px-4 md:px-8">
        <div className="text-left">
          <span className="block text-xs tracking-[0.25em] uppercase text-[#1a1a1a] mb-0.5 font-light opacity-60">{subtitle}</span>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-light luxury-font text-[#1a1a1a]">{title}</h2>
        </div>
        <Link 
          href="/products?tab=bags" 
          className="text-xs tracking-[0.2em] uppercase text-gray-500 hover:text-[#1a1a1a] transition-colors"
        >
          צפה בכל →
        </Link>
      </div>

      {/* Compact Grid Layout */}
      <div className="px-4 md:px-8">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 md:gap-2">
          {displayProducts.map((product, index) => (
            <ProductCard 
              key={product.id}
              product={product}
              index={index}
            />
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
    <section className="w-full bg-[#fdfcfb] pt-2 md:pt-3 pb-2">
      <div className="max-w-[1800px] mx-auto">
        {/* Section Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-2 md:mb-3 px-4"
        >
          <span className="text-xs md:text-sm tracking-[0.3em] uppercase text-gray-400 mb-1 block font-light">2026</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-light luxury-font text-[#2c2c2c] tracking-wide leading-tight">הקולקציה</h2>
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
