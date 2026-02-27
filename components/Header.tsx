'use client';

import Link from 'next/link';
import { ShoppingBag, Menu, X } from 'lucide-react';
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
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-500 ease-luxury ${
        scrolled
          ? 'bg-cream/97 backdrop-blur-md shadow-[0_1px_0_0_rgba(44,36,32,0.06)]'
          : 'bg-cream/90 backdrop-blur-sm'
      }`}
      dir={language === 'he' ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      {/* Main nav row */}
      <nav className="w-full px-5 md:px-10 lg:px-16 py-4 md:py-5 grid grid-cols-[1fr_auto_1fr] md:grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-10">

        {/* Right side (RTL) - Logo on desktop, WhatsApp on mobile */}
        <div className="flex items-center order-1">
          <Link href="/" className="hidden md:block group">
            <span className="font-display text-2xl md:text-[1.7rem] font-light text-espresso tracking-wide-plus group-hover:text-terracotta transition-colors duration-500">
              Klumit
            </span>
          </Link>

          <Link
            href="https://wa.me/972549903139"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden flex items-center gap-1.5 text-stone-dark hover:text-espresso transition-colors duration-300"
            aria-label={t('header.talkToUs')}
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 opacity-70">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </Link>
        </div>

        {/* Center - Desktop nav / Mobile logo */}
        <div className="flex items-center justify-center order-2">
          <nav className="hidden md:flex items-center justify-center gap-8 lg:gap-10" aria-label="תפריט ניווט ראשי">
            {[
              { tab: 'bags', label: t('header.bags') },
              { tab: 'belts', label: t('header.belts') },
              { tab: 'wallets', label: t('header.wallets') },
            ].map((item) => (
              <Link
                key={item.tab}
                href={`/products?tab=${item.tab}`}
                className={`relative text-[11px] tracking-editorial uppercase transition-all duration-500 py-1 ${
                  isProductsPage && currentTab === item.tab
                    ? 'text-espresso font-medium'
                    : 'text-stone-dark font-normal hover:text-espresso'
                }`}
              >
                {item.label}
                {isProductsPage && currentTab === item.tab && (
                  <span className="absolute -bottom-0.5 right-0 left-0 h-[1px] bg-espresso animate-line-expand origin-right" />
                )}
              </Link>
            ))}
          </nav>

          <Link href="/" className="md:hidden">
            <span className="font-display text-xl font-light text-espresso tracking-wide-plus">
              Klumit
            </span>
          </Link>
        </div>

        {/* Left side (RTL) - Icons */}
        <div className="flex items-center gap-3 md:gap-5 shrink-0 order-3 justify-self-end">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-sand/60 transition-colors duration-300"
              aria-label="בחר שפה"
            >
              <span className="text-base">{languageFlags[language]}</span>
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 bg-cream border border-sand shadow-lg z-50 min-w-[130px] overflow-hidden">
                  {[
                    { code: 'he' as const, label: 'עברית', flag: languageFlags.he },
                    { code: 'en' as const, label: 'English', flag: languageFlags.en },
                    { code: 'ru' as const, label: 'Русский', flag: languageFlags.ru },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-right px-4 py-2.5 text-xs tracking-wide hover:bg-sand-light transition-colors duration-200 flex items-center gap-2.5 ${
                        language === lang.code ? 'bg-sand-light text-espresso font-medium' : 'text-stone-dark'
                      }`}
                    >
                      <span className="text-sm">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <UserMenu />

          <Link
            href="/cart"
            className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-sand/60 transition-colors duration-300 shrink-0"
            aria-label={mounted && itemCount > 0 ? `${t('header.cart')} (${itemCount})` : t('header.cart')}
          >
            <ShoppingBag size={18} className="text-espresso" strokeWidth={1.5} aria-hidden="true" />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-terracotta text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center font-medium" aria-hidden="true">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            className="md:hidden flex items-center justify-center w-8 h-8 shrink-0 text-espresso hover:text-terracotta transition-colors duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
          >
            {mobileMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {/* Mobile category sub-bar */}
      <div className="md:hidden w-full flex items-center justify-center gap-6 h-10 border-t border-sand bg-cream-warm/80 backdrop-blur-sm">
        {[
          { tab: 'bags', label: t('header.bags') },
          { tab: 'belts', label: t('header.belts') },
          { tab: 'wallets', label: t('header.wallets') },
        ].map((item) => (
          <Link
            key={item.tab}
            href={`/products?tab=${item.tab}`}
            className={`relative flex items-center h-full text-[10px] tracking-editorial uppercase transition-all duration-300 ${
              isProductsPage && currentTab === item.tab
                ? 'text-espresso font-medium'
                : 'text-stone-dark hover:text-espresso'
            }`}
          >
            {item.label}
            {isProductsPage && currentTab === item.tab && (
              <span className="absolute bottom-0 right-0 left-0 h-[1.5px] bg-terracotta" />
            )}
          </Link>
        ))}
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <nav
          id="mobile-menu"
          className="md:hidden border-t border-sand bg-cream absolute w-full left-0 top-full h-[calc(100dvh-100%)] z-50 overflow-y-auto"
        >
          <div className="flex flex-col pt-8 text-center px-8">
            {[
              { tab: 'bags', label: t('header.bags') },
              { tab: 'belts', label: t('header.belts') },
              { tab: 'wallets', label: t('header.wallets') },
            ].map((item) => (
              <Link
                key={item.tab}
                href={`/products?tab=${item.tab}`}
                className={`font-display text-lg tracking-wide border-b border-sand py-5 transition-colors duration-300 ${
                  isProductsPage && currentTab === item.tab
                    ? 'text-espresso'
                    : 'text-stone hover:text-espresso'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
