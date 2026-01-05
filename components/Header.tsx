'use client';

import Link from 'next/link';
import { ShoppingBag, Menu } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect } from 'react';
import UserMenu from './UserMenu';

export default function Header() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/10">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl luxury-font font-light tracking-luxury text-[#1a1a1a]">
            Klumit
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/products" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
              תיקים
            </Link>
            <span className="w-px h-4 bg-gray-300"></span>
            <Link href="/products?tab=belts" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
              חגורות
            </Link>
            <span className="w-px h-4 bg-gray-300"></span>
            <Link href="/about" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
              אודות
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <UserMenu />
            <Link 
              href="/cart" 
              className="relative p-2 hover:opacity-70 transition-opacity"
            >
              <ShoppingBag size={24} className="text-[#1a1a1a]" />
              {mounted && itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#1a1a1a] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-light">
                  {itemCount}
                </span>
              )}
            </Link>
            
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile category row */}
        <div className="md:hidden flex items-center justify-center gap-4 pt-3 border-t border-black/5 mt-3">
          <Link href="/products" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
            תיקים
          </Link>
          <span className="w-px h-4 bg-gray-300"></span>
          <Link href="/products?tab=belts" className="text-sm tracking-luxury uppercase font-light hover:opacity-70 transition-opacity">
            חגורות
          </Link>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-luxury-gold/20">
            <div className="flex flex-col gap-4 pt-4">
              <Link href="/products" className="hover:text-luxury-gold transition-colors">
                תיקים
              </Link>
              <Link href="/products?tab=belts" className="hover:text-luxury-gold transition-colors">
                חגורות
              </Link>
              <Link href="/about" className="hover:text-luxury-gold transition-colors">
                אודות
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

