'use client';

import Link from 'next/link';
import { ShoppingBag, Menu, Package, CircleDot, Info } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/10">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl luxury-font font-light tracking-luxury text-[#1a1a1a]">
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

          <div className="flex items-center gap-4">
            <UserMenu />
            {/* Mobile - Belts Icon */}
            <Link 
              href="/products?tab=belts" 
              className="md:hidden p-2 hover:opacity-70 transition-opacity"
              aria-label="חגורות"
            >
              <CircleDot size={24} className="text-[#1a1a1a]" />
            </Link>
            {/* Mobile - Products Icon */}
            <Link 
              href="/products" 
              className="md:hidden p-2 hover:opacity-70 transition-opacity"
              aria-label="תיקים"
            >
              <Package size={24} className="text-[#1a1a1a]" />
            </Link>
            {/* Mobile - About Icon */}
            <Link 
              href="/about" 
              className="md:hidden p-2 hover:opacity-70 transition-opacity"
              aria-label="אודות"
            >
              <Info size={24} className="text-[#1a1a1a]" />
            </Link>
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

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-luxury-gold/20">
            <div className="flex flex-col gap-4 pt-4">
              <Link href="/" className="hover:text-luxury-gold transition-colors">
                בית
              </Link>
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

