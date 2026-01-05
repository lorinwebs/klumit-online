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
    loadFromShopify().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/10 w-full max-w-[100vw] overflow-x-hidden shadow-sm">
      
      {/* --- שורה עליונה: לוגו ואייקונים --- */}
      <nav className="w-full px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        
        {/* לוגו */}
        <Link href="/" className="text-2xl luxury-font font-light tracking-luxury text-[#1a1a1a] flex-shrink-0 z-10">
          Klumit
        </Link>
        
        {/* תפריט דסקטופ (מוסתר במובייל) */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2" aria-label="תפריט ניווט ראשי">
          <Link href="/products" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
            תיקים
          </Link>
          <span className="w-px h-4 bg-gray-300" />
          <Link href="/products?tab=belts" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
            חגורות
          </Link>
          <span className="w-px h-4 bg-gray-300" />
          <Link href="/about" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
            אודות
          </Link>
        </nav>

        {/* צד שמאל - אייקונים */}
        <div className="flex items-center gap-4 md:gap-4 flex-shrink-0">
          <UserMenu />
          
          <Link 
            href="/cart" 
            className="relative hover:opacity-70 transition-opacity flex items-center justify-center w-6 h-6"
            aria-label={`סל קניות${mounted && itemCount > 0 ? ` (${itemCount} פריטים)` : ''}`}
          >
            <ShoppingBag size={22} className="text-[#1a1a1a]" aria-hidden="true" />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#1a1a1a] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-light" aria-hidden="true">
                {itemCount}
              </span>
            )}
          </Link>
          
          <button
            className="md:hidden flex items-center justify-center w-6 h-6"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* --- שורה תחתונה למובייל בלבד (פס קטגוריות) --- */}
      <div className="md:hidden w-full flex items-center justify-center gap-6 py-2 border-t border-gray-100 bg-white">
          <Link href="/products" className="text-xs font-medium tracking-widest uppercase text-[#1a1a1a] hover:opacity-70">
            תיקים
          </Link>
          <span className="w-px h-3 bg-gray-300" />
          <Link href="/products?tab=belts" className="text-xs font-medium tracking-widest uppercase text-[#1a1a1a] hover:opacity-70">
            חגורות
          </Link>
      </div>

      {/* --- תפריט המבורגר נפתח --- */}
      {mobileMenuOpen && (
        <nav id="mobile-menu" className="md:hidden border-t border-black/10 bg-white absolute w-full left-0 top-full h-screen">
          <div className="flex flex-col gap-6 pt-8 text-center px-6">
            <Link href="/products" className="text-lg tracking-widest uppercase hover:opacity-70 border-b border-gray-50 pb-4" onClick={() => setMobileMenuOpen(false)}>
              כל התיקים
            </Link>
            <Link href="/products?tab=belts" className="text-lg tracking-widest uppercase hover:opacity-70 border-b border-gray-50 pb-4" onClick={() => setMobileMenuOpen(false)}>
              חגורות
            </Link>
            <Link href="/about" className="text-lg tracking-widest uppercase hover:opacity-70 border-b border-gray-50 pb-4" onClick={() => setMobileMenuOpen(false)}>
              אודות המותג
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
