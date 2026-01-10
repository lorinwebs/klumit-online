'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') as TabType | null;
  const vendorParam = searchParams?.get('vendor');
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam === 'belts' ? 'belts' : tabParam === 'wallets' ? 'wallets' : 'bags'
  );
  const [selectedVendor, setSelectedVendor] = useState<string>(vendorParam || 'all');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allVendors, setAllVendors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Update tab from URL params
    const currentTabParam = searchParams?.get('tab') as TabType | null;
    const currentVendorParam = searchParams?.get('vendor');
    if (currentTabParam === 'belts') {
      setActiveTab('belts');
    } else if (currentTabParam === 'wallets') {
      setActiveTab('wallets');
    } else {
      setActiveTab('bags');
    }
    if (currentVendorParam) {
      setSelectedVendor(currentVendorParam);
    } else {
      setSelectedVendor('all');
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        // Build query filter based on active tab
        let queryFilter = '';
        if (activeTab === 'bags') {
          queryFilter = '(product_type:תיק OR product_type:bag OR product_type:תיקים OR product_type:bags)';
        } else if (activeTab === 'belts') {
          queryFilter = '(product_type:חגורות OR product_type:belt OR product_type:belts OR product_type:חגורה)';
        } else if (activeTab === 'wallets') {
          queryFilter = '(product_type:ארנק OR product_type:wallet OR product_type:ארנקים OR product_type:wallets)';
        }

        const data = await shopifyClient.request<{
          products: { edges: Array<{ node: Product }> };
        }>(PRODUCTS_QUERY, {
          first: 50,
          query: queryFilter || undefined,
        });
        const fetchedProducts = data.products.edges.map((edge) => edge.node);
        setAllProducts(fetchedProducts);
        
        // Extract unique vendors
        const vendors = Array.from(new Set(
          fetchedProducts
            .map(p => p.vendor)
            .filter((v): v is string => !!v)
        )).sort();
        setAllVendors(vendors);
      } catch (error) {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [activeTab]);

  // Filter products by vendor on client side (no re-fetch)
  useEffect(() => {
    if (selectedVendor === 'all') {
      setProducts(allProducts);
    } else {
      setProducts(allProducts.filter(p => p.vendor === selectedVendor));
    }
  }, [selectedVendor, allProducts]);

  const handleVendorChange = (vendor: string) => {
    setSelectedVendor(vendor);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (vendor === 'all') {
      params.delete('vendor');
    } else {
      params.set('vendor', vendor);
    }
    // Use replaceState instead of pushState to avoid adding to history
    window.history.replaceState({}, '', `?${params.toString()}`);
  };

  return (
    <div className="w-full">
      {/* Vendor Filter */}
      {!loading && allVendors.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center gap-4 flex-wrap">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse aspect-[4/5]" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-20">
          <p className="text-gray-400 font-light text-lg">לא נמצאו מוצרים בקטגוריה זו</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
          {products.map((product) => {
            const firstVariant = product.variants.edges[0]?.node;
            const firstImage = product.images.edges[0]?.node;
            
            return (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                handle={product.handle}
                price={product.priceRange.minVariantPrice.amount}
                currencyCode={product.priceRange.minVariantPrice.currencyCode}
                image={firstImage?.url}
                variantId={firstVariant?.id || ''}
                available={firstVariant?.availableForSale || false}
                quantityAvailable={firstVariant?.quantityAvailable}
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
      <main id="main-content" className="flex-grow w-full px-4 py-12 md:py-16" role="main">
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 md:gap-12 max-w-7xl mx-auto">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse aspect-[4/5]" />
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

