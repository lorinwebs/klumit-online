'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

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

interface ProductsClientProps {
  initialProducts: Product[];
  activeTab: TabType;
  initialVendor: string;
}

export default function ProductsClient({ 
  initialProducts, 
  activeTab,
  initialVendor 
}: ProductsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prevTabRef = useRef(activeTab);
  
  const selectedVendor = searchParams?.get('vendor') || initialVendor;

  // Reset vendor if tab changes
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      if (selectedVendor !== 'all') {
        const params = new URLSearchParams(searchParams?.toString() || '');
        params.delete('vendor');
        router.replace(`?${params.toString()}`, { scroll: false });
      }
      prevTabRef.current = activeTab;
    }
  }, [activeTab, selectedVendor, searchParams, router]);

  const { filteredProducts, allVendors } = useMemo(() => {
    const vendors = Array.from(new Set(
      initialProducts
        .map(p => p.vendor)
        .filter((v): v is string => !!v)
    )).sort();

    const filtered = selectedVendor === 'all' 
      ? initialProducts 
      : initialProducts.filter(p => p.vendor === selectedVendor);

    return { filteredProducts: filtered, allVendors: vendors };
  }, [initialProducts, selectedVendor]);

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
      {allVendors.length > 0 && (
        <div className="max-w-7xl mx-auto mb-6 md:mb-8 sticky top-[60px] z-10 bg-[#fdfcfb] py-2 md:static">
          {/* Mobile: Improved Scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
            <div className="flex items-center justify-start gap-2 min-w-max">
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
      {filteredProducts.length === 0 ? (
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
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-8 max-w-7xl mx-auto">
          {filteredProducts.map((product) => {
            const availableVariant = product.variants.edges.find(
              (e) => e.node.availableForSale
            )?.node;
            const firstVariant = product.variants.edges[0]?.node;
            const selectedVariant = availableVariant || firstVariant;
            const firstImage = product.images.edges[0]?.node;
            
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
