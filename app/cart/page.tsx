'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCartStore } from '@/store/cartStore';
import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, X, ShoppingBag } from 'lucide-react';
import Toast from '@/components/Toast';

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotal,
    getItemCount,
    clearCart,
  } = useCartStore();

  // פורמט מחיר פרימיום
  const formatPrice = (amount: number) => {
    return Math.round(amount).toLocaleString('he-IL');
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
                    <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 flex-shrink-0 overflow-hidden bg-[#fafafa]">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-grow flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-base md:text-lg lg:text-xl font-light luxury-font mb-1.5 md:mb-2">
                        {item.title}
                      </h3>
                      {item.color && (
                        <p className="text-xs md:text-sm font-light text-gray-500 mb-1">
                          צבע: {item.color}
                        </p>
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
                    
                    <div className="flex items-center justify-between gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1.5 md:p-2 hover:bg-gray-50 transition-colors"
                          aria-label="הפחת כמות"
                        >
                          <Minus size={12} className="text-gray-600" />
                        </button>
                        <span className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-light min-w-[2.5rem] md:min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1.5 md:p-2 hover:bg-gray-50 transition-colors"
                          aria-label="הוסף כמות"
                        >
                          <Plus size={12} className="text-gray-600" />
                        </button>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-gray-400 hover:text-[#1a1a1a] transition-colors p-1.5 md:p-2 flex-shrink-0"
                        aria-label="הסר מהעגלה"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Total Price */}
                  <div className="text-left flex items-start pt-1 flex-shrink-0">
                    <div className="text-base md:text-lg lg:text-xl font-light text-[#1a1a1a] whitespace-nowrap">
                      ₪{formatPrice(parseFloat(item.price) * item.quantity)}
                    </div>
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
    </div>
  );
}

