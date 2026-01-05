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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/10 w-full max-w-[100vw] overflow-x-hidden">
      <nav className="w-full px-3 md:px-6 py-2.5 md:py-4">
        <div className="flex items-center justify-between w-full">
          {/* לוגו */}
          <Link href="/" className="text-xl md:text-2xl luxury-font font-light tracking-luxury text-[#1a1a1a] flex-shrink-0">
            Klumit
          </Link>
          
          {/* תפריט דסקטופ */}
          <nav className="hidden md:flex items-center gap-8" aria-label="תפריט ניווט ראשי">
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

          {/* צד שמאל - הכל בשורה אחת */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* קישורים במובייל */}
            <div className="md:hidden flex items-center gap-3">
              <Link href="/products" className="text-[13px] text-[#1a1a1a] hover:opacity-70">
                תיקים
              </Link>
              <span className="w-px h-3.5 bg-gray-300" />
              <Link href="/products?tab=belts" className="text-[13px] text-[#1a1a1a] hover:opacity-70">
                חגורות
              </Link>
            </div>
            
            <UserMenu />
            
            <Link 
              href="/cart" 
              className="relative hover:opacity-70 transition-opacity"
              aria-label={`סל קניות${mounted && itemCount > 0 ? ` (${itemCount} פריטים)` : ''}`}
            >
              <ShoppingBag size={20} className="md:w-[22px] md:h-[22px] text-[#1a1a1a]" aria-hidden="true" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#1a1a1a] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-light" aria-hidden="true">
                  {itemCount}
                </span>
              )}
            </Link>
            
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* תפריט המבורגר */}
        {mobileMenuOpen && (
          <nav id="mobile-menu" className="md:hidden mt-4 pb-4 border-t border-black/10" aria-label="תפריט ניווט ראשי">
            <div className="flex flex-col gap-4 pt-4 text-right pr-4">
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
