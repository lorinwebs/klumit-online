'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductGridCard from '@/components/catalog/ProductGridCard';
import {
  shopifyClient,
  PRODUCTS_LIST_QUERY,
  COLLECTION_PRODUCTS_LIST_QUERY,
  getCategorySearchQuery,
} from '@/lib/shopify';
import { useLanguage } from '@/lib/LanguageContext';
import { isProductSoldOut } from '@/lib/product-availability';
import { getSaleInfo } from '@/lib/product-sale';
import { matchesCatalogCategory, productMatchesSearch } from '@/lib/product-search';
import type { CatalogProduct } from '@/lib/products-server';

type Product = CatalogProduct;

interface MytheresaGridProps {
  category?: 'bags' | 'belts' | 'wallets' | 'all' | 'ss26' | 'sale';
  maxProducts?: number;
  showViewAll?: boolean;
  /** When embedded on homepage: no #products id (parent section owns anchor) */
  embedOnHome?: boolean;
  /** Pre-filter by brand/vendor (case-insensitive substring, e.g. "valentino") */
  initialVendor?: string;
  /** Free-text search (?q= from the header search bar) */
  searchQuery?: string;
  /** Server-fetched products so SSR HTML includes /products/{handle} links */
  initialProducts?: CatalogProduct[];
  /** Show only this collection, in its Shopify admin order (sorting by "new" keeps that order) */
  collectionHandle?: string;
}

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

export default function MytheresaGrid({ 
  category = 'all',
  maxProducts,
  showViewAll = false,
  embedOnHome = false,
  initialVendor,
  searchQuery,
  initialProducts,
  collectionHandle,
}: MytheresaGridProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>(initialProducts ?? []);
  const [loading, setLoading] = useState(!initialProducts);
  const [sortBy, setSortBy] = useState<'new' | 'price-low' | 'price-high'>('new');
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const loadingMoreLock = useRef(false);
  const skipFirstFetchFor = useRef(initialProducts ? category : null);

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
    if (skipFirstFetchFor.current === category) {
      skipFirstFetchFor.current = null;
      return;
    }

    let cancelled = false;
    async function fetchProducts() {
      setLoading(true);
      try {
        let edges: Array<{ node: Product }>;
        if (collectionHandle) {
          const data = await shopifyClient.request<{
            collection: { products: { edges: Array<{ node: Product }> } } | null;
          }>(COLLECTION_PRODUCTS_LIST_QUERY, { handle: collectionHandle, first: 100 });
          edges = data.collection?.products.edges ?? [];
        } else {
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
          edges = data.products.edges;
        }

        if (cancelled) return;

        let allProducts = edges
          .map((edge) => edge.node)
          .filter((product) => !isProductSoldOut(product));

        // Sale tab — only discounted products
        if (category === 'sale') {
          allProducts = allProducts.filter((product) => getSaleInfo(product) !== null);
        }

        // Fallback client filter if Shopify search returns mixed types
        if (category === 'bags' || category === 'wallets' || category === 'belts') {
          allProducts = allProducts.filter((product) => matchesCatalogCategory(product, category));
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
  }, [category, maxProducts, collectionHandle]);

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
    let filtered =
      selectedVendors.size > 0
        ? products.filter((p) => selectedVendors.has(p.vendor || 'KLUMIT'))
        : products;

    // Free-text search from the header (?q=) — expands Hebrew category words (e.g. ארנק)
    const q = searchQuery?.trim();
    if (q) {
      filtered = filtered.filter((p) => productMatchesSearch(p, q));
    }

    if (collectionHandle && sortBy === 'new') return filtered;

    return [...filtered].sort((a, b) => {
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
  }, [products, selectedVendors, sortBy, searchQuery, collectionHandle]);

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

  const catalogHeading = (() => {
    const q = searchQuery?.trim();
    if (q) return `${t('header.search')}: ${q}`;
    if (category === 'bags') return t('products.shopBags');
    if (category === 'belts') return t('products.shopBelts');
    if (category === 'wallets') return t('products.shopWallets');
    if (category === 'ss26') return t('products.shopSpringSummer2026');
    if (category === 'sale') return t('header.sale');
    return t('header.shopAll');
  })();

  const catalogIntro = (() => {
    if (searchQuery?.trim()) return null;
    if (category === 'bags') return t('products.categoryIntroBags');
    if (category === 'belts') return t('products.categoryIntroBelts');
    if (category === 'wallets') return t('products.categoryIntroWallets');
    if (category === 'ss26') return t('products.categoryIntroSs26');
    if (category === 'sale') return t('products.categoryIntroSale');
    return t('products.categoryIntroAll');
  })();

  return (
    <div
      {...(embedOnHome ? {} : { id: 'products' })}
      className={embedOnHome ? 'min-h-0 bg-cream' : 'min-h-screen bg-cream'}
    >
      {!embedOnHome && (
        <div className="mx-auto max-w-7xl px-4 md:px-6 pt-8 md:pt-10 pb-2 text-center md:text-start">
          <h1 className="font-display text-2xl md:text-3xl font-light text-black normal-case tracking-normal">
            {catalogHeading}
          </h1>
          {catalogIntro ? (
            <p className="mt-2 text-sm font-light text-black/60 max-w-2xl mx-auto md:mx-0 leading-relaxed">
              {catalogIntro}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] tracking-[0.14em] uppercase text-black/40">
            {productPool.length} {t('products.productCount')}
          </p>
        </div>
      )}

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
          {visibleProducts.map((product, index) => (
            <ProductGridCard key={product.id} product={product} priority={index < 8} />
          ))}
        </div>

        {/* Crawlable product links beyond the first visible rows (load-more UX) */}
        {productPool.length > visibleProducts.length && (
          <nav className="sr-only" aria-label="כל המוצרים בקטגוריה">
            {productPool.slice(visibleProducts.length).map((product) => (
              <Link key={`seo-${product.id}`} href={`/products/${product.handle}`}>
                {product.title}
              </Link>
            ))}
          </nav>
        )}

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
              href="/bags"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-12 py-3.5 text-[11px] tracking-[0.18em] uppercase font-medium bg-white text-black border border-black hover:bg-black hover:text-white transition-all duration-300"
            >
              <span>{t('products.shopBags')}</span>
            </a>
          )}
          {(showViewAll || category !== 'belts') && (
            <a
              href="/belts"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-12 py-3.5 text-[11px] tracking-[0.18em] uppercase font-medium bg-white text-black border border-black hover:bg-black hover:text-white transition-all duration-300"
            >
              <span>{t('products.shopBelts')}</span>
            </a>
          )}
          {(showViewAll || category !== 'wallets') && (
            <a
              href="/wallets"
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
