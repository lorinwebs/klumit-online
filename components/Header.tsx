'use client';

import Link from 'next/link';
import { ShoppingBag, Menu } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import UserMenu from './UserMenu';

export default function Header() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const loadFromShopify = useCartStore((state) => state.loadFromShopify);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentTab = searchParams?.get('tab') || 'bags';
  const isProductsPage = pathname === '/products';

  useEffect(() => {
    setMounted(true);
    loadFromShopify().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header 
      className="sticky top-0 z-50 bg-white w-full"
      dir="rtl"
      suppressHydrationWarning
    >
      {/* --- שורה עליונה: Grid 3 עמודות --- */}
      <nav className="w-full px-4 py-3 md:px-6 md:py-4 grid grid-cols-[auto_1fr_auto] items-center gap-4 h-14 md:h-auto">
        
        {/* ימין - לוגו */}
        <Link href="/" className="flex items-center h-full text-2xl luxury-font font-light tracking-luxury text-[#1a1a1a] shrink-0">
          Klumit
        </Link>
        
        {/* מרכז - תפריט דסקטופ */}
        <nav className="hidden md:flex items-center justify-center gap-8 h-full" aria-label="תפריט ניווט ראשי">
          <Link href="/products?tab=bags" className={`text-sm tracking-luxury uppercase font-light transition-colors whitespace-nowrap ${isProductsPage && currentTab === 'bags' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`}>
            תיקים
          </Link>
          <span className="w-px h-4 bg-gray-300 shrink-0" />
          <Link href="/products?tab=belts" className={`text-sm tracking-luxury uppercase font-light transition-colors whitespace-nowrap ${isProductsPage && currentTab === 'belts' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`}>
            חגורות
          </Link>
          <span className="w-px h-4 bg-gray-300 shrink-0" />
          <Link href="/products?tab=wallets" className={`text-sm tracking-luxury uppercase font-light transition-colors whitespace-nowrap ${isProductsPage && currentTab === 'wallets' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`}>
            ארנקים
          </Link>
          <span className="w-px h-4 bg-gray-300 shrink-0" />
          <Link href="/about" className={`text-sm tracking-luxury uppercase font-light transition-colors whitespace-nowrap ${pathname === '/about' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`}>
            אודות
          </Link>
        </nav>
        
        {/* מרכז ריק במובייל */}
        <div className="md:hidden" />

        {/* שמאל - אייקונים */}
        <div className="flex items-center gap-3 md:gap-4 shrink-0 h-full">
          <UserMenu />
          
          <Link 
            href="/cart" 
            className="relative hover:opacity-70 transition-opacity flex items-center justify-center w-8 h-8 shrink-0"
            aria-label={mounted && itemCount > 0 ? `סל קניות (${itemCount} פריטים)` : 'סל קניות'}
          >
            <ShoppingBag size={22} className="text-[#1a1a1a]" aria-hidden="true" />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#1a1a1a] text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-light" aria-hidden="true">
                {itemCount}
              </span>
            )}
          </Link>
          
          {/* כפתור וואטסאפ במובייל */}
          <Link
            href="https://wa.me/972549903139"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center gap-1.5 border border-gray-300 text-[#1a1a1a] px-2.5 py-1.5 rounded-sm hover:border-[#25D366] hover:text-[#25D366] transition-all shrink-0"
            aria-label="שירות לקוחות בוואטסאפ"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span className="text-[10px] font-light tracking-wide uppercase whitespace-nowrap">שירות לקוחות</span>
          </Link>
          
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
          >
            <Menu size={22} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* --- באנר השקה --- */}
      <a 
        href="https://www.instagram.com/klumit_bags/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full bg-black text-white flex items-center justify-center h-10 md:h-auto md:py-2 text-xs md:text-sm tracking-wide hover:bg-gray-800 transition-colors"
      >
        🎉 לרגל השקת האתר - קופון חדש: NEWWEB10
      </a>

      {/* --- שורה תחתונה למובייל בלבד (פס קטגוריות) --- */}
      {/* תיקון קריטי לאייפון:
          1. h-10: קבעתי גובה סופי וקבוע (40px) במקום padding.
          2. לקישורים הוספתי 'flex items-center h-full': זה מכריח את הטקסט להתמרכז בתוך הגובה הזה,
             לא משנה איך ספארי מחשב את גובה הפונט.
      */}
      <div className="md:hidden w-full flex items-center justify-center gap-5 h-10 border-t border-gray-100 bg-white">
        <Link 
            href="/products?tab=bags" 
            className={`flex items-center h-full text-xs font-medium tracking-wide uppercase transition-colors ${isProductsPage && currentTab === 'bags' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`}
        >
            תיקים
        </Link>
        
        <span className="w-px h-3 bg-gray-300 block" />
        
        <Link 
            href="/products?tab=belts" 
            className={`flex items-center h-full text-xs font-medium tracking-wide uppercase transition-colors ${isProductsPage && currentTab === 'belts' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`}
        >
            חגורות
        </Link>
        
        <span className="w-px h-3 bg-gray-300 block" />
        
        <Link 
            href="/products?tab=wallets" 
            className={`flex items-center h-full text-xs font-medium tracking-wide uppercase transition-colors ${isProductsPage && currentTab === 'wallets' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`}
        >
            ארנקים
        </Link>
      </div>

      {/* --- תפריט המבורגר נפתח --- */}
      {mobileMenuOpen && (
        <nav 
            id="mobile-menu" 
            className="md:hidden border-t border-black/10 bg-white absolute w-full left-0 top-full h-[calc(100dvh-100%)] z-50 overflow-y-auto pb-20"
        >
          <div className="flex flex-col gap-6 pt-8 text-center px-6">
            <Link href="/products?tab=bags" className={`text-lg tracking-widest uppercase border-b border-gray-50 pb-4 ${isProductsPage && currentTab === 'bags' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`} onClick={() => setMobileMenuOpen(false)}>
              תיקים
            </Link>
            <Link href="/products?tab=belts" className={`text-lg tracking-widest uppercase border-b border-gray-50 pb-4 ${isProductsPage && currentTab === 'belts' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`} onClick={() => setMobileMenuOpen(false)}>
              חגורות
            </Link>
            <Link href="/products?tab=wallets" className={`text-lg tracking-widest uppercase border-b border-gray-50 pb-4 ${isProductsPage && currentTab === 'wallets' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`} onClick={() => setMobileMenuOpen(false)}>
              ארנקים
            </Link>
            <Link href="/about" className={`text-lg tracking-widest uppercase border-b border-gray-50 pb-4 ${pathname === '/about' ? 'text-[#c9a962]' : 'text-[#1a1a1a] hover:opacity-70'}`} onClick={() => setMobileMenuOpen(false)}>
              אודות
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
