'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { shopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';

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

export default function MytheresaGrid({ 
  category = 'all',
  maxProducts,
  showViewAll = false,
}: MytheresaGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'price-low' | 'price-high'>('new');
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(new Set());

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

  // Sort products - NEW_ARRIVAL first only when sorting by 'new'
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Check for new_arrival tag (case insensitive)
    const aIsNew = a.tags?.some(tag => tag.toLowerCase() === 'new_arrival') || false;
    const bIsNew = b.tags?.some(tag => tag.toLowerCase() === 'new_arrival') || false;
    
    // Only prioritize NEW_ARRIVAL when sorting by 'new'
    if (sortBy === 'new') {
      // NEW_ARRIVAL products come first
      if (aIsNew && !bIsNew) return -1;
      if (!aIsNew && bIsNew) return 1;
      // Then sort by creation date
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'price-low') {
      return parseFloat(a.priceRange.minVariantPrice.amount) - parseFloat(b.priceRange.minVariantPrice.amount);
    } else {
      return parseFloat(b.priceRange.minVariantPrice.amount) - parseFloat(a.priceRange.minVariantPrice.amount);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Filters Bar Skeleton */}
        <div className="sticky top-[186px] md:top-[170px] z-40 bg-white border-b border-gray-200">
          {/* Mobile: Grid */}
          <div className="grid grid-cols-2 md:hidden">
            <div className="h-12 border-l border-gray-200 bg-gray-100 animate-pulse" />
            <div className="h-12 bg-gray-100 animate-pulse" />
          </div>
          {/* Desktop: Flex */}
          <div className="hidden md:flex max-w-7xl mx-auto px-4 py-3 items-center justify-between">
            <div className="h-8 w-24 bg-gray-200 animate-pulse" />
            <div className="h-8 w-20 bg-gray-200 animate-pulse" />
          </div>
        </div>
        {/* Grid Skeleton */}
        <div className="max-w-7xl mx-auto px-2 md:px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 mb-2" />
                <div className="h-4 bg-gray-200 mb-1" />
                <div className="h-4 bg-gray-200 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="products" className="min-h-screen bg-white">
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
      <div className="sticky top-[138px] md:top-[122px] z-40 bg-white border-b border-gray-200">
        {/* Mobile: Full width grid */}
        <div className="grid grid-cols-2 md:hidden">
          {/* Filters Button - Full width */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="relative flex items-center justify-center gap-2 h-12 border-l border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal size={16} className="text-[#1a1a1a]" />
            <span className="text-sm font-light tracking-wide">סינון</span>
            {selectedVendors.size > 0 && (
              <span className="absolute top-2 left-2 w-2 h-2 bg-[#1a1a1a] rounded-full" />
            )}
          </button>

          {/* Sort Button - Full width */}
          <button
            onClick={() => setShowSort(!showSort)}
            className="flex items-center justify-center gap-2 h-12 hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-light tracking-wide">מיון</span>
          </button>
        </div>

        {/* Desktop: Original layout */}
        <div className="hidden md:flex max-w-7xl mx-auto px-4 py-3 items-center justify-between">
          {/* Left side - Filters Button */}
          <div className="relative flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-light tracking-wide border border-gray-300 hover:border-[#1a1a1a] transition-colors bg-white relative"
            >
              <span>סינון</span>
              <SlidersHorizontal size={14} className="text-[#1a1a1a]" />
              {selectedVendors.size > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#1a1a1a] text-white text-[8px] flex items-center justify-center rounded-full">
                  {selectedVendors.size}
                </span>
              )}
            </button>
            
            {/* Clear filters - only show if filters are active */}
            {selectedVendors.size > 0 && (
              <button
                onClick={() => setSelectedVendors(new Set())}
                className="text-xs font-light text-gray-500 hover:text-[#1a1a1a] underline"
              >
                נקה
              </button>
            )}
          </div>

          {/* Right side - Sort Button */}
          <div className="relative">
            <button
              onClick={() => setShowSort(!showSort)}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-light tracking-wide border border-gray-300 hover:border-[#1a1a1a] transition-colors bg-white"
            >
              <span>מיון</span>
              <SlidersHorizontal size={14} className="text-[#1a1a1a]" />
            </button>
          </div>
        </div>

        {/* Filters Dropdown */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 md:right-4 top-full bg-white border-t-0 md:border md:border-gray-200 md:mt-1 shadow-lg z-50 w-full md:w-auto md:min-w-[200px] max-h-[400px] overflow-y-auto"
          >
            <div className="p-2">
              <div className="text-[10px] font-light text-gray-500 px-2 py-2 border-b border-gray-100">
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
                      <span className="text-[#1a1a1a]">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sort Dropdown */}
        {showSort && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 md:left-4 top-full bg-white border-t-0 md:border md:border-gray-200 md:mt-1 shadow-lg z-50 w-full md:w-auto md:min-w-[200px]"
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
              חדשים ביותר
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
              מחיר: נמוך לגבוה
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
              מחיר: גבוה לנמוך
            </button>
          </motion.div>
        )}
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-2 md:px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {(maxProducts ? sortedProducts.slice(0, maxProducts) : sortedProducts).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="group relative"
            >
              <Link href={`/products/${product.handle}`} className="block">
                {/* NEW Tag - checks for new_arrival tag */}
                {product.tags?.some(tag => tag.toLowerCase() === 'new_arrival') && (
                  <div className="mb-2">
                    <div className="inline-block bg-[#1a1a1a] px-2 py-1">
                      <span className="text-[9px] md:text-[10px] font-medium tracking-[0.2em] uppercase text-white">
                        חדש!
                      </span>
                    </div>
                  </div>
                )}

                {/* Product Image */}
                <div className="relative aspect-[3/4] bg-gray-100 mb-2 overflow-hidden">
                  {product.images.edges[0] ? (
                    <Image
                      src={product.images.edges[0].node.url}
                      alt={product.images.edges[0].node.altText || product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      אין תמונה
                    </div>
                  )}

                </div>

                {/* Product Info */}
                <div className="space-y-1 text-center">
                  {/* Brand/Vendor Name - Small */}
                  <p className="text-[9px] md:text-[10px] font-light tracking-[0.15em] uppercase text-gray-500">
                    {product.vendor || 'KLUMIT'}
                  </p>
                  {/* Product Title - Main */}
                  <h3 className="text-xs md:text-sm font-light text-[#1a1a1a] line-clamp-2 leading-tight">
                    {product.title}
                  </h3>
                  {/* Price */}
                  <p className="text-xs md:text-sm font-light text-[#1a1a1a]">
                    ₪ {formatPrice(product.priceRange.minVariantPrice.amount)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* No Products */}
        {sortedProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500">לא נמצאו מוצרים</p>
          </div>
        )}
      </div>

      {/* View All Button */}
      {showViewAll && maxProducts && sortedProducts.length > maxProducts && (
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <a
            href="/products"
            className="inline-flex items-center gap-2 px-10 py-4 text-sm tracking-wider uppercase font-light bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] transition-all duration-300"
          >
            <span>ראה הכל ({sortedProducts.length} מוצרים)</span>
          </a>
        </div>
      )}
    </div>
  );
}
