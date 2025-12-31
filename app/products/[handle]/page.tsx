'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { shopifyClient, PRODUCT_QUERY } from '@/lib/shopify';
import { useCartStore } from '@/store/cartStore';
import { ShoppingBag, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Toast from '@/components/Toast';
import ProductCard from '@/components/ProductCard';
import { PRODUCTS_QUERY } from '@/lib/shopify';

interface Product {
  id: string;
  title: string;
  handle: string;
  description: string;
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
        title: string;
        price: {
          amount: string;
          currencyCode: string;
        };
        availableForSale: boolean;
        quantityAvailable: number;
      };
    }>;
  };
}

export default function ProductPage() {
  const params = useParams();
  const handle = params.handle as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [relatedProductsIndex, setRelatedProductsIndex] = useState(0);
  const addItem = useCartStore((state) => state.addItem);
  const imageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const relatedProductsScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await shopifyClient.request<{ product: Product }>(
          PRODUCT_QUERY,
          { handle }
        );
        setProduct(data.product);
        if (data.product.variants.edges.length > 0) {
          const firstVariant = data.product.variants.edges[0].node;
          setSelectedVariant(firstVariant.id);
        }
        if (data.product.images.edges.length > 0) {
          setSelectedImage(data.product.images.edges[0].node.url);
          setCurrentImageIndex(0);
        }

        // Fetch related products (all other products)
        try {
          const productsData = await shopifyClient.request<{
            products: { edges: Array<{ node: Product }> };
          }>(PRODUCTS_QUERY, {
            first: 50,
          });
          const allProducts = productsData.products.edges.map((edge) => edge.node);
          // Filter out current product
          const filtered = allProducts.filter((p) => p.id !== data.product.id);
          setRelatedProducts(filtered);
        } catch (error) {
          console.error('Error fetching related products:', error);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    }

    if (handle) {
      fetchProduct();
    }
  }, [handle]);

  // Handle scroll to change selected image
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !product) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;
      const containerHeight = containerRect.height;
      const viewportCenter = containerTop + containerHeight / 2;

      let closestImage = '';
      let closestDistance = Infinity;

      product.images.edges.forEach(({ node }) => {
        const imageElement = imageRefs.current[node.url];
        if (imageElement) {
          const rect = imageElement.getBoundingClientRect();
          const imageCenter = rect.top + rect.height / 2;
          const distance = Math.abs(imageCenter - viewportCenter);

          if (distance < closestDistance && rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
            closestDistance = distance;
            closestImage = node.url;
          }
        }
      });

      if (closestImage && closestImage !== selectedImage) {
        setSelectedImage(closestImage);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [product, selectedImage]);

  // Handle swipe for mobile images
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || !product) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swipe left - next image
        const newIndex = currentImageIndex === product.images.edges.length - 1 
          ? 0 
          : currentImageIndex + 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(product.images.edges[newIndex].node.url);
      } else {
        // Swipe right - previous image
        const newIndex = currentImageIndex === 0 
          ? product.images.edges.length - 1 
          : currentImageIndex - 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(product.images.edges[newIndex].node.url);
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    
    const variant = product.variants.edges.find(
      (e) => e.node.id === selectedVariant
    )?.node;
    
    if (variant && variant.availableForSale) {
      addItem({
        id: variant.id,
        variantId: variant.id,
        title: `${product.title} - ${variant.title}`,
        price: variant.price.amount,
        currencyCode: variant.price.currencyCode,
        image: selectedImage,
        available: variant.availableForSale,
      });
      
      // Show toast
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-200 h-96 rounded-lg" />
              <div className="space-y-4">
                <div className="bg-gray-200 h-8 rounded" />
                <div className="bg-gray-200 h-4 rounded w-2/3" />
                <div className="bg-gray-200 h-32 rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl">מוצר לא נמצא</h1>
        </main>
        <Footer />
      </div>
    );
  }

  const currentVariant = product.variants.edges.find(
    (e) => e.node.id === selectedVariant
  )?.node;

  // פורמט מחיר פרימיום
  const formatPrice = (amount: string) => {
    const num = parseFloat(amount);
    return Math.round(num).toLocaleString('he-IL');
  };

  const price = currentVariant?.price.amount 
    ? formatPrice(currentVariant.price.amount) 
    : formatPrice(product.priceRange.minVariantPrice.amount);

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb] overflow-x-hidden">
      <Header />
      <main className="flex-grow max-w-[1400px] mx-auto px-4 pt-0 pb-16 md:py-20 w-full">
        <div className="grid grid-cols-12 gap-6 md:gap-8">
          {/* Left Side - Thumbnail Images (Desktop only) */}
          <div className="hidden md:block col-span-2 order-1">
            {product.images.edges.length > 0 && (
              <div className="flex flex-col gap-3">
                {product.images.edges.map(({ node }) => (
                  <button
                    key={node.url}
                    onClick={() => setSelectedImage(node.url)}
                    className={`relative w-full aspect-square overflow-hidden border transition-luxury ${
                      selectedImage === node.url
                        ? 'border-[#1a1a1a] ring-2 ring-[#1a1a1a] ring-opacity-20 opacity-100'
                        : 'border-gray-200 hover:border-gray-400 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <Image
                      src={node.url}
                      alt={node.altText || product.title}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center - Main Image (Scrollable on Desktop, Carousel on Mobile) */}
          <div className="col-span-12 md:col-span-6 order-1 md:order-2">
            <div className="md:sticky md:top-20">
              {/* Mobile - Image Gallery */}
              <div className="md:hidden mb-1">
                {/* Navigation Arrows - Outside image */}
                {product.images.edges.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mb-2 w-full">
                    <button
                      onClick={() => {
                        const newIndex = currentImageIndex === product.images.edges.length - 1 
                          ? 0 
                          : currentImageIndex + 1;
                        setCurrentImageIndex(newIndex);
                        setSelectedImage(product.images.edges[newIndex].node.url);
                      }}
                      className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all border border-gray-200 flex-shrink-0"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} className="text-[#1a1a1a]" />
                    </button>
                    {/* Main Image */}
                    <div 
                      className="relative bg-[#fdfcfb] overflow-hidden touch-none flex-shrink-0" 
                      style={{ width: '70%', maxWidth: '100%', aspectRatio: '2/3' }}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {selectedImage && (
                        <Image
                          src={selectedImage}
                          alt={product.title}
                          fill
                          className="object-contain select-none"
                          priority
                          draggable={false}
                        />
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const newIndex = currentImageIndex === 0 
                          ? product.images.edges.length - 1 
                          : currentImageIndex - 1;
                        setCurrentImageIndex(newIndex);
                        setSelectedImage(product.images.edges[newIndex].node.url);
                      }}
                      className="bg-white/90 hover:bg-white rounded-full p-2 shadow-md transition-all border border-gray-200 flex-shrink-0"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} className="text-[#1a1a1a]" />
                    </button>
                  </div>
                )}
                {/* Main Image - Without arrows if only one image */}
                {product.images.edges.length === 1 && (
                  <div 
                    className="relative bg-[#fdfcfb] overflow-hidden mb-2 mx-auto touch-none" 
                    style={{ width: '70%', aspectRatio: '2/3' }}
                  >
                    {selectedImage && (
                      <Image
                        src={selectedImage}
                        alt={product.title}
                        fill
                        className="object-contain select-none"
                        priority
                        draggable={false}
                      />
                    )}
                  </div>
                )}
                {/* Thumbnail Images - Scrollable */}
                {product.images.edges.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center w-full">
                    {product.images.edges.map(({ node }, index) => (
                      <button
                        key={node.url}
                        onClick={() => {
                          setSelectedImage(node.url);
                          setCurrentImageIndex(index);
                        }}
                        className={`relative flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-all ${
                          selectedImage === node.url
                            ? 'border-[#1a1a1a] opacity-100'
                            : 'border-gray-200 opacity-60'
                        }`}
                      >
                        <Image
                          src={node.url}
                          alt={node.altText || product.title}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Desktop - Scrollable images */}
              <div 
                ref={scrollContainerRef}
                className="hidden md:block overflow-y-auto max-h-[calc(100vh-120px)]"
              >
                <div className="space-y-4">
                  {product.images.edges.map(({ node }) => (
                    <div
                      key={node.url}
                      ref={(el) => {
                        imageRefs.current[node.url] = el;
                      }}
                      className="relative aspect-[4/5] bg-[#fdfcfb] overflow-hidden"
                    >
                      <Image
                        src={node.url}
                        alt={node.altText || product.title}
                        fill
                        className="object-cover"
                        priority={selectedImage === node.url}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Product Info (Fixed, No Scroll) */}
          <div className="col-span-12 md:col-span-4 order-2 md:order-3">
            <div className="md:sticky md:top-20">
              {/* Mobile - Sticky Price & CTA Section */}
              <div className="md:hidden sticky top-0 bg-[#fdfcfb] z-10 pb-3 border-b border-gray-200 mb-4 -mt-2 w-full">
                <div className="text-right space-y-3 pt-2 w-full">
                  {/* Title */}
                  <div>
                    <h1 className="text-xl font-light luxury-font leading-tight">
                      {product.title}
                    </h1>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-2xl font-light text-[#1a1a1a]">
                      ₪{price}
                    </p>
                    <p className="text-xs font-light text-gray-500 mt-1">כולל מע״מ</p>
                  </div>

                  {/* Variants */}
                  {product.variants.edges.length > 1 && (
                    <div>
                      <select
                        value={selectedVariant}
                        onChange={(e) => setSelectedVariant(e.target.value)}
                        className="w-full p-3 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury"
                      >
                        {product.variants.edges.map(({ node }) => (
                          <option key={node.id} value={node.id}>
                            {node.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Stock Status */}
                  {currentVariant && (
                    <div>
                      {currentVariant.availableForSale ? (
                        <p className="text-sm font-light text-gray-700">
                          במלאי
                          {currentVariant.quantityAvailable > 0 && (
                            <span className="text-gray-500"> • {currentVariant.quantityAvailable} יחידות</span>
                          )}
                        </p>
                      ) : (
                        <p className="text-sm font-light text-gray-600">אזל במלאי</p>
                      )}
                    </div>
                  )}

                  {/* CTAs */}
                  <div className="space-y-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={!currentVariant?.availableForSale}
                      className="w-full bg-[#1a1a1a] text-white py-3 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                    >
                      הוסף לעגלה
                    </button>
                    <button className="w-full border border-[#1a1a1a] text-[#1a1a1a] py-3 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury flex items-center justify-center gap-2">
                      <Heart size={18} />
                      שמור למועדפים
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop & Mobile - Full Product Info */}
              <div className="text-right space-y-6">
                {/* Desktop Title */}
                <div className="hidden md:block">
                  <h1 className="text-4xl md:text-5xl font-light luxury-font mb-3 leading-tight">
                    {product.title}
                  </h1>
                  {/* Short description tagline */}
                  <p className="text-sm font-light text-gray-600 tracking-luxury">
                    שילוב מושלם בין תחכום איטלקי לנוחות יומיומית בעיצוב על-זמני
                  </p>
                </div>

                {/* Desktop Price */}
                <div className="hidden md:block pt-2">
                  <p className="text-2xl md:text-3xl font-light text-[#1a1a1a]">
                    ₪{price}
                  </p>
                  <p className="text-xs font-light text-gray-500 mt-1">כולל מע״מ</p>
                </div>

                {/* Desktop Variants */}
                {product.variants.edges.length > 1 && (
                  <div className="hidden md:block">
                    <label className="block text-sm font-light mb-3 tracking-luxury uppercase">
                      בחר גרסה
                    </label>
                    <select
                      value={selectedVariant}
                      onChange={(e) => setSelectedVariant(e.target.value)}
                      className="w-full p-3 border border-gray-200 bg-white font-light text-sm focus:border-[#1a1a1a] focus:outline-none transition-luxury"
                    >
                      {product.variants.edges.map(({ node }) => (
                        <option key={node.id} value={node.id}>
                          {node.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Desktop Stock Status */}
                {currentVariant && (
                  <div className="hidden md:block pt-2">
                    {currentVariant.availableForSale ? (
                      <p className="text-sm font-light text-gray-700">
                        במלאי
                        {currentVariant.quantityAvailable > 0 && (
                          <span className="text-gray-500"> • {currentVariant.quantityAvailable} יחידות</span>
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm font-light text-gray-600">אזל במלאי</p>
                        <button className="text-xs font-light underline text-gray-600 hover:text-[#1a1a1a] transition-colors">
                          הודיעו לי כשחוזר
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Desktop CTAs */}
                <div className="hidden md:block space-y-3 pt-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!currentVariant?.availableForSale}
                    className="w-full bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                  >
                    הוסף לעגלה
                  </button>
                  <button className="w-full border border-[#1a1a1a] text-[#1a1a1a] py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury flex items-center justify-center gap-2">
                    <Heart size={18} />
                    שמור למועדפים
                  </button>
                </div>

                {/* Product Details */}
                <div className="pt-8 space-y-6 border-t border-gray-200">
                  {(product.descriptionHtml || product.description) && (
                    <div
                      className="product-description text-sm font-light text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: product.descriptionHtml || product.description }}
                    />
                  )}

                  <div>
                    <h3 className="text-sm font-light tracking-luxury uppercase mb-3 pb-3 border-b border-gray-200">משלוחים והחזרות</h3>
                    <p className="text-sm font-light text-gray-700 mb-2">
                      משלוח חינם מעל 500 ₪ • החזרה תוך 14 ימים
                    </p>
                    <div className="flex gap-4 text-xs">
                      <Link href="/shipping" className="underline text-gray-600 hover:text-[#1a1a1a]">
                        משלוחים
                      </Link>
                      <Link href="/returns" className="underline text-gray-600 hover:text-[#1a1a1a]">
                        החזרות
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 md:mt-24 pb-8 md:pb-12 bg-gray-100 pt-12 md:pt-16 -mx-4 px-4 md:-mx-0 md:px-0">
            <div className="max-w-[1400px] mx-auto">
              <h2 className="text-2xl md:text-3xl font-light luxury-font mb-8 md:mb-12 text-right text-[#1a1a1a]">מוצרים דומים</h2>
              <div className="relative">
                {/* Products Row - Scrollable */}
                <div 
                  ref={relatedProductsScrollRef}
                  className="overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 md:mx-0 md:px-0"
                >
                  <div className="flex gap-4 md:gap-6 min-w-max">
                    {relatedProducts.map((relatedProduct) => {
                      const firstVariant = relatedProduct.variants.edges[0]?.node;
                      const firstImage = relatedProduct.images.edges[0]?.node;
                      
                      return (
                        <div key={relatedProduct.id} className="flex-shrink-0 w-64 md:w-80">
                          <ProductCard
                            id={relatedProduct.id}
                            title={relatedProduct.title}
                            handle={relatedProduct.handle}
                            price={relatedProduct.priceRange.minVariantPrice.amount}
                            currencyCode={relatedProduct.priceRange.minVariantPrice.currencyCode}
                            image={firstImage?.url}
                            variantId={firstVariant?.id || ''}
                            available={firstVariant?.availableForSale || false}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Navigation Arrows - Desktop only */}
                {relatedProducts.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        const container = relatedProductsScrollRef.current;
                        if (container) {
                          const scrollAmount = 320; // w-80 + gap
                          container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                        }
                      }}
                      className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-all border border-gray-200 z-10"
                      aria-label="Previous products"
                    >
                      <ChevronLeft size={20} className="text-[#1a1a1a]" />
                    </button>
                    <button
                      onClick={() => {
                        const container = relatedProductsScrollRef.current;
                        if (container) {
                          const scrollAmount = 320; // w-80 + gap
                          container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                        }
                      }}
                      className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 rounded-full p-3 shadow-lg transition-all border border-gray-200 z-10"
                      aria-label="Next products"
                    >
                      <ChevronRight size={20} className="text-[#1a1a1a]" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <Toast show={showToast} message="נוסף לעגלה" showViewCart={true} />
    </div>
  );
}

