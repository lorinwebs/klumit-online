'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { shopifyClient, PRODUCT_QUERY } from '@/lib/shopify';
import { useCartStore } from '@/store/cartStore';
import { ShoppingBag, Heart } from 'lucide-react';
import Link from 'next/link';
import Toast from '@/components/Toast';

interface Product {
  id: string;
  title: string;
  description: string;
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
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

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
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="grid md:grid-cols-2 gap-16 md:gap-20">
          {/* Image Gallery */}
          <div>
            <div className="mb-6">
              <div className="relative aspect-[4/5] bg-[#f5f5f5] overflow-hidden">
                {selectedImage && (
                  <Image
                    src={selectedImage}
                    alt={product.title}
                    fill
                    className="object-cover"
                    priority
                  />
                )}
              </div>
            </div>
            {product.images.edges.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.edges.map(({ node }) => (
                  <button
                    key={node.url}
                    onClick={() => setSelectedImage(node.url)}
                    className={`relative aspect-square overflow-hidden border transition-luxury ${
                      selectedImage === node.url
                        ? 'border-[#1a1a1a]'
                        : 'border-transparent hover:border-gray-300'
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

          {/* Product Info */}
          <div className="text-right space-y-6">
            {/* Title */}
            <div>
              <h1 className="text-4xl md:text-5xl font-light luxury-font mb-3 leading-tight">
                {product.title}
              </h1>
              {/* Short description tagline */}
              <p className="text-sm font-light text-gray-600 tracking-luxury">
                תיק ערב בעבודת יד • עור אמיתי • ניטים בגימור זהב
              </p>
            </div>

            {/* Price */}
            <div className="pt-2">
              <p className="text-2xl md:text-3xl font-light text-[#1a1a1a]">
                ₪{price}
              </p>
              <p className="text-xs font-light text-gray-500 mt-1">כולל מע״מ</p>
            </div>

            {/* Variants */}
            {product.variants.edges.length > 1 && (
              <div>
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

            {/* Stock Status - Premium */}
            {currentVariant && (
              <div className="pt-2">
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

            {/* CTAs */}
            <div className="space-y-3 pt-4">
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
              <div>
                <h3 className="text-sm font-light tracking-luxury uppercase mb-3">חומרים וגימורים</h3>
                <p className="text-sm font-light text-gray-700 leading-relaxed">
                  עור איטלקי איכותי, תפירה ידנית, ניטים מזהב 18 קראט, ריפוד פנימי מבד יוקרתי
                </p>
              </div>

              <div>
                <h3 className="text-sm font-light tracking-luxury uppercase mb-3">מידות</h3>
                <p className="text-sm font-light text-gray-700">
                  גובה: 28 ס״מ • רוחב: 35 ס״מ • עומק: 12 ס״מ
                </p>
              </div>

              <div>
                <h3 className="text-sm font-light tracking-luxury uppercase mb-3">מה כלול</h3>
                <ul className="text-sm font-light text-gray-700 space-y-1">
                  <li>• תיק בעבודת יד</li>
                  <li>• שקית בד יוקרתית</li>
                  <li>• קופסת מתנה מעוצבת</li>
                  <li>• תעודת אחריות</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-light tracking-luxury uppercase mb-3">משלוחים והחזרות</h3>
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

            {/* Full Description */}
            {product.description && (
              <div className="pt-8 border-t border-gray-200">
                <h3 className="text-sm font-light tracking-luxury uppercase mb-4">תיאור</h3>
                <div
                  className="text-sm font-light text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <Toast show={showToast} message="נוסף לעגלה" showViewCart={true} />
    </div>
  );
}

