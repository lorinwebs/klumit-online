'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import FloatingCart from './FloatingCart';
import { useLanguage } from '@/lib/LanguageContext';

const BRANDS = [
  { name: 'Valentino', logo: '/brands/valentino.svg', vendor: 'valentino' },
  { name: 'Renato Angi', logo: '/brands/renato-angi.png', vendor: 'renato' },
  { name: 'Biasia', logo: '/brands/biasia.jpg', vendor: 'biasia' },
  { name: 'ByByblos', logo: '/brands/bybyblos.png', vendor: 'byblos' },
];

/** Rotating announcement slides: promo ↔ brand, switching every 5s */
const ANNOUNCEMENT_SLIDES: Array<
  | { type: 'promo' }
  | { type: 'brand'; name: string; href: string }
> = [
  { type: 'promo' },
  { type: 'brand', name: 'Valentino', href: '/products?tab=all&vendor=valentino' },
  { type: 'promo' },
  { type: 'brand', name: 'Renato Angi', href: '/products?tab=all&vendor=renato' },
  { type: 'promo' },
  { type: 'brand', name: 'Biasia', href: '/products?tab=all&vendor=biasia' },
  { type: 'promo' },
  { type: 'brand', name: 'ByByblos', href: '/products?tab=all&vendor=byblos' },
];

/** TaliaSol-style blinking dot (red for NEW, purple for SALE) */
function PulseDot({ color }: { color: 'red' | 'purple' }) {
  const bg = color === 'red' ? 'bg-[#e11d2e]' : 'bg-[#8b5cf6]';
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${bg}`} />
      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${bg}`} />
    </span>
  );
}

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'bags' | 'brands' | null>(null);
  const [drawerSection, setDrawerSection] = useState<'bags' | 'brands' | null>('bags');
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const isBlogSection = pathname === '/blog' || pathname?.startsWith('/blog/');
  const isHome = pathname === '/';

  // TaliaSol-style: transparent over the hero until hover / scroll / any menu opens
  const transparent =
    isHome && !scrolled && !hovered && !drawerOpen && openDropdown === null && !langDropdownOpen && !searchOpen;

  const languageFlags = {
    he: '🇮🇱',
    en: '🇬🇧',
    ru: '🇷🇺',
  };

  const bagsItems = [
    { href: '/products?tab=bags', label: t('header.bags') },
    { href: '/products?tab=wallets', label: t('header.wallets') },
    { href: '/products?tab=belts', label: t('header.belts') },
  ];

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
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery('');
    router.push(`/products?tab=all&q=${encodeURIComponent(q)}`);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Rotate announcement bar every 5 seconds
  useEffect(() => {
    const id = setInterval(
      () => setSlideIndex((i) => (i + 1) % ANNOUNCEMENT_SLIDES.length),
      5000
    );
    return () => clearInterval(id);
  }, []);

  // Close drawer on route change + lock body scroll while open
  useEffect(() => {
    setDrawerOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setOpenDropdown(null);
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  // Shared color helpers that flip with transparency
  const inkText = transparent ? 'text-white' : 'text-black';
  const inkLink = transparent ? 'text-white/80 hover:text-white' : 'text-black/60 hover:text-black';

  return (
    <header
      className={`${isHome ? 'fixed' : 'sticky'} top-0 z-50 w-full pt-[env(safe-area-inset-top,0px)] transition-colors duration-300 ${
        transparent ? 'bg-transparent border-b border-transparent' : 'bg-cream border-b border-black/10'
      }`}
      dir={language === 'he' ? 'rtl' : 'ltr'}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      suppressHydrationWarning
    >
      {/* Announcement bar — rotates every 5s between promo and brands */}
      <div className="bg-black text-center px-4 py-2 min-h-[32px] flex items-center justify-center">
        {(() => {
          const slide = ANNOUNCEMENT_SLIDES[slideIndex];
          if (slide.type === 'promo') {
            return (
              <Link
                key={`promo-${slideIndex}`}
                href="/products?tab=ss26"
                className="flex items-center justify-center gap-3 animate-reveal-fade hover:opacity-80 transition-opacity"
              >
                <span className="text-[#e11d2e] text-[10px] md:text-[11px] tracking-[0.18em] uppercase font-medium">
                  Shop Now
                </span>
                <span className="text-white text-[10px] md:text-[11px] tracking-[0.18em] uppercase font-light">
                  New Arrival
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={`brand-${slideIndex}`}
              href={slide.href}
              className="animate-reveal-fade text-white text-[10px] md:text-[11px] tracking-[0.24em] uppercase font-light hover:opacity-80 transition-opacity"
            >
              {slide.name}
            </Link>
          );
        })()}
      </div>

      {/* Main nav row — hamburger + nav | logo | icons (TaliaSol layout) */}
      <nav className="w-full px-4 md:px-8 lg:px-12 py-4 md:py-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:gap-6">
        {/* Start — hamburger (always) + desktop nav */}
        <div className="flex items-center gap-3 md:gap-6 order-1">
          <button
            className={`flex items-center justify-center w-8 h-8 shrink-0 hover:opacity-70 transition-all duration-300 ${inkText}`}
            onClick={() => setDrawerOpen(true)}
            aria-label={t('header.menu')}
            aria-expanded={drawerOpen}
          >
            <Menu size={20} strokeWidth={1.5} />
          </button>

          <div className="hidden md:flex items-center gap-5 lg:gap-7" aria-label="תפריט ניווט ראשי">
            <Link
              href="/products?tab=ss26"
              className={`flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase transition-colors duration-300 py-1 ${inkLink}`}
            >
              <PulseDot color="red" />
              {t('header.new')}
            </Link>

            {/* Brands dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'brands' ? null : 'brands')}
                className={`flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase transition-colors duration-300 py-1 ${
                  openDropdown === 'brands' ? 'text-black' : inkLink
                }`}
                aria-expanded={openDropdown === 'brands'}
              >
                {t('header.brands')}
                <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform duration-200 ${openDropdown === 'brands' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'brands' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute top-full start-0 mt-3 bg-white border border-black/10 shadow-sm z-50 min-w-[240px] py-3">
                    {BRANDS.map((brand) => (
                      <Link
                        key={brand.vendor}
                        href={`/products?tab=all&vendor=${brand.vendor}`}
                        onClick={() => setOpenDropdown(null)}
                        className="flex items-center justify-center px-6 py-3 hover:bg-black/[0.04] transition-colors duration-200"
                      >
                        <Image src={brand.logo} alt={brand.name} width={160} height={40} className="h-7 w-auto max-w-[140px] object-contain" />
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* All Bags dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'bags' ? null : 'bags')}
                className={`flex items-center gap-1 text-[11px] tracking-[0.18em] uppercase transition-colors duration-300 py-1 ${
                  openDropdown === 'bags' ? 'text-black' : inkLink
                }`}
                aria-expanded={openDropdown === 'bags'}
              >
                {t('header.allBags')}
                <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform duration-200 ${openDropdown === 'bags' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'bags' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className="absolute top-full start-0 mt-3 bg-white border border-black/10 shadow-sm z-50 min-w-[200px] py-2">
                    <Link
                      href="/products?tab=all"
                      onClick={() => setOpenDropdown(null)}
                      className="block px-6 py-2.5 text-[11px] tracking-[0.16em] uppercase text-black font-medium hover:bg-black/[0.04] transition-colors duration-200"
                    >
                      {t('header.allBags')}
                    </Link>
                    {bagsItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className="block px-6 py-2.5 text-[12px] text-black/60 hover:text-black hover:bg-black/[0.04] transition-colors duration-200"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center — logo */}
        <div className="flex items-center justify-center order-2">
          <Link href="/">
            <span className={`font-display text-xl md:text-[1.75rem] font-normal tracking-[0.28em] uppercase hover:opacity-70 transition-all duration-300 ${inkText}`}>
              KLUMIT
            </span>
          </Link>
        </div>

        {/* End — desktop: Magazine / Sale / search / tiny language. Mobile: search only */}
        <div className="flex items-center gap-2.5 md:gap-4 shrink-0 order-3 justify-self-end">
          {/* Magazine link — desktop only */}
          <Link
            href="/blog"
            className={`hidden md:block text-[11px] tracking-[0.18em] uppercase transition-colors duration-300 py-1 ${
              isBlogSection ? 'text-black font-medium' : inkLink
            }`}
          >
            {t('header.magazine')}
          </Link>

          {/* Sale — desktop only, purple blinking dot */}
          <Link
            href="/products?tab=sale"
            className={`hidden md:flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase transition-colors duration-300 py-1 ${inkLink}`}
          >
            <PulseDot color="purple" />
            {t('header.sale')}
          </Link>

          {/* Search — mobile + desktop */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={`flex items-center justify-center w-8 h-8 hover:opacity-70 transition-all duration-300 ${inkText}`}
            aria-label={t('header.search')}
            aria-expanded={searchOpen}
          >
            <Search size={18} strokeWidth={1.5} />
          </button>

          {/* Language — desktop only, small + subtle */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={`flex items-center justify-center h-6 px-1 text-[9px] tracking-[0.14em] uppercase transition-colors duration-300 ${
                transparent ? 'text-white/50 hover:text-white' : 'text-black/35 hover:text-black'
              }`}
              aria-label="בחר שפה"
            >
              {language}
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className="absolute top-full end-0 mt-2 bg-white border border-black/10 shadow-sm z-50 min-w-[130px] overflow-hidden">
                  {[
                    { code: 'en' as const, label: 'English', flag: languageFlags.en },
                    { code: 'he' as const, label: 'עברית', flag: languageFlags.he },
                    { code: 'ru' as const, label: 'Русский', flag: languageFlags.ru },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-start px-4 py-2.5 text-xs tracking-wide hover:bg-black/[0.04] transition-colors duration-200 flex items-center gap-2.5 ${
                        language === lang.code ? 'text-black font-medium' : 'text-black/60'
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
        </div>
      </nav>

      {/* Search bar — slides open under the nav row */}
      {searchOpen && (
        <div className={`border-t ${transparent ? 'border-white/20' : 'border-black/10 bg-cream'}`}>
          <form
            onSubmit={submitSearch}
            className="max-w-2xl mx-auto flex items-center gap-3 px-4 md:px-8 py-3"
            role="search"
          >
            <Search size={16} strokeWidth={1.5} className={`shrink-0 ${inkText}`} aria-hidden />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('header.searchPlaceholder')}
              className={`flex-1 bg-transparent text-sm tracking-wide outline-none border-none focus:!outline-none ${
                transparent ? 'text-white placeholder:text-white/50' : 'text-black placeholder:text-black/40'
              }`}
              aria-label={t('header.search')}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className={`flex items-center justify-center w-8 h-8 hover:opacity-70 transition-opacity ${inkText}`}
              aria-label="סגור חיפוש"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          </form>
        </div>
      )}

      {/* Floating cart — appears bottom corner when cart has items */}
      <FloatingCart />

      {/* Side drawer — desktop + mobile (TaliaSol style) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDrawer}
            aria-hidden
          />
          <aside className="absolute top-0 start-0 h-full w-[320px] max-w-[85vw] bg-white shadow-xl flex flex-col overflow-y-auto">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/10">
              <span className="font-display text-lg font-normal text-black tracking-[0.28em] uppercase">
                KLUMIT
              </span>
              <button
                onClick={closeDrawer}
                className="flex items-center justify-center w-8 h-8 text-black hover:opacity-70 transition-opacity duration-300"
                aria-label="סגור תפריט"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 px-6 py-4">
              {/* New */}
              <Link
                href="/products?tab=ss26"
                onClick={closeDrawer}
                className="block py-4 text-[12px] tracking-[0.18em] uppercase text-black border-b border-black/10 hover:opacity-70 transition-opacity"
              >
                {t('header.new')}
              </Link>

              {/* All Bags accordion */}
              <div className="border-b border-black/10">
                <button
                  onClick={() => setDrawerSection(drawerSection === 'bags' ? null : 'bags')}
                  className="w-full flex items-center justify-between py-4 text-[12px] tracking-[0.18em] uppercase text-black"
                  aria-expanded={drawerSection === 'bags'}
                >
                  {t('header.allBags')}
                  <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    className={`transition-transform duration-200 ${drawerSection === 'bags' ? 'rotate-180' : ''}`}
                  />
                </button>
                {drawerSection === 'bags' && (
                  <div className="pb-4 ps-4 space-y-1">
                    <Link
                      href="/products?tab=all"
                      onClick={closeDrawer}
                      className="block py-2 text-[13px] text-black font-medium hover:opacity-70 transition-opacity"
                    >
                      {t('header.allBags')}
                    </Link>
                    {bagsItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeDrawer}
                        className="block py-2 text-[13px] text-black/60 hover:text-black transition-colors"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Brands accordion */}
              <div className="border-b border-black/10">
                <button
                  onClick={() => setDrawerSection(drawerSection === 'brands' ? null : 'brands')}
                  className="w-full flex items-center justify-between py-4 text-[12px] tracking-[0.18em] uppercase text-black"
                  aria-expanded={drawerSection === 'brands'}
                >
                  {t('header.brands')}
                  <ChevronDown
                    size={14}
                    strokeWidth={1.5}
                    className={`transition-transform duration-200 ${drawerSection === 'brands' ? 'rotate-180' : ''}`}
                  />
                </button>
                {drawerSection === 'brands' && (
                  <div className="pb-4 space-y-1">
                    {BRANDS.map((brand) => (
                      <Link
                        key={brand.vendor}
                        href={`/products?tab=all&vendor=${brand.vendor}`}
                        onClick={closeDrawer}
                        className="flex items-center ps-4 py-2.5 hover:opacity-70 transition-opacity"
                      >
                        <Image src={brand.logo} alt={brand.name} width={150} height={36} className="h-6 w-auto max-w-[130px] object-contain" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Magazine */}
              <Link
                href="/blog"
                onClick={closeDrawer}
                className="block py-4 text-[12px] tracking-[0.18em] uppercase text-black border-b border-black/10 hover:opacity-70 transition-opacity"
              >
                {t('header.magazine')}
              </Link>

              {/* Account */}
              <Link
                href="/account"
                onClick={closeDrawer}
                className="block py-4 text-[12px] tracking-[0.18em] uppercase text-black border-b border-black/10 hover:opacity-70 transition-opacity"
              >
                {t('footer.myAccount')}
              </Link>

              {/* Language — compact row (main switcher is hidden on mobile) */}
              <div className="flex items-center gap-1 py-4 border-b border-black/10">
                {[
                  { code: 'he' as const, label: 'עברית' },
                  { code: 'en' as const, label: 'English' },
                  { code: 'ru' as const, label: 'Русский' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`px-3 py-1.5 text-[11px] tracking-wide transition-colors ${
                      language === lang.code
                        ? 'bg-black text-white'
                        : 'text-black/50 hover:text-black'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              {/* WhatsApp */}
              <a
                href="https://wa.me/972549903139"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-4 text-[12px] tracking-[0.18em] uppercase text-black hover:opacity-70 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                {t('header.talkToUs')}
              </a>
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}
