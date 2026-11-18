'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronDown, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import FloatingCart from './FloatingCart';
import { useLanguage } from '@/lib/LanguageContext';
import { useHasSale } from '@/lib/SaleContext';

/** Brands with a landing page link to it (see lib/brand-pages); the rest open the filtered catalog */
const BRANDS = [
  { name: 'Valentino', logo: '/brands/valentino.svg', vendor: 'valentino', href: '/brands/mario-valentino' },
  { name: 'Renato Angi', logo: '/brands/renato-angi.svg', vendor: 'renato', href: '/brands/renato-angi' },
  { name: 'Biasia', logo: '/brands/biasia.jpg', vendor: 'biasia', href: '/products?tab=all&vendor=biasia' },
  // Lowercase script reads smaller at equal height — scale it up to match visual weight
  { name: 'ByByblos', logo: '/brands/bybyblos.png', vendor: 'byblos', href: '/products?tab=all&vendor=byblos', logoClass: 'h-10 w-auto max-w-[200px] object-contain scale-110' },
];

/** Rotating announcement slides: promo ↔ brand, switching every 5s */
const ANNOUNCEMENT_SLIDES: Array<
  | { type: 'promo' }
  | { type: 'brand'; name: string; href: string }
> = [
  { type: 'promo' },
  { type: 'brand', name: 'Valentino', href: '/brands/mario-valentino' },
  { type: 'promo' },
  { type: 'brand', name: 'Renato Angi', href: '/brands/renato-angi' },
  { type: 'promo' },
  { type: 'brand', name: 'Biasia', href: '/products?tab=all&vendor=biasia' },
  { type: 'promo' },
  { type: 'brand', name: 'ByByblos', href: '/products?tab=all&vendor=byblos' },
];

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'bags' | 'brands' | null>(null);
  const [drawerSection, setDrawerSection] = useState<'bags' | 'brands' | null>('bags');
  const [slideIndex, setSlideIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const hasSale = useHasSale();

  const isHe = language === 'he';
  const isBlogSection = pathname === '/blog' || pathname?.startsWith('/blog/');

  // Hebrew has no capitals, so it gets a readable size instead of small tracked caps
  const navText = isHe ? 'text-[15px]' : 'text-xs uppercase tracking-[0.14em]';
  const navLink = `${navText} whitespace-nowrap py-1 text-stone-dark transition-colors duration-300 hover:text-espresso`;
  const drawerText = isHe ? 'text-base' : 'text-[13px] uppercase tracking-[0.14em]';
  const drawerRow = `${drawerText} flex w-full items-center justify-between border-b border-sand py-4 text-espresso transition-opacity hover:opacity-70`;
  const iconButton =
    'flex h-9 w-9 shrink-0 items-center justify-center text-espresso transition-opacity duration-300 hover:opacity-60';
  const menuPanel =
    'absolute top-full z-50 mt-3 border border-sand bg-white shadow-[0_16px_40px_rgba(43,33,27,0.10)]';

  const languageFlags = {
    he: '🇮🇱',
    en: '🇬🇧',
    ru: '🇷🇺',
  };

  const bagsItems = [
    { href: '/bags', label: t('header.bags') },
    { href: '/wallets', label: t('header.wallets') },
    { href: '/belts', label: t('header.belts') },
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

  return (
    // No backdrop-filter/transform here: it would trap the fixed drawer and floating cart inside the header
    <header
      className="sticky top-0 z-50 w-full border-b border-sand bg-cream pt-[env(safe-area-inset-top,0px)]"
      dir={isHe ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      {/* Announcement bar — rotates every 5s between the club offer and brands */}
      <div className="focus-light flex min-h-[34px] items-center justify-center bg-espresso px-4 py-2 text-center text-cream">
        {(() => {
          const slide = ANNOUNCEMENT_SLIDES[slideIndex];
          if (slide.type === 'promo') {
            return (
              <Link
                key={`promo-${slideIndex}`}
                href="#k-club"
                className={`animate-reveal-fade transition-opacity hover:opacity-80 ${
                  isHe ? 'text-[13px]' : 'text-[11px] uppercase tracking-[0.16em]'
                }`}
              >
                {t('footer.kClubTagline')}
              </Link>
            );
          }
          return (
            <Link
              key={`brand-${slideIndex}`}
              href={slide.href}
              className="animate-reveal-fade text-[11px] uppercase tracking-[0.22em] transition-opacity hover:opacity-80"
            >
              {slide.name}
            </Link>
          );
        })()}
      </div>

      {/* Main nav row — menu + nav | wordmark | links + search */}
      <nav className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 md:gap-6 md:px-8 md:py-5 lg:px-12">
        {/* Start — menu (always) + desktop nav */}
        <div className="order-1 flex items-center gap-3 md:gap-6">
          <button
            className={iconButton}
            onClick={() => setDrawerOpen(true)}
            aria-label={t('header.menu')}
            aria-expanded={drawerOpen}
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>

          {/* Inline links need the room of a laptop-width screen; below that the drawer carries them */}
          <div className="hidden items-center gap-7 lg:flex" aria-label="תפריט ניווט ראשי">
            <Link href="/products?tab=ss26" className={navLink}>
              {t('header.new')}
            </Link>

            {/* Brands dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'brands' ? null : 'brands')}
                className={`flex items-center gap-1 ${navLink} ${openDropdown === 'brands' ? '!text-espresso' : ''}`}
                aria-expanded={openDropdown === 'brands'}
              >
                {t('header.brands')}
                <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform duration-200 ${openDropdown === 'brands' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'brands' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className={`${menuPanel} start-0 min-w-[240px] py-3`}>
                    {BRANDS.map((brand) => (
                      <Link
                        key={brand.vendor}
                        href={brand.href}
                        onClick={() => setOpenDropdown(null)}
                        className="flex items-center justify-center px-6 py-3 transition-colors duration-200 hover:bg-cream-deep"
                      >
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          width={160}
                          height={40}
                          className={brand.logoClass ?? 'h-7 w-auto max-w-[140px] object-contain'}
                        />
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
                className={`flex items-center gap-1 ${navLink} ${openDropdown === 'bags' ? '!text-espresso' : ''}`}
                aria-expanded={openDropdown === 'bags'}
              >
                {t('header.allBags')}
                <ChevronDown size={14} strokeWidth={1.5} className={`transition-transform duration-200 ${openDropdown === 'bags' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'bags' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                  <div className={`${menuPanel} start-0 min-w-[200px] py-2`}>
                    <Link
                      href="/products?tab=all"
                      onClick={() => setOpenDropdown(null)}
                      className={`block px-6 py-2.5 font-medium text-espresso transition-colors duration-200 hover:bg-cream-deep ${navText}`}
                    >
                      {t('header.allBags')}
                    </Link>
                    {bagsItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className={`block px-6 py-2.5 text-stone-dark transition-colors duration-200 hover:bg-cream-deep hover:text-espresso ${navText}`}
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

        {/* Center — wordmark in a thin dark frame (the right padding is shorter by the trailing letter-spacing, so the letters sit centred) */}
        <div className="order-2 flex items-center justify-center">
          <Link href="/" aria-label="KLUMIT" className="transition-opacity duration-300 hover:opacity-80">
            <span
              dir="ltr"
              className="block border border-espresso py-2 pl-3.5 pr-[calc(0.875rem-0.24em)] font-display text-[1.15rem] font-normal uppercase leading-none tracking-[0.24em] text-espresso md:py-2.5 md:pl-5 md:pr-[calc(1.25rem-0.28em)] md:text-[1.5rem] md:tracking-[0.28em]"
            >
              KLUMIT
            </span>
          </Link>
        </div>

        {/* End — Magazine and search always, Sale while something is discounted; language switcher from md */}
        <div className="order-3 flex shrink-0 items-center gap-2.5 justify-self-end md:gap-4">
          <Link
            href="/blog"
            className={`${navLink} ${isBlogSection ? '!text-espresso font-medium' : ''}`}
          >
            {t('header.magazine')}
          </Link>

          {hasSale && (
            <Link
              href="/products?tab=sale"
              className={`${navText} whitespace-nowrap py-1 font-medium text-sale transition-opacity duration-300 hover:opacity-70`}
            >
              {t('header.sale')}
            </Link>
          )}

          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={iconButton}
            aria-label={t('header.search')}
            aria-expanded={searchOpen}
          >
            <Search size={20} strokeWidth={1.5} />
          </button>

          {/* Language — desktop only (the drawer carries it on mobile) */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex h-7 items-center justify-center px-1 text-xs uppercase tracking-[0.1em] text-stone transition-colors duration-300 hover:text-espresso"
              aria-label="בחר שפה"
              aria-expanded={langDropdownOpen}
            >
              {language}
            </button>

            {langDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setLangDropdownOpen(false)}
                />
                <div className={`${menuPanel} end-0 !mt-2 min-w-[140px] overflow-hidden`}>
                  {[
                    { code: 'en' as const, label: 'English', flag: languageFlags.en },
                    { code: 'he' as const, label: 'עברית', flag: languageFlags.he },
                    { code: 'ru' as const, label: 'Русский', flag: languageFlags.ru },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm transition-colors duration-200 hover:bg-cream-deep ${
                        language === lang.code ? 'font-medium text-espresso' : 'text-stone-dark'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Search bar — opens under the nav row */}
      {searchOpen && (
        <div className="border-t border-sand bg-cream">
          <form
            onSubmit={submitSearch}
            className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 md:px-8"
            role="search"
          >
            <Search size={18} strokeWidth={1.5} className="shrink-0 text-stone" aria-hidden />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('header.searchPlaceholder')}
              className="flex-1 border-none bg-transparent text-base text-espresso outline-none placeholder:text-stone focus:!outline-none"
              aria-label={t('header.search')}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className={iconButton}
              aria-label="סגור חיפוש"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </form>
        </div>
      )}

      {/* Floating cart — appears bottom corner when cart has items */}
      <FloatingCart />

      {/* Side drawer — desktop + mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('header.menu')}>
          <div
            className="absolute inset-0 bg-espresso/50"
            onClick={closeDrawer}
            aria-hidden
          />
          <aside className="absolute start-0 top-0 flex h-full w-[340px] max-w-[88vw] flex-col overflow-y-auto bg-cream shadow-xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-sand px-6 py-5">
              <span
                dir="ltr"
                className="border border-espresso py-2 pl-3.5 pr-[calc(0.875rem-0.24em)] font-display text-[1.05rem] font-normal uppercase leading-none tracking-[0.24em] text-espresso"
              >
                KLUMIT
              </span>
              <button
                onClick={closeDrawer}
                className={iconButton}
                aria-label="סגור תפריט"
              >
                <X size={22} strokeWidth={1.5} />
              </button>
            </div>

            <nav className="flex-1 px-6 py-2">
              {/* New */}
              <Link href="/products?tab=ss26" onClick={closeDrawer} className={drawerRow}>
                {t('header.new')}
              </Link>

              {/* All Bags accordion */}
              <div className="border-b border-sand">
                <button
                  onClick={() => setDrawerSection(drawerSection === 'bags' ? null : 'bags')}
                  className={`${drawerRow} !border-b-0`}
                  aria-expanded={drawerSection === 'bags'}
                >
                  {t('header.allBags')}
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    className={`transition-transform duration-200 ${drawerSection === 'bags' ? 'rotate-180' : ''}`}
                  />
                </button>
                {drawerSection === 'bags' && (
                  <div className="space-y-1 pb-4 ps-4">
                    <Link
                      href="/products?tab=all"
                      onClick={closeDrawer}
                      className="block py-2 text-[15px] font-medium text-espresso transition-opacity hover:opacity-70"
                    >
                      {t('header.allBags')}
                    </Link>
                    {bagsItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeDrawer}
                        className="block py-2 text-[15px] text-stone-dark transition-colors hover:text-espresso"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Brands accordion */}
              <div className="border-b border-sand">
                <button
                  onClick={() => setDrawerSection(drawerSection === 'brands' ? null : 'brands')}
                  className={`${drawerRow} !border-b-0`}
                  aria-expanded={drawerSection === 'brands'}
                >
                  {t('header.brands')}
                  <ChevronDown
                    size={16}
                    strokeWidth={1.5}
                    className={`transition-transform duration-200 ${drawerSection === 'brands' ? 'rotate-180' : ''}`}
                  />
                </button>
                {drawerSection === 'brands' && (
                  <div className="space-y-1 pb-4">
                    {BRANDS.map((brand) => (
                      <Link
                        key={brand.vendor}
                        href={brand.href}
                        onClick={closeDrawer}
                        className="flex items-center py-2.5 ps-4 transition-opacity hover:opacity-70"
                      >
                        <Image
                          src={brand.logo}
                          alt={brand.name}
                          width={150}
                          height={36}
                          className={`mix-blend-multiply ${brand.logoClass ?? 'h-6 w-auto max-w-[130px] object-contain'}`}
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Sale */}
              {hasSale && (
                <Link
                  href="/products?tab=sale"
                  onClick={closeDrawer}
                  className={`${drawerRow} !text-sale font-medium`}
                >
                  {t('header.sale')}
                </Link>
              )}

              {/* Magazine */}
              <Link href="/blog" onClick={closeDrawer} className={drawerRow}>
                {t('header.magazine')}
              </Link>

              {/* Account */}
              <Link href="/account" onClick={closeDrawer} className={drawerRow}>
                {t('footer.myAccount')}
              </Link>

              {/* Language — compact row (the header switcher is hidden on mobile) */}
              <div className="flex items-center gap-1 border-b border-sand py-4">
                {[
                  { code: 'he' as const, label: 'עברית' },
                  { code: 'en' as const, label: 'English' },
                  { code: 'ru' as const, label: 'Русский' },
                ].map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`px-3 py-1.5 text-sm transition-colors ${
                      language === lang.code
                        ? 'bg-espresso text-cream'
                        : 'text-stone-dark hover:text-espresso'
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
                className={`${drawerRow} !justify-start gap-2.5 !border-b-0`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0" aria-hidden>
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
