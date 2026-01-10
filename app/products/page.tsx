'use client';

import { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { shopifyClient, PRODUCTS_QUERY } from '@/lib/shopify';

interface Product {
  id: string;
  title: string;
  handle: string;
  productType?: string;
  vendor?: string;
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

type TabType = 'bags' | 'belts' | 'wallets';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Derive tab and vendor directly from URL
  const activeTab = (searchParams?.get('tab') as TabType) || 'bags';
  const selectedVendor = searchParams?.get('vendor') || 'all';

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products - only runs when tab changes
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let queryFilter = '';
        switch (activeTab) {
          case 'bags':
            queryFilter = '(product_type:תיק OR product_type:bag OR product_type:תיקים OR product_type:bags)';
            break;
          case 'belts':
            queryFilter = '(product_type:חגורות OR product_type:belt OR product_type:belts OR product_type:חגורה)';
            break;
          case 'wallets':
            queryFilter = '(product_type:ארנק OR product_type:wallet OR product_type:ארנקים OR product_type:wallets)';
            break;
        }

        const data = await shopifyClient.request<{
          products: { edges: Array<{ node: Product }> };
        }>(PRODUCTS_QUERY, {
          first: 50,
          query: queryFilter || undefined,
        });
        
        setAllProducts(data.products.edges.map((edge) => edge.node));
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [activeTab]);

  // Derived state - computed at render time, no extra re-renders
  const { filteredProducts, allVendors } = useMemo(() => {
    const vendors = Array.from(new Set(
      allProducts
        .map(p => p.vendor)
        .filter((v): v is string => !!v)
    )).sort();

    const filtered = selectedVendor === 'all' 
      ? allProducts 
      : allProducts.filter(p => p.vendor === selectedVendor);

    return { filteredProducts: filtered, allVendors: vendors };
  }, [allProducts, selectedVendor]);

  const handleVendorChange = (vendor: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (vendor === 'all') {
      params.delete('vendor');
    } else {
      params.set('vendor', vendor);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full">
      {/* Vendor Filter */}
      {!loading && allVendors.length > 0 && (
        <div className="max-w-7xl mx-auto mb-4 md:mb-8">
          {/* Mobile: Elegant horizontal scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex items-center justify-center gap-2 min-w-max">
              <button
                onClick={() => handleVendorChange('all')}
                className={`px-4 py-1.5 text-xs tracking-wider uppercase border transition-all duration-300 ${
                  selectedVendor === 'all'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-transparent text-[#1a1a1a] border-[#1a1a1a]/20'
                }`}
              >
                הכל
              </button>
              {allVendors.map((vendor) => (
                <button
                  key={vendor}
                  onClick={() => handleVendorChange(vendor)}
                  className={`px-4 py-1.5 text-xs tracking-wider uppercase border transition-all duration-300 whitespace-nowrap ${
                    selectedVendor === vendor
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                      : 'bg-transparent text-[#1a1a1a] border-[#1a1a1a]/20'
                  }`}
                >
                  {vendor}
                </button>
              ))}
            </div>
          </div>
          {/* Desktop: Buttons */}
          <div className="hidden md:flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-gray-700">מותג:</span>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => handleVendorChange('all')}
                className={`px-4 py-2 text-sm border rounded transition-colors ${
                  selectedVendor === 'all'
                    ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                    : 'bg-white text-[#1a1a1a] border-gray-300 hover:border-[#1a1a1a]'
                }`}
              >
                הכל
              </button>
              {allVendors.map((vendor) => (
                <button
                  key={vendor}
                  onClick={() => handleVendorChange(vendor)}
                  className={`px-4 py-2 text-sm border rounded transition-colors ${
                    selectedVendor === vendor
                      ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]'
                      : 'bg-white text-[#1a1a1a] border-gray-300 hover:border-[#1a1a1a]'
                  }`}
                >
                  {vendor}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
          {[...Array(8)].map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-gray-200 animate-pulse aspect-[4/5]" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-20">
          <p className="text-gray-400 font-light text-lg">לא נמצאו מוצרים בקטגוריה זו</p>
          {selectedVendor !== 'all' && (
            <button 
              onClick={() => handleVendorChange('all')}
              className="mt-4 text-sm underline text-gray-600 hover:text-black"
            >
              נקה סינון
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
          {filteredProducts.map((product) => {
            // Find first available variant, or fallback to first variant
            const availableVariant = product.variants.edges.find(
              (e) => e.node.availableForSale
            )?.node;
            const firstVariant = product.variants.edges[0]?.node;
            const selectedVariant = availableVariant || firstVariant;
            const firstImage = product.images.edges[0]?.node;
            
            // Product is available if ANY variant is available
            const isAvailable = product.variants.edges.some(
              (e) => e.node.availableForSale
            );
            
            return (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                handle={product.handle}
                price={product.priceRange.minVariantPrice.amount}
                currencyCode={product.priceRange.minVariantPrice.currencyCode}
                image={firstImage?.url}
                variantId={selectedVariant?.id || ''}
                available={isAvailable}
                quantityAvailable={selectedVariant?.quantityAvailable}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main id="main-content" className="flex-grow w-full px-4 py-4 md:py-16" role="main">
        <Suspense fallback={
          <div className="grid grid-cols-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
            {[...Array(8)].map((_, i) => (
              <div key={`suspense-${i}`} className="bg-gray-200 animate-pulse aspect-[4/5]" />
            ))}
          </div>
        }>
          <ProductsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

