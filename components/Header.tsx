'use client';

import Link from 'next/link';
import { ShoppingBag, Menu } from 'lucide-react';
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
          
          <nav className="hidden md:flex items-center gap-8" aria-label="תפריט ניווט ראשי">
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
          </nav>

          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            {/* Mobile - Bags & Belts text links */}
            <Link 
              href="/products" 
              className="md:hidden text-[11px] tracking-wide hover:opacity-70 transition-opacity text-[#1a1a1a] flex items-center h-[18px]"
            >
              תיקים
            </Link>
            <span className="md:hidden w-px h-3 bg-gray-300" />
            <Link 
              href="/products?tab=belts" 
              className="md:hidden text-[11px] tracking-wide hover:opacity-70 transition-opacity text-[#1a1a1a] flex items-center h-[18px]"
            >
              חגורות
            </Link>
            <UserMenu />
            <Link 
              href="/cart" 
              className="relative p-1 md:p-2 hover:opacity-70 transition-opacity flex items-center"
              aria-label={`סל קניות${mounted && itemCount > 0 ? ` (${itemCount} פריטים)` : ''}`}
            >
              <ShoppingBag size={18} className="md:w-[22px] md:h-[22px] text-[#1a1a1a]" aria-hidden="true" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1a1a1a] text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-light" aria-hidden="true">
                  {itemCount}
                </span>
              )}
            </Link>
            
            <button
              className="md:hidden p-1 flex items-center"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav id="mobile-menu" className="md:hidden mt-4 pb-4 border-t border-black/10" aria-label="תפריט ניווט ראשי">
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
          </nav>
        )}
      </nav>
    </header>
  );
}

