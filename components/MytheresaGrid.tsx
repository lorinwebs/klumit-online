'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { shopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';
import { useLanguage } from '@/lib/LanguageContext';

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
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
}

interface MytheresaGridProps {
  category?: 'bags' | 'belts' | 'wallets' | 'all';
  maxProducts?: number;
  showViewAll?: boolean;
}

// Product Image Slider Component with Flash Effect
function ProductImageSlider({ 
  images, 
  title,
  handle 
}: { 
  images: Array<{ node: { url: string; altText: string | null } }>; 
  title: string;
  handle: string;
}) {
  const { t } = useLanguage();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [quickViewHovered, setQuickViewHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Preload second image for instant transition
  useEffect(() => {
    if (images.length > 1) {
      const img = new window.Image();
      img.src = images[1].node.url;
    }
  }, [images]);

  useEffect(() => {
    // Only switch to next image on desktop when hovered and there are multiple images
    if (isHovered && images.length > 1 && window.innerWidth >= 768 && currentImageIndex === 0) {
      timeoutRef.current = setTimeout(() => {
        // Subtle flash effect: fade out slightly
        setImageOpacity(0.3);
        
        // After fade, change to next image and fade in
        setTimeout(() => {
          setCurrentImageIndex(1); // Only show next image, not all
          setImageOpacity(1);
        }, 200); // Flash duration
        
      }, 400); // Quick switch - 400ms after hover
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered, images.length, currentImageIndex]);

  // Reset to first image when hover ends
  useEffect(() => {
    if (!isHovered) {
      setImageOpacity(1);
      setCurrentImageIndex(0);
    }
  }, [isHovered]);

  return (
    <div
      className="relative aspect-[3/4] bg-cream-warm mb-3 overflow-hidden group/image border border-sand/60"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {images[currentImageIndex] ? (
        <Image
          key={currentImageIndex}
          src={images[currentImageIndex].node.url}
          alt={images[currentImageIndex].node.altText || title}
          fill
          className="object-cover group-hover:scale-105 transition-all duration-500"
          style={{ 
            opacity: imageOpacity,
            transition: 'opacity 200ms ease-in-out, transform 500ms ease-out'
          }}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-stone text-sm font-light">
          אין תמונה
        </div>
      )}

      {/* Quick View Button - Desktop Only */}
      <div className="hidden md:block absolute inset-0 opacity-0 group-hover/image:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-espresso/5" />
        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/products/${handle}`;
            }}
            onMouseEnter={() => setQuickViewHovered(true)}
            onMouseLeave={() => setQuickViewHovered(false)}
            className={`px-5 py-2 text-[10px] tracking-editorial uppercase font-medium border backdrop-blur-sm transition-all duration-400 ${
              quickViewHovered
                ? 'bg-espresso text-cream border-espresso'
                : 'bg-cream/95 text-espresso border-cream/95'
            }`}
          >
            {t('products.quickView') || 'צפייה מהירה'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MytheresaGrid({ 
  category = 'all',
  maxProducts,
  showViewAll = false,
}: MytheresaGridProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'price-low' | 'price-high'>('new');
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelectedVendors(new Set());
    setShowFilters(false);
  }, [category]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await shopifyClient.request<{
          products: { edges: Array<{ node: Product }> };
        }>(PRODUCTS_QUERY, {
          first: 50,
          sortKey: 'CREATED_AT',
          reverse: true,
        });

        let allProducts = data.products.edges.map((edge) => edge.node);

        // Filter by category
        if (category !== 'all') {
          allProducts = allProducts.filter(product => {
            const type = (product.productType || '').toLowerCase();
            const title = product.title.toLowerCase();
            
            if (category === 'bags') {
              return type.includes('bag') || type.includes('תיק') || title.includes('תיק') || title.includes('bag');
            } else if (category === 'wallets') {
              return type.includes('wallet') || type.includes('ארנק') || title.includes('ארנק') || title.includes('wallet');
            } else if (category === 'belts') {
              return type.includes('belt') || type.includes('חגור') || title.includes('חגור') || title.includes('belt');
            }
            return true;
          });
        }

        setProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category]);

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
  const uniqueVendors = Array.from(new Set(products.map(p => p.vendor || 'KLUMIT'))).sort();


  // Filter products by selected vendors
  const filteredProducts = selectedVendors.size > 0
    ? products.filter(p => selectedVendors.has(p.vendor || 'KLUMIT'))
    : products;

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // For "newest" sort, prioritize new_arrival tag first
    if (sortBy === 'new') {
      const aIsNew = a.tags?.some(tag => tag.toLowerCase() === 'new_arrival') || false;
      const bIsNew = b.tags?.some(tag => tag.toLowerCase() === 'new_arrival') || false;
      
      // If one is new and the other isn't, prioritize the new one
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      
      // Otherwise sort by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } 
    
    // For price sorting, sort all products together regardless of new_arrival tag
    if (sortBy === 'price-low') {
      return parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount);
    } else {
      return parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="sticky top-[160px] md:top-[170px] z-40 bg-cream border-b border-sand">
          <div className="grid grid-cols-2 md:hidden">
            <div className="h-12 border-l border-sand skeleton-shimmer" />
            <div className="h-12 skeleton-shimmer" />
          </div>
          <div className="hidden md:flex max-w-7xl mx-auto px-6 py-3 items-center justify-between">
            <div className="h-8 w-24 skeleton-shimmer rounded" />
            <div className="h-8 w-20 skeleton-shimmer rounded" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i}>
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
    <div id="products" className="min-h-screen bg-cream">
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

      {/* Filters & Sort Bar - Sticky */}
      <div className={`sticky ${showViewAll ? 'top-[168px] md:top-[170px]' : 'top-[96px] md:top-[70px]'} z-40 bg-cream/95 backdrop-blur-sm border-b border-sand`}>
        {/* Mobile: Full width grid */}
        <div className="grid grid-cols-2 md:hidden">
          {/* Filters Button - Full width */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="relative flex items-center justify-center gap-2 h-12 border-l border-sand hover:bg-sand-light/50 transition-colors duration-300"
          >
            <SlidersHorizontal size={16} className="text-espresso" />
            <span className="text-[11px] font-medium tracking-editorial uppercase text-espresso">{t('products.filter')}</span>
            {selectedVendors.size > 0 && (
              <span className="absolute top-2 left-2 w-2 h-2 bg-terracotta rounded-full" />
            )}
          </button>

          {/* Sort Button - Full width */}
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center justify-center gap-2 h-12 hover:bg-sand-light/50 transition-colors duration-300"
          >
            <span className="text-[11px] font-medium tracking-editorial uppercase text-espresso">{t('products.sort')}</span>
          </button>
        </div>

        {/* Desktop: Filters and Sort side by side */}
        <div className="hidden md:flex max-w-7xl mx-auto px-6 py-3 items-center gap-3">
          {/* Filters Button */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium tracking-editorial uppercase border border-sand hover:border-espresso transition-colors duration-300 bg-cream relative"
            >
              <span>{t('products.filter')}</span>
              <SlidersHorizontal size={14} className="text-espresso" />
              {selectedVendors.size > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-terracotta text-cream text-[8px] flex items-center justify-center rounded-full">
                  {selectedVendors.size}
                </span>
              )}
            </button>
            
            {/* Filters Dropdown - Desktop only */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 bg-cream border border-sand shadow-lg z-50 min-w-[200px] max-h-[400px] overflow-y-auto"
              >
                <div className="p-2">
                  <div className="text-[10px] font-medium tracking-editorial uppercase text-stone px-2 py-2 border-b border-sand">
                    מותגים
                  </div>
                  {uniqueVendors.map((vendor) => (
                    <button
                      key={vendor}
                      onClick={() => toggleVendor(vendor)}
                      className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-sand-light transition-colors duration-200 ${
                        selectedVendors.has(vendor) ? 'font-medium bg-sand-light text-espresso' : 'font-normal text-stone-dark'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{vendor}</span>
                        {selectedVendors.has(vendor) && (
                          <span className="text-espresso">✓</span>
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
              className="flex items-center gap-2 px-4 py-2 text-[11px] font-medium tracking-editorial uppercase border border-sand hover:border-espresso transition-colors duration-300 bg-cream"
            >
              <span>{t('products.sort')}</span>
              <SlidersHorizontal size={14} className="text-espresso" />
            </button>
            
            {/* Sort Dropdown - Desktop only */}
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 bg-cream border border-sand shadow-lg z-50 min-w-[200px]"
              >
                <button
                  onClick={() => {
                    setSortBy('new');
                    setShowSort(false);
                  }}
                  className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-sand-light transition-colors duration-200 ${
                    sortBy === 'new' ? 'font-medium bg-sand-light text-espresso' : 'font-normal text-stone-dark'
                  }`}
                >
                  {t('products.newest')}
                </button>
                <button
                  onClick={() => {
                    setSortBy('price-low');
                    setShowSort(false);
                  }}
                  className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-sand-light transition-colors duration-200 ${
                    sortBy === 'price-low' ? 'font-medium bg-sand-light text-espresso' : 'font-normal text-stone-dark'
                  }`}
                >
                  {t('products.priceLowHigh')}
                </button>
                <button
                  onClick={() => {
                    setSortBy('price-high');
                    setShowSort(false);
                  }}
                  className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-sand-light transition-colors duration-200 ${
                    sortBy === 'price-high' ? 'font-medium bg-sand-light text-espresso' : 'font-normal text-stone-dark'
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
              className="text-[11px] font-normal text-stone hover:text-espresso underline underline-offset-2 transition-colors duration-200"
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
            className="md:hidden absolute right-0 top-full bg-cream border-t-0 shadow-lg z-50 w-full max-h-[400px] overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-[10px] font-medium tracking-editorial uppercase text-stone px-2 py-2 border-b border-sand">
                מותגים
              </div>
              {uniqueVendors.map((vendor) => (
                <button
                  key={vendor}
                  onClick={() => toggleVendor(vendor)}
                  className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${
                    selectedVendors.has(vendor) ? 'font-normal bg-gray-50' : 'font-light'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{vendor}</span>
                    {selectedVendors.has(vendor) && (
                      <span className="text-espresso">✓</span>
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
            className="md:hidden absolute left-0 top-full bg-cream border-t-0 shadow-lg z-50 w-full"
          >
            <button
              onClick={() => {
                setSortBy('new');
                setShowSort(false);
              }}
              className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${
                sortBy === 'new' ? 'font-normal bg-gray-50' : 'font-light'
              }`}
            >
              {t('products.newest')}
            </button>
            <button
              onClick={() => {
                setSortBy('price-low');
                setShowSort(false);
              }}
              className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${
                sortBy === 'price-low' ? 'font-normal bg-gray-50' : 'font-light'
              }`}
            >
              {t('products.priceLowHigh')}
            </button>
            <button
              onClick={() => {
                setSortBy('price-high');
                setShowSort(false);
              }}
              className={`block w-full text-right px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors ${
                sortBy === 'price-high' ? 'font-normal bg-gray-50' : 'font-light'
              }`}
            >
              {t('products.priceHighLow')}
            </button>
          </motion.div>
        )}
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {(maxProducts ? sortedProducts.slice(0, maxProducts) : sortedProducts).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative"
            >
              <Link href={`/products/${product.handle}`} className="block">
                {/* Product Image with Auto-Cycle on Hover */}
                <div className="relative">
                  <ProductImageSlider
                    images={product.images.edges}
                    title={product.title}
                    handle={product.handle}
                  />
                  {/* NEW Tag - absolutely positioned over image */}
                  {product.tags?.some(tag => tag.toLowerCase() === 'new_arrival') && (
                    <div className="absolute top-2 right-2 z-10 bg-espresso px-2.5 py-1">
                      <span className="text-[9px] md:text-[10px] font-medium tracking-editorial uppercase text-cream">
                        {t('products.newTag')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-1.5 text-center pt-1">
                  {/* Brand/Vendor Name */}
                  <p className="text-[9px] md:text-[10px] font-medium tracking-editorial uppercase text-stone">
                    {product.vendor || 'KLUMIT'}
                  </p>
                  {/* Product Title */}
                  <h3 className="text-xs md:text-sm font-light text-espresso line-clamp-2 leading-snug">
                    {product.title}
                  </h3>
                  {/* Price */}
                  <p className="text-xs md:text-sm font-normal text-espresso">
                    ₪ {formatPrice(product.priceRange.minVariantPrice.amount)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* No Products */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-stone font-light text-sm">{t('products.noProducts')}</p>
          </div>
        )}
      </div>

      {/* Shop Categories Buttons */}
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 justify-center items-center">
          {(showViewAll || category !== 'bags') && (
            <a
              href="/products?tab=bags"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-12 py-3.5 text-[11px] tracking-editorial uppercase font-medium bg-cream text-espresso border border-espresso hover:bg-espresso hover:text-cream transition-all duration-500 ease-luxury"
            >
              <span>{t('products.shopBags')}</span>
            </a>
          )}
          {(showViewAll || category !== 'belts') && (
            <a
              href="/products?tab=belts"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-12 py-3.5 text-[11px] tracking-editorial uppercase font-medium bg-cream text-espresso border border-espresso hover:bg-espresso hover:text-cream transition-all duration-500 ease-luxury"
            >
              <span>{t('products.shopBelts')}</span>
            </a>
          )}
          {(showViewAll || category !== 'wallets') && (
            <a
              href="/products?tab=wallets"
              className="group w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 md:px-12 py-3.5 text-[11px] tracking-editorial uppercase font-medium bg-cream text-espresso border border-espresso hover:bg-espresso hover:text-cream transition-all duration-500 ease-luxury"
            >
              <span>{t('products.shopWallets')}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
