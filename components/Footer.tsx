'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Instagram, Facebook, MessageCircle, Mail, Phone, Printer } from 'lucide-react';
import { ViewerCount } from './ViewerCount';
import { useLanguage } from '@/lib/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const homeBiasia = pathname === '/';

  const link = homeBiasia
    ? 'text-sm font-light text-biasia-muted hover:text-biasia-ink transition-colors duration-300'
    : 'text-sm font-light text-cream/60 hover:text-cream transition-colors duration-300';
  const linkSub = homeBiasia
    ? 'text-xs font-light text-biasia-accent/90 hover:text-biasia-ink transition-colors duration-300'
    : 'text-xs font-light text-terracotta-light/70 hover:text-terracotta-light transition-colors duration-300';
  const heading = homeBiasia
    ? 'text-[10px] font-medium tracking-editorial uppercase text-biasia-muted/80 mb-4 md:mb-6'
    : 'text-[10px] font-medium tracking-editorial uppercase text-cream/40 mb-4 md:mb-6';

  return (
    <footer
      className={
        homeBiasia
          ? 'bg-biasia-bg-alt text-biasia-muted mt-10 md:mt-24 border-t border-biasia-line'
          : 'bg-espresso text-cream/80 mt-10 md:mt-24'
      }
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 py-10 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3
              className={`font-display text-2xl md:text-3xl font-light mb-3 md:mb-5 ${
                homeBiasia ? 'text-biasia-ink' : 'text-cream'
              }`}
            >
              {t('footer.brand')}
            </h3>
            <p
              className={`text-xs md:text-sm font-light leading-relaxed mb-4 md:mb-6 ${
                homeBiasia ? 'text-biasia-muted' : 'text-cream/50'
              }`}
            >
              {t('footer.brandDesc')}
            </p>
            <div
              className={`text-[10px] font-medium tracking-editorial uppercase mb-5 ${
                homeBiasia ? 'text-biasia-accent' : 'text-terracotta-light'
              }`}
            >
              Renato Angi Venezia &middot; Carlino Group
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4 mb-5">
              <a
                href="https://www.instagram.com/klumit_bags/"
                target="_blank"
                rel="noopener noreferrer"
                className={
                  homeBiasia
                    ? 'text-biasia-muted/60 hover:text-biasia-ink transition-colors duration-300'
                    : 'text-cream/40 hover:text-cream transition-colors duration-300'
                }
                aria-label="Instagram"
              >
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a
                href="https://www.facebook.com/klomit"
                target="_blank"
                rel="noopener noreferrer"
                className={
                  homeBiasia
                    ? 'text-biasia-muted/60 hover:text-biasia-ink transition-colors duration-300'
                    : 'text-cream/40 hover:text-cream transition-colors duration-300'
                }
                aria-label="Facebook"
              >
                <Facebook size={18} strokeWidth={1.5} />
              </a>
              <a
                href="https://wa.me/message/XORXP7SG55MHJ1"
                target="_blank"
                rel="noopener noreferrer"
                className={
                  homeBiasia
                    ? 'text-biasia-muted/60 hover:text-biasia-ink transition-colors duration-300'
                    : 'text-cream/40 hover:text-cream transition-colors duration-300'
                }
                aria-label="WhatsApp"
              >
                <MessageCircle size={18} strokeWidth={1.5} />
              </a>
            </div>
            <div className="flex justify-center md:justify-start">
              <ViewerCount />
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className={heading}>
              {t('footer.navigation')}
            </h4>
            <ul className="space-y-2.5 md:space-y-3">
              <li>
                <Link href="/" className={link}>
                  {t('footer.home')}
                </Link>
              </li>
              <li>
                <span className={homeBiasia ? 'text-sm font-light text-biasia-muted' : 'text-sm font-light text-cream/60'}>
                  {t('footer.products')}
                </span>
                <ul className="mt-2 space-y-1.5">
                  <li>
                    <Link href="/products?tab=all" className={linkSub}>
                      {t('header.shopAll')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?tab=bags" className={linkSub}>
                      {t('header.bags')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?tab=belts" className={linkSub}>
                      {t('header.belts')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/products?tab=wallets" className={linkSub}>
                      {t('header.wallets')}
                    </Link>
                  </li>
                </ul>
              </li>
              <li>
                <Link href="/cart" className={link}>
                  {t('footer.cart')}
                </Link>
              </li>
              <li>
                <Link href="/account" className={link}>
                  {t('footer.myAccount')}
                </Link>
              </li>
              <li>
                <Link href="/about" className={link}>
                  {t('footer.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className={heading}>
              {t('footer.customerService')}
            </h4>
            <ul className="space-y-2.5 md:space-y-3">
              <li>
                <Link href="/shipping" className={link}>
                  {t('footer.shipping')}
                </Link>
              </li>
              <li>
                <Link href="/returns" className={link}>
                  {t('footer.returns')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className={link}>
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className={link}>
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className={link}>
                  {t('footer.accessibility')}
                </Link>
              </li>
              <li>
                <Link href="/blog" className={link}>
                  {t('footer.magazine')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 md:col-span-1">
            <h4 className={heading}>
              {t('footer.contact')}
            </h4>

            {/* Mobile: Single line */}
            <div
              className={`md:hidden flex items-center justify-center gap-2 text-[10px] font-light overflow-x-auto pb-2 ${
                homeBiasia ? 'text-biasia-muted' : 'text-cream/50'
              }`}
            >
              <a
                href="mailto:klumitltd@gmail.com"
                className={`flex items-center gap-1 whitespace-nowrap ${
                  homeBiasia ? 'hover:text-biasia-ink' : 'hover:text-cream'
                } transition-colors duration-300`}
              >
                <Mail size={12} className="shrink-0" />
                <span className="hidden sm:inline">klumitltd@gmail.com</span>
                <span className="sm:hidden">Email</span>
              </a>
              <span className={homeBiasia ? 'text-biasia-line' : 'text-cream/20'}>|</span>
              <a
                href="tel:+97235178502"
                className={`flex items-center gap-1 whitespace-nowrap ${
                  homeBiasia ? 'hover:text-biasia-ink' : 'hover:text-cream'
                } transition-colors duration-300`}
              >
                <Phone size={12} className="shrink-0" />
                <span>03-5178502</span>
              </a>
              <span className={homeBiasia ? 'text-biasia-line' : 'text-cream/20'}>|</span>
              <a
                href="tel:+972542600177"
                className={`flex items-center gap-1 whitespace-nowrap ${
                  homeBiasia ? 'hover:text-biasia-ink' : 'hover:text-cream'
                } transition-colors duration-300`}
              >
                <Phone size={12} className="shrink-0" />
                <span>054-2600177</span>
              </a>
              <span className={homeBiasia ? 'text-biasia-line' : 'text-cream/20'}>|</span>
              <span
                className={`flex items-center gap-1 whitespace-nowrap ${
                  homeBiasia ? 'text-biasia-muted/70' : 'text-cream/30'
                }`}
              >
                <Printer size={12} className="shrink-0" />
                <span>03-5106781</span>
              </span>
            </div>

            {/* Desktop: List view */}
            <ul
              className={`hidden md:block space-y-3 text-sm font-light ${
                homeBiasia ? 'text-biasia-muted' : 'text-cream/60'
              }`}
            >
              <li>
                <a
                  href="mailto:klumitltd@gmail.com"
                  className={`inline-flex items-center gap-2 ${
                    homeBiasia ? 'hover:text-biasia-ink' : 'hover:text-cream'
                  } transition-colors duration-300`}
                >
                  <Mail size={14} strokeWidth={1.5} />
                  klumitltd@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+97235178502"
                  className={`inline-flex items-center gap-2 ${
                    homeBiasia ? 'hover:text-biasia-ink' : 'hover:text-cream'
                  } transition-colors duration-300`}
                >
                  <Phone size={14} strokeWidth={1.5} />
                  03-5178502
                </a>
              </li>
              <li>
                <a
                  href="tel:+972542600177"
                  className={`inline-flex items-center gap-2 ${
                    homeBiasia ? 'hover:text-biasia-ink' : 'hover:text-cream'
                  } transition-colors duration-300`}
                >
                  <Phone size={14} strokeWidth={1.5} />
                  054-2600177
                </a>
              </li>
              <li
                className={`inline-flex items-center gap-2 ${
                  homeBiasia ? 'text-biasia-muted/80' : 'text-cream/30'
                }`}
              >
                <Printer size={14} strokeWidth={1.5} />
                {t('footer.fax')} 03-5106781
              </li>
            </ul>
            <div
              className={`mt-5 md:mt-6 pt-5 md:pt-6 border-t ${
                homeBiasia ? 'border-biasia-line' : 'border-cream/10'
              }`}
            >
              <p
                className={`text-xs font-light leading-relaxed mb-2 ${
                  homeBiasia ? 'text-biasia-muted' : 'text-cream/40'
                }`}
              >
                <span className={`font-medium ${homeBiasia ? 'text-biasia-ink/80' : 'text-cream/60'}`}>
                  {t('footer.address')}
                </span>
                <br />
                {t('footer.addressDetails')}
              </p>
              <p
                className={`text-xs font-light leading-relaxed hidden md:block ${
                  homeBiasia ? 'text-biasia-muted' : 'text-cream/40'
                }`}
              >
                {t('footer.hours')}
                <br />
                {t('footer.hoursDetails')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={`border-t mt-8 md:mt-14 pt-6 md:pt-8 ${
            homeBiasia ? 'border-biasia-line' : 'border-cream/10'
          }`}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <p
              className={`text-[11px] font-light text-center md:text-right ${
                homeBiasia ? 'text-biasia-muted/80' : 'text-cream/30'
              }`}
            >
              &copy; {new Date().getFullYear()} {t('footer.copyright')}{' '}
              <span className={`font-display ${homeBiasia ? 'text-biasia-ink/90' : 'text-cream/50'}`}>
                {t('footer.brand')}
              </span>
            </p>
            <div
              className={`flex gap-5 md:gap-6 text-[11px] font-light ${
                homeBiasia ? 'text-biasia-muted/90' : 'text-cream/30'
              }`}
            >
              <Link
                href="/terms"
                className={homeBiasia ? 'hover:text-biasia-ink transition-colors duration-300' : 'hover:text-cream/60 transition-colors duration-300'}
              >
                {t('footer.terms')}
              </Link>
              <Link
                href="/privacy"
                className={homeBiasia ? 'hover:text-biasia-ink transition-colors duration-300' : 'hover:text-cream/60 transition-colors duration-300'}
              >
                {t('footer.privacy')}
              </Link>
              <Link
                href="/accessibility"
                className={homeBiasia ? 'hover:text-biasia-ink transition-colors duration-300' : 'hover:text-cream/60 transition-colors duration-300'}
              >
                {t('footer.accessibility')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
