'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import Toast from '@/components/Toast';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotal,
    getItemCount,
    clearCart,
    loadFromShopify,
    cartId,
    isLoading,
  } = useCartStore();
  
  const [showStockToast, setShowStockToast] = useState(false);
  const [stockMessage, setStockMessage] = useState('');

  // טען רק פעם אחת בטעינה הראשונית
  useEffect(() => {
    loadFromShopify().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // לוג Cart ID והסיבה - רק אחרי שהעגלה נטענה
  useEffect(() => {
    // לא נדפיס לוג בזמן טעינה
    if (isLoading) {
      return;
    }
    
    const logCartInfo = async () => {
      try {
        // משתמשים ב-API route כדי לבדוק את הסשן מהקוקיז (אמין יותר)
        const response = await fetch('/api/auth/session', { 
          credentials: 'include',
          cache: 'no-store'
        });
        const data = response.ok ? await response.json() : null;
        const isLoggedIn = !!(data?.user || data?.session?.user);
        
        let reason = '';
        if (isLoggedIn) {
          const localStorageCartId = typeof window !== 'undefined' ? localStorage.getItem('klumit-cart-id') : null;
          if (cartId) {
            if (localStorageCartId === cartId) {
              reason = 'מצאנו עגלה ב-metafields של המשתמש המחובר';
            } else {
              reason = 'עגלה מ-metafields (לא תואמת ל-localStorage)';
            }
          } else {
            reason = 'אין עגלה - המשתמש מחובר אבל לא נמצאה עגלה ב-metafields';
          }
        } else {
          const localStorageCartId = typeof window !== 'undefined' ? localStorage.getItem('klumit-cart-id') : null;
          if (cartId) {
            if (localStorageCartId === cartId) {
              reason = 'עגלה מ-localStorage (משתמש לא מחובר)';
            } else {
              reason = 'עגלה קיימת אבל לא תואמת ל-localStorage';
            }
          } else {
            reason = 'אין עגלה - משתמש לא מחובר ואין עגלה ב-localStorage';
          }
        }
        
        console.log('🛒 CART INFO:', {
          cartId: cartId || 'null',
          reason,
          isLoggedIn,
          itemsCount: items.length,
        });
      } catch (err) {
        console.log('🛒 CART INFO:', {
          cartId: cartId || 'null',
          reason: 'שגיאה בבדיקת מידע',
          itemsCount: items.length,
        });
      }
    };
    
    logCartInfo();
  }, [cartId, items.length, isLoading]);

  // פורמט מחיר פרימיום
  const formatPrice = (amount: number) => {
    return Math.round(amount).toLocaleString('he-IL');
  };

  // Convert color name to hex value
  const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
      // English colors
      'black': '#000000',
      'white': '#FFFFFF',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'gray': '#808080',
      'grey': '#808080',
      'navy': '#000080',
      'beige': '#F5F5DC',
      'khaki': '#C3B091',
      'tan': '#D2B48C',
      'burgundy': '#800020',
      'maroon': '#800000',
      'coral': '#FF7F50',
      'turquoise': '#40E0D0',
      'teal': '#008080',
      'olive': '#808000',
      'lime': '#00FF00',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'gold': '#FFD700',
      'silver': '#C0C0C0',
      // Hebrew colors
      'שחור': '#000000',
      'לבן': '#FFFFFF',
      'אדום': '#FF0000',
      'כחול': '#0000FF',
      'ירוק': '#008000',
      'צהוב': '#FFFF00',
      'כתום': '#FFA500',
      'סגול': '#800080',
      'ורוד': '#FFC0CB',
      'חום': '#A52A2A',
      'אפור': '#808080',
      'כחול כהה': '#000080',
      'בז': '#F5F5DC',
      'קרם': '#FFFDD0',
      'בורדו': '#800020',
      'טורקיז': '#40E0D0',
      'זהב': '#FFD700',
      'כסף': '#C0C0C0',
    };
    
    const normalizedName = colorName.toLowerCase().trim();
    return colorMap[normalizedName] || '#CCCCCC'; // Default gray if color not found
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
        <Header />
        <main className="flex-grow max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-6" />
            <h1 className="text-3xl md:text-4xl font-light luxury-font mb-4 text-[#1a1a1a]">
              העגלה שלך ריקה
            </h1>
            <p className="text-sm font-light text-gray-600 mb-12 tracking-luxury">
              הוסף מוצרים לעגלה כדי להתחיל
            </p>
            <Link
              href="/products"
              className="inline-block border border-[#1a1a1a] text-[#1a1a1a] px-10 py-3 text-sm tracking-luxury uppercase font-light hover:bg-[#1a1a1a] hover:text-white transition-luxury"
            >
              המשך לקניות
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]">
      <Header />
      <main className="flex-grow w-full">
        <div className="w-full px-6 md:px-12 lg:px-16 xl:px-24 py-8 md:py-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light luxury-font mb-8 md:mb-10 text-right">
            עגלת קניות
          </h1>

          <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-8 lg:gap-12 xl:gap-16">
            {/* Cart Items */}
            <div className="space-y-4 md:space-y-5">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 md:gap-6 lg:gap-8 pb-5 md:pb-6 border-b border-gray-100 last:border-0"
                >
                  {item.image && (
                    <Link 
                      href={item.handle ? `/products/${item.handle}` : '#'}
                      className="relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 flex-shrink-0 overflow-hidden bg-[#fafafa] hover:opacity-80 transition-opacity"
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </Link>
                  )}
                  <div className="flex-grow flex flex-col justify-between min-w-0">
                    <div>
                      <Link 
                        href={item.handle ? `/products/${item.handle}` : '#'}
                        className="block hover:opacity-70 transition-opacity"
                      >
                        <h3 className="text-base md:text-lg lg:text-xl font-light luxury-font mb-1.5 md:mb-2">
                          {item.title}
                        </h3>
                      </Link>
                      {item.color && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs md:text-sm font-light text-gray-500">צבע:</span>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: getColorHex(item.color) }}
                              aria-label={item.color}
                            />
                            <span className="text-xs md:text-sm font-light text-gray-500">{item.color}</span>
                          </div>
                        </div>
                      )}
                      {item.variantTitle && item.variantTitle !== 'Default Title' && !item.color && (
                        <p className="text-xs md:text-sm font-light text-gray-500 mb-1">
                          {item.variantTitle}
                        </p>
                      )}
                      <div className="text-sm md:text-base lg:text-lg font-light text-[#1a1a1a] mb-3 md:mb-4">
                        ₪{formatPrice(parseFloat(item.price))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Quantity Controls */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1).catch(() => {})}
                            className="p-1.5 md:p-2 hover:bg-gray-50 transition-colors"
                            aria-label="הפחת כמות"
                          >
                            <Minus size={12} className="text-gray-600" />
                          </button>
                          <span className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-light min-w-[2.5rem] md:min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              // אם הכפתור disabled, לא עושים כלום
                              if (item.quantityAvailable !== undefined && item.quantity >= item.quantityAvailable) {
                                return;
                              }
                              updateQuantity(item.variantId, item.quantity + 1).catch(() => {});
                            }}
                            disabled={item.quantityAvailable !== undefined && item.quantity >= item.quantityAvailable}
                            className={`p-1.5 md:p-2 transition-colors ${
                              item.quantityAvailable !== undefined && item.quantity >= item.quantityAvailable
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-gray-50'
                            }`}
                            aria-label="הוסף כמות"
                            title={item.quantityAvailable !== undefined && item.quantity >= item.quantityAvailable 
                              ? `מקסימום ${item.quantityAvailable} יחידות במלאי` 
                              : undefined}
                          >
                            <Plus size={12} className="text-gray-600" />
                          </button>
                        </div>
                        {/* Inventory Notice - מתחת לכפתורי כמות */}
                        {item.quantityAvailable !== undefined && item.quantity >= item.quantityAvailable && (
                          <span className="text-xs text-amber-600 font-light">
                            מקסימום במלאי ({item.quantityAvailable} יחידות)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Price with Remove Button */}
                  <div className="text-left flex items-start pt-1 flex-shrink-0 gap-2">
                    <div className="text-base md:text-lg lg:text-xl font-light text-[#1a1a1a] whitespace-nowrap">
                      ₪{formatPrice(parseFloat(item.price) * item.quantity)}
                    </div>
                    <button
                      onClick={() => removeItem(item.variantId).catch(() => {})}
                      className="text-gray-400 hover:text-[#1a1a1a] transition-colors p-1.5 flex-shrink-0 self-start mt-0.5"
                      aria-label="הסר מהעגלה"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-5 md:space-y-6">
                <div>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-light luxury-font mb-5 md:mb-6 text-right">
                    סיכום הזמנה
                  </h2>
                  <div className="space-y-3 md:space-y-4 text-xs md:text-sm font-light">
                    <div className="flex justify-between text-gray-700">
                      <span>פריטים ({getItemCount()})</span>
                      <span>₪{formatPrice(getTotal())}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>משלוח</span>
                      <span className="text-gray-500">חינם</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 md:pt-4 mt-3 md:mt-4">
                      <div className="flex justify-between text-sm md:text-base lg:text-lg">
                        <span className="font-light">סה״כ</span>
                        <span className="font-light text-[#1a1a1a]">
                          ₪{formatPrice(getTotal())}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-right">כולל מע״מ</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2.5 md:space-y-3 pt-3 md:pt-4">
                  <Link
                    href="/checkout"
                    className="block w-full bg-[#1a1a1a] text-white py-3.5 md:py-4 px-6 text-xs md:text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury text-center"
                  >
                    המשך לתשלום
                  </Link>
                  <button
                    onClick={clearCart}
                    className="w-full border border-gray-300 text-gray-700 py-2.5 md:py-3 px-6 text-xs md:text-sm tracking-luxury uppercase font-light hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-luxury"
                  >
                    נקה עגלה
                  </button>
                  <Link
                    href="/products"
                    className="block w-full text-center text-xs md:text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors underline underline-offset-4"
                  >
                    המשך לקניות
                  </Link>
                </div>

                {/* Shipping Info */}
                <div className="pt-4 md:pt-6 border-t border-gray-200">
                  <p className="text-xs font-light text-gray-600 leading-relaxed">
                    משלוח חינם מעל 500 ₪ • החזרה תוך 14 ימים
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <Toast show={showStockToast} message={stockMessage} showViewCart={false} type="warning" />
    </div>
  );
}

