'use client';

import Link from 'next/link';
import { ShoppingBag, Menu, Globe } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import UserMenu from './UserMenu';
import { useLanguage } from '@/lib/LanguageContext';

export default function Header() {
  const itemCount = useCartStore((state) => state.getItemCount());
  const loadFromShopify = useCartStore((state) => state.loadFromShopify);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  
  const currentTab = searchParams?.get('tab') || 'bags';
  const isProductsPage = pathname === '/products';
  
  const languageFlags = {
    he: '🇮🇱',
    en: '🇬🇧',
    ru: '🇷🇺'
  };

  const handleLanguageChange = async (newLanguage: 'he' | 'en' | 'ru') => {
    setLanguage(newLanguage);
    setLangDropdownOpen(false);

    // Send Telegram notification only for English or Russian
    if (newLanguage === 'en' || newLanguage === 'ru') {
      try {
        await fetch('/api/telegram/notify-language-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: newLanguage,
            pageUrl: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
          }),
        });
      } catch (error) {
        console.warn('Failed to send language change event to Telegram:', error);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    loadFromShopify().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header 
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm w-full border-b border-black/5"
      dir={language === 'he' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      {/* --- שורה עליונה: Grid 3 עמודות - מינימליסטי --- */}
      <nav className="w-full px-6 md:px-12 lg:px-16 py-4 md:py-5 grid grid-cols-[auto_1fr_auto] items-center gap-6 md:gap-12">
        
        {/* ימין בדסקטופ / שמאל במובייל - לוגו בדסקטופ, דברו איתנו במובייל */}
        <div className="flex items-center order-1 md:order-1">
          {/* לוגו בדסקטופ - אלגנטי ומינימליסטי */}
          <Link href="/" className="hidden md:flex items-center luxury-font font-light tracking-[0.15em] text-xl md:text-2xl text-[#1a1a1a] hover:opacity-60 transition-opacity duration-300">
            Klumit
          </Link>
          
          {/* דברו איתנו במובייל */}
          <Link
            href="https://wa.me/972549903139"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden text-[10px] font-light tracking-[0.2em] uppercase text-[#1a1a1a] hover:opacity-60 transition-opacity whitespace-nowrap relative z-10 flex items-center gap-1.5"
            aria-label={t('header.talkToUs')}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            <span>{t('header.talkToUs')}</span>
          </Link>
        </div>
        
        {/* מרכז - תפריט דסקטופ / לוגו במובייל */}
        <div className="flex items-center justify-center order-2">
          {/* תפריט דסקטופ - מינימליסטי, עם יותר אוויר */}
          <nav className="hidden md:flex items-center justify-center gap-10 lg:gap-12" aria-label="תפריט ניווט ראשי" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <Link href="/products?tab=bags" className={`text-xs tracking-[0.25em] uppercase transition-opacity duration-300 whitespace-nowrap ${isProductsPage && currentTab === 'bags' ? 'text-[#1a1a1a] opacity-100' : 'text-[#1a1a1a] opacity-60 hover:opacity-100'}`} style={{ fontWeight: 100 }}>
              {t('header.bags')}
            </Link>
            <span className="w-px h-3 bg-black/10 shrink-0" />
            <Link href="/products?tab=belts" className={`text-xs tracking-[0.25em] uppercase transition-opacity duration-300 whitespace-nowrap ${isProductsPage && currentTab === 'belts' ? 'text-[#1a1a1a] opacity-100' : 'text-[#1a1a1a] opacity-60 hover:opacity-100'}`} style={{ fontWeight: 100 }}>
              {t('header.belts')}
            </Link>
            <span className="w-px h-3 bg-black/10 shrink-0" />
            <Link href="/products?tab=wallets" className={`text-xs tracking-[0.25em] uppercase transition-opacity duration-300 whitespace-nowrap ${isProductsPage && currentTab === 'wallets' ? 'text-[#1a1a1a] opacity-100' : 'text-[#1a1a1a] opacity-60 hover:opacity-100'}`} style={{ fontWeight: 100 }}>
              {t('header.wallets')}
            </Link>
          </nav>
          
          {/* לוגו במובייל */}
          <Link href="/" className="md:hidden flex items-center justify-center luxury-font font-light tracking-[0.15em] text-xl text-[#1a1a1a] hover:opacity-60 transition-opacity duration-300">
            Klumit
          </Link>
        </div>
        
        {/* שמאל בדסקטופ / ימין במובייל - אייקונים */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0 order-3">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center justify-center w-7 h-7 md:w-8 md:h-8 hover:opacity-60 transition-opacity duration-300"
              aria-label="בחר שפה"
            >
              <span className="text-lg">{languageFlags[language]}</span>
            </button>
            
            {langDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 bg-white border border-black/10 shadow-lg z-50 min-w-[120px]">
                  <button
                    onClick={() => handleLanguageChange('he')}
                    className={`w-full text-right px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2 ${language === 'he' ? 'bg-gray-50' : ''}`}
                  >
                    <span className="text-base">{languageFlags.he}</span>
                    <span>עברית</span>
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full text-right px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2 ${language === 'en' ? 'bg-gray-50' : ''}`}
                  >
                    <span className="text-base">{languageFlags.en}</span>
                    <span>English</span>
                  </button>
                  <button
                    onClick={() => handleLanguageChange('ru')}
                    className={`w-full text-right px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2 ${language === 'ru' ? 'bg-gray-50' : ''}`}
                  >
                    <span className="text-base">{languageFlags.ru}</span>
                    <span>Русский</span>
                  </button>
                </div>
              </>
            )}
          </div>
          
          <UserMenu />
          
          <Link 
            href="/cart" 
            className="relative hover:opacity-60 transition-opacity duration-300 flex items-center justify-center w-7 h-7 md:w-8 md:h-8 shrink-0"
            aria-label={mounted && itemCount > 0 ? `${t('header.cart')} (${itemCount})` : t('header.cart')}
          >
            <ShoppingBag size={20} className="text-[#1a1a1a]" aria-hidden="true" />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-[#1a1a1a] text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-light" aria-hidden="true">
                {itemCount}
              </span>
            )}
          </Link>
          
          <button
            className="md:hidden flex items-center justify-center w-7 h-7 shrink-0 hover:opacity-60 transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
        </div>
      </nav>

      {/* --- שורה תחתונה למובייל בלבד (פס קטגוריות) - מינימליסטי --- */}
      <div className="md:hidden w-full flex items-center justify-center gap-6 h-10 border-t border-black/5 bg-white/95 backdrop-blur-sm" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
        <Link 
            href="/products?tab=bags" 
            className={`flex items-center h-full text-[10px] tracking-[0.2em] uppercase transition-opacity duration-300 ${isProductsPage && currentTab === 'bags' ? 'text-[#1a1a1a] opacity-100' : 'text-[#1a1a1a] opacity-60 hover:opacity-100'}`}
            style={{ fontWeight: 100 }}
        >
            {t('header.bags')}
        </Link>
        
        <span className="w-px h-2.5 bg-black/10 block" />
        
        <Link 
            href="/products?tab=belts" 
            className={`flex items-center h-full text-[10px] tracking-[0.2em] uppercase transition-opacity duration-300 ${isProductsPage && currentTab === 'belts' ? 'text-[#1a1a1a] opacity-100' : 'text-[#1a1a1a] opacity-60 hover:opacity-100'}`}
            style={{ fontWeight: 100 }}
        >
            {t('header.belts')}
        </Link>
        
        <span className="w-px h-2.5 bg-black/10 block" />
        
        <Link 
            href="/products?tab=wallets" 
            className={`flex items-center h-full text-[10px] tracking-[0.2em] uppercase transition-opacity duration-300 ${isProductsPage && currentTab === 'wallets' ? 'text-[#1a1a1a] opacity-100' : 'text-[#1a1a1a] opacity-60 hover:opacity-100'}`}
            style={{ fontWeight: 100 }}
        >
            {t('header.wallets')}
        </Link>
      </div>

      {/* --- תפריט המבורגר נפתח - מינימליסטי --- */}
      {mobileMenuOpen && (
        <nav 
            id="mobile-menu" 
            className="md:hidden border-t border-black/5 bg-white/95 backdrop-blur-sm absolute w-full left-0 top-full h-[calc(100dvh-100%)] z-50 overflow-y-auto pb-20"
        >
          <div className="flex flex-col gap-0 pt-6 text-center px-8" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            <Link href="/products?tab=bags" className={`text-sm tracking-[0.25em] uppercase border-b border-black/5 py-4 transition-opacity duration-300 ${isProductsPage && currentTab === 'bags' ? 'text-[#1a1a1a] opacity-100' : 'text-[#1a1a1a] opacity-60 hover:opacity-100'}`} style={{ fontWeight: 100 }} onClick={() => setMobileMenuOpen(false)}>
              {t('header.bags')}
            </Link>
            <Link href="/products?tab=belts" className={`text-sm tracking-[0.25em] uppercase border-b border-black/5 py-4 transition-opacity duration-300 ${isProductsPage && currentTab === 'belts' ? 'text-[#1a1a1a] opacity-100' : 'text-[#1a1a1a] opacity-60 hover:opacity-100'}`} style={{ fontWeight: 100 }} onClick={() => setMobileMenuOpen(false)}>
              {t('header.belts')}
            </Link>
            <Link href="/products?tab=wallets" className={`text-sm tracking-[0.25em] uppercase border-b border-black/5 py-4 transition-opacity duration-300 ${isProductsPage && currentTab === 'wallets' ? 'text-[#1a1a1a] opacity-100' : 'text-[#1a1a1a] opacity-60 hover:opacity-100'}`} style={{ fontWeight: 100 }} onClick={() => setMobileMenuOpen(false)}>
              {t('header.wallets')}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
