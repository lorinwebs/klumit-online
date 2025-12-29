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
      <main className="flex-grow max-w-7xl mx-auto px-4 py-16 md:py-20">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-12 text-right">
          עגלת קניות
        </h1>

        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-6">
            {items.map((item) => (
              <div
                key={item.variantId}
                className="flex gap-6 pb-6 border-b border-gray-200 last:border-0"
              >
                {item.image && (
                  <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0 overflow-hidden bg-[#f5f5f5]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg md:text-xl font-light luxury-font mb-2">
                      {item.title}
                    </h3>
                    <div className="text-base md:text-lg font-light text-[#1a1a1a] mb-4">
                      ₪{formatPrice(parseFloat(item.price))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="p-2 hover:bg-gray-50 transition-colors"
                        aria-label="הפחת כמות"
                      >
                        <Minus size={14} className="text-gray-600" />
                      </button>
                      <span className="px-4 py-2 text-sm font-light min-w-[3rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="p-2 hover:bg-gray-50 transition-colors"
                        aria-label="הוסף כמות"
                      >
                        <Plus size={14} className="text-gray-600" />
                      </button>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="text-gray-400 hover:text-[#1a1a1a] transition-colors p-2"
                      aria-label="הסר מהעגלה"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Total Price */}
                <div className="text-left flex items-start pt-1">
                  <div className="text-lg md:text-xl font-light text-[#1a1a1a]">
                    ₪{formatPrice(parseFloat(item.price) * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className="sticky top-24 space-y-6">
              <div>
                <h2 className="text-xl md:text-2xl font-light luxury-font mb-6 text-right">
                  סיכום הזמנה
                </h2>
                <div className="space-y-4 text-sm font-light">
                  <div className="flex justify-between text-gray-700">
                    <span>פריטים ({getItemCount()})</span>
                    <span>₪{formatPrice(getTotal())}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>משלוח</span>
                    <span className="text-gray-500">חינם</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between text-base md:text-lg">
                      <span className="font-light">סה״כ</span>
                      <span className="font-light text-[#1a1a1a]">
                        ₪{formatPrice(getTotal())}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">כולל מע״מ</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 pt-4">
                <Link
                  href="/checkout"
                  className="block w-full bg-[#1a1a1a] text-white py-4 px-6 text-sm tracking-luxury uppercase font-light hover:bg-[#2a2a2a] transition-luxury text-center"
                >
                  המשך לתשלום
                </Link>
                <button
                  onClick={clearCart}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 text-sm tracking-luxury uppercase font-light hover:border-[#1a1a1a] hover:text-[#1a1a1a] transition-luxury"
                >
                  נקה עגלה
                </button>
                <Link
                  href="/products"
                  className="block w-full text-center text-sm font-light text-gray-600 hover:text-[#1a1a1a] transition-colors underline underline-offset-4"
                >
                  המשך לקניות
                </Link>
              </div>

              {/* Shipping Info */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-xs font-light text-gray-600 leading-relaxed">
                  משלוח חינם מעל 500 ₪ • החזרה תוך 14 ימים
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

