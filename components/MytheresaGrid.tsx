'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { shopifyClient, PRODUCTS_LIST_QUERY, getCategorySearchQuery } from '@/lib/shopify';
import { useLanguage } from '@/lib/LanguageContext';
import { isProductSoldOut } from '@/lib/product-availability';
import SoldOutBadge from '@/components/SoldOutBadge';

interface Product {
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

interface MytheresaGridProps {
  category?: 'bags' | 'belts' | 'wallets' | 'all' | 'ss26';
  maxProducts?: number;
  showViewAll?: boolean;
  /** When embedded on homepage: no #products id (parent section owns anchor) */
  embedOnHome?: boolean;
  /** Pre-filter by brand/vendor (case-insensitive substring, e.g. "valentino") */
  initialVendor?: string;
}

const CARD_BACKGROUNDS = ['#f3efe8', '#f5f5f5', '#f0eeef', '#f6f1f3', '#eef1f0', '#f4f2ed'];

/** Two rows: 2-col mobile → 4, 3-col md → 6, 4-col lg → 8 */
function getTwoRowPageSize() {
  if (typeof window === 'undefined') return 8;
  if (window.matchMedia('(min-width: 1024px)').matches) return 8;
  if (window.matchMedia('(min-width: 768px)').matches) return 6;
  return 4;
}

function LoadMoreDots() {
  return (
    <div className="flex items-center justify-center gap-2 py-10" aria-hidden>
      <span className="w-1.5 h-1.5 rounded-full bg-black/25 animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-black/35 animate-pulse" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-black/25 animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function getCardBackground(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i) * (i + 1)) % CARD_BACKGROUNDS.length;
  return CARD_BACKGROUNDS[Math.abs(hash) % CARD_BACKGROUNDS.length];
}

function getSaleInfo(product: Product) {
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const compareAt = parseFloat(product.compareAtPriceRange?.minVariantPrice?.amount || '0');
  const variantCompare = product.variants?.edges
    .map((e) => parseFloat(e.node.compareAtPrice?.amount || '0'))
    .find((v) => v > price);
  const original = compareAt > price ? compareAt : variantCompare && variantCompare > price ? variantCompare : 0;
  if (!original || original <= price) return null;
  const percent = Math.round(((original - price) / original) * 100);
  if (percent <= 0) return null;
  return { original, percent, price };
}

function getSizeOptions(product: Product) {
  const sizes: string[] = [];
  const seen = new Set<string>();
  for (const edge of product.variants?.edges || []) {
    const sizeOpt = edge.node.selectedOptions?.find((o) =>
      /size|מידה|מידת|pointure|taille/i.test(o.name)
    );
    const value = sizeOpt?.value || (edge.node.title !== 'Default Title' ? edge.node.title : null);
    if (!value || seen.has(value) || !edge.node.availableForSale) continue;
    // Skip if looks like a full color name without size digits for bag products
    seen.add(value);
    sizes.push(value);
  }
  return sizes.slice(0, 8);
}

// Product image with arrows + optional size row (TaliaSol style)
function ProductImageSlider({
  images,
  title,
  handle,
  soldOut,
  sizes,
  background,
  salePercent,
  isNew,
  priority = false,
}: {
  images: Array<{ node: { url: string; altText: string | null } }>;
  title: string;
  handle: string;
  soldOut?: boolean;
  sizes: string[];
  background: string;
  salePercent?: number | null;
  isNew?: boolean;
  priority?: boolean;
}) {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Preload alternate images only on hover (keeps first paint fast)
  useEffect(() => {
    if (!isHovered || images.length < 2) return;
    images.slice(1, 3).forEach((edge) => {
      const img = new window.Image();
      img.src = edge.node.url;
    });
  }, [isHovered, images]);

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((i) => (i + 1) % images.length);
  };

  return (
    <div
      className="relative aspect-[3/4] mb-3 overflow-hidden group/image"
      style={{ backgroundColor: background }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${handle}`} className="absolute inset-0 z-0 block">
        {images[currentImageIndex] ? (
          <Image
            key={currentImageIndex}
            src={images[currentImageIndex].node.url}
            alt={images[currentImageIndex].node.altText || title}
            fill
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            quality={70}
            decoding="async"
            className="object-contain object-center p-3 md:p-5"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-black/30 text-sm font-light">
            —
          </span>
        )}
      </Link>

      {/* Sale badges — top start (TaliaSol) */}
      {salePercent != null && salePercent > 0 && !soldOut && (
        <div className="absolute top-2 start-2 z-20 flex flex-col items-stretch gap-0 pointer-events-none">
          <span className="bg-white border border-black px-2 py-0.5 text-[10px] md:text-[11px] font-medium tracking-[0.12em] uppercase text-black text-center leading-none">
            {t('products.sale')}
          </span>
          <span className="bg-black px-2 py-0.5 text-[10px] md:text-[11px] font-medium tracking-[0.08em] text-white text-center leading-none">
            - {salePercent}%
          </span>
        </div>
      )}

      {isNew && !soldOut && (
        <div className="absolute top-2 end-2 z-20 bg-white border border-black px-2 py-0.5 text-[10px] md:text-[11px] font-medium tracking-[0.12em] uppercase text-black leading-none pointer-events-none">
          {t('products.newTag')}
        </div>
      )}

      {soldOut && <SoldOutBadge />}

      {/* Image arrows — always on mobile, on hover on desktop (TaliaSol style) */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className={`absolute left-1 md:left-1.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-black/55 hover:text-black transition-all duration-300 opacity-100 md:opacity-0 ${
              isHovered ? 'md:opacity-100' : ''
            }`}
            aria-label={t('products.previousImage')}
          >
            <ChevronLeft size={26} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className={`absolute right-1 md:right-1.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-black/55 hover:text-black transition-all duration-300 opacity-100 md:opacity-0 ${
              isHovered ? 'md:opacity-100' : ''
            }`}
            aria-label={t('products.nextImage')}
          >
            <ChevronRight size={26} strokeWidth={2.25} />
          </button>

          {/* Image position dots */}
          <div className="absolute bottom-2 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-10 flex items-center gap-1 pointer-events-none">
            {images.slice(0, 6).map((_, i) => (
              <span
                key={i}
                className={`w-1 h-1 rounded-full transition-colors duration-200 ${
                  i === currentImageIndex ? 'bg-black/70' : 'bg-black/20'
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* Size row on hover */}
      {sizes.length > 1 && (
        <div
          className={`hidden md:flex absolute bottom-0 inset-x-0 z-30 items-center gap-1.5 px-2.5 py-2 bg-gradient-to-t from-black/5 to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-black/45 shrink-0">
            {t('products.size')}
          </span>
          <div className="flex flex-wrap gap-1 justify-end flex-1">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedSize(size);
                  window.location.href = `/products/${handle}`;
                }}
                className={`min-w-[28px] h-7 px-1.5 flex items-center justify-center text-[10px] border transition-colors ${
                  selectedSize === size
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-black/25 hover:border-black'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MytheresaGrid({ 
  category = 'all',
  maxProducts,
  showViewAll = false,
  embedOnHome = false,
  initialVendor,
}: MytheresaGridProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'price-low' | 'price-high'>('new');
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreLock = useRef(false);

  useEffect(() => {
    setSelectedVendors(new Set());
    setShowFilters(false);
  }, [category]);

  // Pre-select brand filter when arriving from a Brands menu link (?vendor=...)
  useEffect(() => {
    if (!initialVendor || products.length === 0) return;
    const matches = Array.from(new Set(products.map((p) => p.vendor || 'KLUMIT'))).filter((v) =>
      v.toLowerCase().includes(initialVendor.toLowerCase())
    );
    if (matches.length > 0) {
      setSelectedVendors(new Set(matches));
    }
  }, [initialVendor, products]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      setLoading(true);
      try {
        const searchQuery = getCategorySearchQuery(category);
        // Categories are filtered client-side, so fetch a wider slim page for them
        const first =
          typeof maxProducts === 'number' && category === 'ss26'
            ? Math.min(Math.max(maxProducts + 4, 12), 24)
            : 100;

        const data = await shopifyClient.request<{
          products: { edges: Array<{ node: Product }> };
        }>(PRODUCTS_LIST_QUERY, {
          first,
          query: searchQuery,
          sortKey: 'CREATED_AT',
          reverse: true,
        });

        if (cancelled) return;

        let allProducts = data.products.edges.map((edge) => edge.node);

        // Fallback client filter if Shopify search returns mixed types
        if (category !== 'all' && category !== 'ss26') {
          allProducts = allProducts.filter((product) => {
            const type = (product.productType || '').toLowerCase();
            const title = product.title.toLowerCase();
            if (category === 'bags') {
              return type.includes('bag') || type.includes('תיק') || title.includes('תיק') || title.includes('bag');
            }
            if (category === 'wallets') {
              return type.includes('wallet') || type.includes('ארנק') || title.includes('ארנק') || title.includes('wallet');
            }
            if (category === 'belts') {
              return type.includes('belt') || type.includes('חגור') || title.includes('חגור') || title.includes('belt');
            }
            return true;
          });
        }

        setProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [category, maxProducts]);

  // Close dropdowns on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSort(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const formatPrice = (amount: string) => {
    const num = parseFloat(amount);
    return Math.round(num).toLocaleString('he-IL');
  };

  const toggleVendor = (vendor: string) => {
    setSelectedVendors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vendor)) {
        newSet.delete(vendor);
      } else {
        newSet.add(vendor);
      }
      return newSet;
    });
  };

  // Get unique vendors from products
  const uniqueVendors = useMemo(
    () => Array.from(new Set(products.map((p) => p.vendor || 'KLUMIT'))).sort(),
    [products]
  );

  const sortedProducts = useMemo(() => {
    const filtered =
      selectedVendors.size > 0
        ? products.filter((p) => selectedVendors.has(p.vendor || 'KLUMIT'))
        : products;

    return [...filtered].sort((a, b) => {
      const aSold = isProductSoldOut(a);
      const bSold = isProductSoldOut(b);
      if (aSold !== bSold) {
        return aSold ? 1 : -1;
      }

      if (sortBy === 'new') {
        const aIsNew = a.tags?.some((tag) => tag.toLowerCase() === 'new_arrival') || false;
        const bIsNew = b.tags?.some((tag) => tag.toLowerCase() === 'new_arrival') || false;
        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      if (sortBy === 'price-low') {
        return (
          parseFloat(a.priceRange.minVariantPrice.amount) -
          parseFloat(b.priceRange.minVariantPrice.amount)
        );
      }
      return (
        parseFloat(b.priceRange.minVariantPrice.amount) -
        parseFloat(a.priceRange.minVariantPrice.amount)
      );
    });
  }, [products, selectedVendors, sortBy]);

  const productPool = useMemo(
    () => (maxProducts ? sortedProducts.slice(0, maxProducts) : sortedProducts),
    [sortedProducts, maxProducts]
  );

  // Reset to two rows when category / filters / sort change
  useEffect(() => {
    setVisibleCount(getTwoRowPageSize());
    loadingMoreLock.current = false;
    setLoadingMore(false);
  }, [category, sortBy, selectedVendors, maxProducts, productPool.length]);

  useEffect(() => {
    const onResize = () => {
      setVisibleCount((prev) => {
        const page = getTwoRowPageSize();
        // Never shrink below already-loaded rows; grow page size if viewport widens on first page
        return prev <= page ? page : prev;
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const visibleProducts = productPool.slice(0, visibleCount);
  const hasMore = visibleCount < productPool.length;

  const loadMore = useCallback(() => {
    if (loadingMoreLock.current || !hasMore) return;
    loadingMoreLock.current = true;
    setLoadingMore(true);
    const page = getTwoRowPageSize();
    window.setTimeout(() => {
      setVisibleCount((c) => Math.min(c + page, productPool.length));
      setLoadingMore(false);
      loadingMoreLock.current = false;
    }, 280);
  }, [hasMore, productPool.length]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '320px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadMore, visibleCount]);

  if (loading) {
    return (
      <div className={embedOnHome ? 'min-h-0 bg-cream' : 'min-h-screen bg-cream'}>
        <div className={`${embedOnHome ? 'relative' : 'sticky top-[160px] md:top-[170px] z-40'} border-b ${embedOnHome ? 'bg-cream border-black/10' : 'bg-cream border-black/10'}`}>
          <div className="grid grid-cols-2 md:hidden">
            <div className="h-12 border-l border-black/10 skeleton-shimmer" />
            <div className="h-12 skeleton-shimmer" />
          </div>
          <div className="hidden md:flex max-w-7xl mx-auto px-6 py-3 items-center justify-between">
            <div className="h-8 w-24 skeleton-shimmer rounded" />
            <div className="h-8 w-20 skeleton-shimmer rounded" />
          </div>
        </div>
        <div
          className={`mx-auto max-w-7xl py-6 ${embedOnHome ? 'px-5 md:px-6' : 'px-4 md:px-6'}`}
        >
          <div className="grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-3 md:gap-x-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={
                  i < 4 ? 'block' : i < 6 ? 'hidden md:block' : 'hidden lg:block'
                }
              >
                <div className="aspect-[3/4] skeleton-shimmer mb-3" />
                <div className="h-3 skeleton-shimmer mb-2 w-1/3 mx-auto" />
                <div className="h-4 skeleton-shimmer mb-1.5 w-2/3 mx-auto" />
                <div className="h-3 skeleton-shimmer w-1/4 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...(embedOnHome ? {} : { id: 'products' })}
      className={embedOnHome ? 'min-h-0 bg-cream' : 'min-h-screen bg-cream'}
    >
      {/* Overlay for dropdowns */}
      {(showSort || showFilters) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowSort(false);
            setShowFilters(false);
          }}
        />
      )}

      {/* Filters & Sort Bar — sticky on product page, static when embedded on the home */}
      <div
        className={`${
          embedOnHome
            ? 'relative bg-cream border-black/10'
            : `sticky ${showViewAll ? 'top-[168px] md:top-[170px]' : 'top-[96px] md:top-[70px]'} z-40 bg-cream/95 border-black/10`
        } border-b`}
      >
        {/* Mobile: Full width grid */}
        <div className="grid grid-cols-2 md:hidden">
          {/* Filters Button - Full width */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="relative flex items-center justify-center gap-2 h-12 border-l border-black/10 hover:bg-black/[0.03] transition-colors duration-300"
          >
            <SlidersHorizontal size={16} className="text-black" />
            <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-black">{t('products.filter')}</span>
            {selectedVendors.size > 0 && (
              <span className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full" />
            )}
          </button>

          {/* Sort Button - Full width */}
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center justify-center gap-2 h-12 hover:bg-black/[0.03] transition-colors duration-300"
          >
            <span className="text-[11px] font-medium tracking-[0.18em] uppercase text-black">{t('products.sort')}</span>
          </button>
        </div>

        {/* Desktop: Filters and Sort side by side */}
        <div className="hidden md:flex max-w-7xl mx-auto px-6 py-3 items-center gap-3">
          {/* Filters Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium tracking-[0.18em] uppercase border border-black/15 hover:border-black transition-colors duration-300 bg-white relative"
            >
              <span>{t('products.filter')}</span>
              <SlidersHorizontal size={14} className="text-black" />
              {selectedVendors.size > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-[8px] flex items-center justify-center rounded-full">
                  {selectedVendors.size}
                </span>
              )}
            </button>
            
            {/* Filters Dropdown - Desktop only */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 bg-white border border-black/10 shadow-sm z-50 min-w-[200px] max-h-[400px] overflow-y-auto"
              >
                <div className="p-2">
                  <div className="text-[10px] font-medium tracking-[0.18em] uppercase text-black/45 px-2 py-2 border-b border-black/10">
                    מותגים
                  </div>
                  {uniqueVendors.map((vendor) => (
                    <button
                      key={vendor}
                      onClick={() => toggleVendor(vendor)}
                      className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-black/[0.04] transition-colors duration-200 ${
                        selectedVendors.has(vendor) ? 'font-medium bg-black/[0.04] text-black' : 'font-normal text-black/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{vendor}</span>
                        {selectedVendors.has(vendor) && (
                          <span className="text-black">✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sort Button */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium tracking-[0.18em] uppercase border border-black/15 hover:border-black transition-colors duration-300 bg-white"
            >
              <span>{t('products.sort')}</span>
              <SlidersHorizontal size={14} className="text-black" />
            </button>
            
            {/* Sort Dropdown - Desktop only */}
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 bg-white border border-black/10 shadow-sm z-50 min-w-[200px]"
              >
                <button
                  onClick={() => {
                    setSortBy('new');
                    setShowSort(false);
                  }}
                  className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-black/[0.04] transition-colors duration-200 ${
                    sortBy === 'new' ? 'font-medium bg-black/[0.04] text-black' : 'font-normal text-black/60'
                  }`}
                >
                  {t('products.newest')}
                </button>
                <button
                  onClick={() => {
                    setSortBy('price-low');
                    setShowSort(false);
                  }}
                  className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-black/[0.04] transition-colors duration-200 ${
                    sortBy === 'price-low' ? 'font-medium bg-black/[0.04] text-black' : 'font-normal text-black/60'
                  }`}
                >
                  {t('products.priceLowHigh')}
                </button>
                <button
                  onClick={() => {
                    setSortBy('price-high');
                    setShowSort(false);
                  }}
                  className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-black/[0.04] transition-colors duration-200 ${
                    sortBy === 'price-high' ? 'font-medium bg-black/[0.04] text-black' : 'font-normal text-black/60'
                  }`}
                >
                  {t('products.priceHighLow')}
                </button>
              </motion.div>
            )}
          </div>
          
          {/* Clear filters - only show if filters are active */}
          {selectedVendors.size > 0 && (
            <button
              onClick={() => setSelectedVendors(new Set())}
              className="text-[11px] font-normal text-black/45 hover:text-black underline underline-offset-2 transition-colors duration-200"
            >
              {t('products.clear')}
            </button>
          )}
        </div>

        {/* Mobile Filters Dropdown */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute right-0 top-full bg-white border-t-0 shadow-sm z-50 w-full max-h-[400px] overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-[10px] font-medium tracking-[0.18em] uppercase text-black/45 px-2 py-2 border-b border-black/10">
                מותגים
              </div>
              {uniqueVendors.map((vendor) => (
                <button
                  key={vendor}
                  onClick={() => toggleVendor(vendor)}
                  className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-black/[0.04] transition-colors ${
                    selectedVendors.has(vendor) ? 'font-normal bg-black/[0.04]' : 'font-light'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{vendor}</span>
                    {selectedVendors.has(vendor) && (
                      <span className="text-black">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mobile Sort Dropdown */}
        {showSort && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute left-0 top-full bg-white border-t-0 shadow-sm z-50 w-full"
          >
            <button
              onClick={() => {
                setSortBy('new');
                setShowSort(false);
              }}
              className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-black/[0.04] transition-colors ${
                sortBy === 'new' ? 'font-normal bg-black/[0.04]' : 'font-light'
              }`}
            >
              {t('products.newest')}
            </button>
            <button
              onClick={() => {
                setSortBy('price-low');
                setShowSort(false);
              }}
              className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-black/[0.04] transition-colors ${
                sortBy === 'price-low' ? 'font-normal bg-black/[0.04]' : 'font-light'
              }`}
            >
              {t('products.priceLowHigh')}
            </button>
            <button
              onClick={() => {
                setSortBy('price-high');
                setShowSort(false);
              }}
              className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-black/[0.04] transition-colors ${
                sortBy === 'price-high' ? 'font-normal bg-black/[0.04]' : 'font-light'
              }`}
            >
              {t('products.priceHighLow')}
            </button>
          </motion.div>
        )}
      </div>

      {/* Products Grid — align horizontal padding with homepage sections when embedded */}
      <div
        className={`mx-auto max-w-7xl py-6 md:py-8 ${embedOnHome ? 'px-5 md:px-6' : 'px-4 md:px-6'}`}
      >
        <div className="grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-3 md:gap-x-3 md:gap-y-10 lg:grid-cols-4 lg:gap-x-4">
          {visibleProducts.map((product, index) => {
            const soldOut = isProductSoldOut(product);
            const sale = getSaleInfo(product);
            const sizes = getSizeOptions(product);
            const isNew = product.tags?.some((tag) => tag.toLowerCase() === 'new_arrival');
            return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index < 8 ? Math.min(index * 0.03, 0.2) : 0 }}
              className="group relative [content-visibility:auto] [contain-intrinsic-size:auto_420px]"
            >
              <div className="block">
                <ProductImageSlider
                  images={product.images.edges}
                  title={product.title}
                  handle={product.handle}
                  soldOut={soldOut}
                  sizes={sizes}
                  background={getCardBackground(product.id)}
                  salePercent={sale?.percent}
                  isNew={isNew}
                  priority={index < 4}
                />

                <Link href={`/products/${product.handle}`} className="block space-y-1 text-center pt-1 px-1">
                  <p className="text-[10px] md:text-[11px] font-normal tracking-[0.16em] uppercase text-black/40">
                    {product.vendor || 'KLUMIT'}
                  </p>
                  <h3 className="text-[11px] md:text-[13px] font-semibold uppercase tracking-[0.04em] text-black line-clamp-2 leading-snug">
                    {product.title}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2 pt-0.5">
                    {sale ? (
                      <>
                        <span className="text-[12px] md:text-[14px] font-medium text-[#e11d2e]">
                          {formatPrice(String(sale.price))} ₪
                        </span>
                        <span className="text-[11px] md:text-[12px] text-black/35 line-through">
                          {formatPrice(String(sale.original))}
                        </span>
                      </>
                    ) : (
                      <span className="text-[12px] md:text-[14px] font-medium text-black">
                        {formatPrice(product.priceRange.minVariantPrice.amount)} ₪
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            </motion.div>
            );
          })}
        </div>

        {/* Infinite scroll sentinel — loads next 2 rows */}
        {hasMore && (
          <div ref={loadMoreRef} className="w-full">
            {loadingMore ? <LoadMoreDots /> : <div className="h-8" aria-hidden />}
          </div>
        )}

        {/* No Products */}
        {productPool.length === 0 && (
          <div className="text-center py-20">
            <p className="text-black/45 font-light text-sm">{t('products.noProducts')}</p>
          </div>
        )}
      </div>

      {/* Shop Categories Buttons */}
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center items-center">
          {(showViewAll || category !== 'bags') && (
            <a
              href="/products?tab=bags"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-12 py-3.5 text-[11px] tracking-[0.18em] uppercase font-medium bg-white text-black border border-black hover:bg-black hover:text-white transition-all duration-300"
            >
              <span>{t('products.shopBags')}</span>
            </a>
          )}
          {(showViewAll || category !== 'belts') && (
            <a
              href="/products?tab=belts"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-12 py-3.5 text-[11px] tracking-[0.18em] uppercase font-medium bg-white text-black border border-black hover:bg-black hover:text-white transition-all duration-300"
            >
              <span>{t('products.shopBelts')}</span>
            </a>
          )}
          {(showViewAll || category !== 'wallets') && (
            <a
              href="/products?tab=wallets"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-12 py-3.5 text-[11px] tracking-[0.18em] uppercase font-medium bg-white text-black border border-black hover:bg-black hover:text-white transition-all duration-300"
            >
              <span>{t('products.shopWallets')}</span>
            </a>
          )}
          {(showViewAll || category !== 'ss26') && (
            <a
              href="/products?tab=ss26"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-12 py-3.5 text-[11px] tracking-[0.18em] uppercase font-medium bg-white text-black border border-black hover:bg-black hover:text-white transition-all duration-300"
            >
              <span>{t('products.shopSpringSummer2026')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
