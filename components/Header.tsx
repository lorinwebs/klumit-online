'use client';

import Link from 'next/link';
import { ShoppingBag, Menu, Package, Circle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect } from 'react';
import UserMenu from './UserMenu';

export default function Header() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const loadFromShopify = useCartStore((state) => state.loadFromShopify);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // טען את העגלה מ-Shopify רק פעם אחת בהתחלה
    loadFromShopify().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/10 w-full max-w-[100vw] overflow-x-hidden">
      <nav className="w-full px-3 md:px-6 py-3 md:py-4">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="text-xl md:text-2xl luxury-font font-light tracking-luxury text-[#1a1a1a] flex-shrink-0">
            Klumit
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
              בית
            </Link>
            <Link href="/products" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
              תיקים
            </Link>
            <Link href="/products?tab=belts" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
              חגורות
            </Link>
            <Link href="/about" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
              אודות
            </Link>
          </div>

          <div className="flex items-center gap-0.5 md:gap-4 flex-shrink-0">
            <UserMenu />
            {/* Mobile - Bags Icon */}
            <Link 
              href="/products" 
              className="md:hidden p-1 hover:opacity-70 transition-opacity"
              aria-label="תיקים"
            >
              <Package size={18} className="text-[#1a1a1a]" />
            </Link>
            {/* Mobile - Belts Icon */}
            <Link 
              href="/products?tab=belts" 
              className="md:hidden p-1 hover:opacity-70 transition-opacity"
              aria-label="חגורות"
            >
              <Circle size={18} className="text-[#1a1a1a]" />
            </Link>
            <Link 
              href="/cart" 
              className="relative p-1 md:p-2 hover:opacity-70 transition-opacity"
            >
              <ShoppingBag size={18} className="md:w-[22px] md:h-[22px] text-[#1a1a1a]" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1a1a1a] text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-light">
                  {itemCount}
                </span>
              )}
            </Link>
            
            <button
              className="md:hidden p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="תפריט"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-black/10">
            <div className="flex flex-col gap-4 pt-4 text-right pr-4">
              <Link href="/" className="hover:opacity-70 transition-opacity text-base" onClick={() => setMobileMenuOpen(false)}>
                בית
              </Link>
              <Link href="/products" className="hover:opacity-70 transition-opacity text-base" onClick={() => setMobileMenuOpen(false)}>
                תיקים
              </Link>
              <Link href="/products?tab=belts" className="hover:opacity-70 transition-opacity text-base" onClick={() => setMobileMenuOpen(false)}>
                חגורות
              </Link>
              <Link href="/about" className="hover:opacity-70 transition-opacity text-base" onClick={() => setMobileMenuOpen(false)}>
                אודות
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

