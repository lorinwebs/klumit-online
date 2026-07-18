'use client';

import { useState, FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Instagram,
  Facebook,
  Globe,
  Wallet,
  Mail,
  Accessibility,
} from 'lucide-react';
import { ViewerCount } from './ViewerCount';
import PaymentIcons from './PaymentIcons';
import { useLanguage } from '@/lib/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const link = 'text-sm font-light text-black/55 hover:text-black transition-colors duration-300';
  const sectionHeading =
    'flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] uppercase text-black mb-4 md:mb-5';
  const inputClass =
    'w-full border border-black/20 bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/40 outline-none focus:border-black/50 transition-colors';

  const onKClubSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !consent) {
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });
      if (res.ok) {
        setStatus('success');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer className="bg-cream text-black mt-10 md:mt-24">
      {/* Top border with centered Klumit mark */}
      <div className="relative border-t border-black/15">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 bg-cream px-3">
          <Image
            src="/klumit-mark.png"
            alt="KLUMIT"
            width={48}
            height={48}
            className="h-10 w-10 md:h-12 md:w-12 object-contain mix-blend-multiply"
            priority={false}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-10 pt-12 md:pt-16 pb-10 md:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 lg:gap-12">
          {/* THE K CLUB */}
          <div className="order-1">
            <h3 className={sectionHeading}>
              <span className="inline-flex h-5 w-5 items-center justify-center text-black/50" aria-hidden>
                ✓
              </span>
              {t('footer.kClubTitle')}
            </h3>
            <p className="font-display text-2xl md:text-3xl font-normal tracking-[0.08em] uppercase text-black mb-2">
              {t('footer.kClubTitle')}
            </p>
            <p className="text-sm font-light text-black/60 mb-5 leading-relaxed">
              {t('footer.kClubTagline')}
            </p>

            {status === 'success' ? (
              <p className="text-sm text-black/70" role="status">
                {t('footer.joinSuccess')}
              </p>
            ) : (
              <form onSubmit={onKClubSubmit} className="space-y-2.5">
                <input
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('footer.firstName')}
                  required
                  className={inputClass}
                />
                <input
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('footer.lastName')}
                  required
                  className={inputClass}
                />
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.emailField')}
                  required
                  className={inputClass}
                />
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('footer.phoneField')}
                  required
                  className={inputClass}
                />
                <label className="flex items-start gap-2 pt-1 text-xs font-light text-black/55 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="mt-0.5 accent-black"
                  />
                  <span>{t('footer.consent')}</span>
                </label>
                <button
                  type="submit"
                  disabled={status === 'loading' || !consent}
                  className="w-full mt-1 bg-black text-white py-3 text-[11px] tracking-[0.18em] uppercase hover:bg-black/80 disabled:opacity-50 transition-colors"
                >
                  {status === 'loading' ? '…' : t('footer.join')}
                </button>
                {status === 'error' && (
                  <p className="text-sm text-black/70" role="alert">
                    {t('footer.joinError')}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* CONTACT */}
          <div className="order-2">
            <h4 className={sectionHeading}>
              <Mail size={16} strokeWidth={1.5} className="text-black/45" aria-hidden />
              {t('footer.contact')}
            </h4>
            <div className="space-y-2 text-sm font-light text-black/60 leading-relaxed">
              <p>
                <span className="font-medium text-black/80">{t('footer.hours')}</span>
                <br />
                {t('footer.addressDetails')}
                <br />
                {t('footer.hoursDetails')}
              </p>
              <p>
                <span className="font-medium text-black/80">{t('footer.phone')}</span>{' '}
                <a href="tel:+97235178502" className="hover:text-black transition-colors">
                  03-5178502
                </a>
              </p>
              <p>
                <span className="font-medium text-black/80">{t('footer.whatsapp')}</span>{' '}
                <a
                  href="https://wa.me/972549903139"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black transition-colors"
                >
                  054-9903139
                </a>
              </p>
              <p>
                <span className="font-medium text-black/80">{t('footer.whatsapp')}</span>{' '}
                <a
                  href="https://wa.me/972542600177"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black transition-colors"
                >
                  054-2600177
                </a>
              </p>
              <p>
                <span className="font-medium text-black/80">{t('footer.fax')}</span> 03-5106781
              </p>
              <p>
                <span className="font-medium text-black/80">{t('footer.email')}</span>{' '}
                <a href="mailto:klumitltd@gmail.com" className="hover:text-black transition-colors">
                  klumitltd@gmail.com
                </a>
              </p>
            </div>
            <div className="flex items-center gap-4 mt-5">
              <a
                href="https://www.instagram.com/klumit_bags/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/40 hover:text-black transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a
                href="https://www.facebook.com/klomit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/40 hover:text-black transition-colors duration-300"
                aria-label="Facebook"
              >
                <Facebook size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* SHOP */}
          <div className="order-3">
            <h4 className={sectionHeading}>
              <Wallet size={16} strokeWidth={1.5} className="text-black/45" aria-hidden />
              {t('footer.shop')}
            </h4>
            <p className="text-sm font-light text-black/60 mb-4 text-center md:text-start">
              {t('footer.pciSecure')}
            </p>
            <PaymentIcons className="mb-5 justify-center md:justify-start" />
            <Link
              href="/accessibility"
              className="inline-flex items-center gap-2 rounded-full border border-black bg-[#FFE600] px-5 py-2.5 text-sm font-medium text-black hover:bg-[#ffef4d] transition-colors"
            >
              <Accessibility size={18} strokeWidth={2} aria-hidden />
              {t('footer.accessibilityButton')}
            </Link>
          </div>

          {/* SITE */}
          <div className="order-4">
            <h4 className={sectionHeading}>
              <Globe size={16} strokeWidth={1.5} className="text-black/45" aria-hidden />
              {t('footer.site')}
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <ul className="space-y-2">
                <li>
                  <Link href="/" className={link}>
                    {t('footer.home')}
                  </Link>
                </li>
                <li>
                  <Link href="/products?tab=all" className={link}>
                    {t('header.shopAll')}
                  </Link>
                </li>
                <li>
                  <Link href="/products?tab=bags" className={link}>
                    {t('header.bags')}
                  </Link>
                </li>
                <li>
                  <Link href="/products?tab=belts" className={link}>
                    {t('header.belts')}
                  </Link>
                </li>
                <li>
                  <Link href="/products?tab=wallets" className={link}>
                    {t('header.wallets')}
                  </Link>
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
              </ul>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className={link}>
                    {t('footer.about')}
                  </Link>
                </li>
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
          </div>
        </div>

        {/* Brand strip + viewers */}
        <div className="mt-10 md:mt-14 pt-6 border-t border-black/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-start">
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-black/40 mb-2">
              Renato Angi Venezia &middot; Carlino Group
            </p>
            <p className="text-xs font-light text-black/45">{t('footer.brandDesc')}</p>
          </div>
          <ViewerCount />
        </div>

        <div className="border-t border-black/10 mt-6 md:mt-8 pt-6 md:pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <p className="text-[11px] font-light text-center md:text-right text-black/40">
              &copy; {new Date().getFullYear()} {t('footer.copyright')}{' '}
              <span className="font-display tracking-[0.15em] uppercase text-black/70">KLUMIT</span>
            </p>
            <div className="flex gap-5 md:gap-6 text-[11px] font-light text-black/40">
              <Link href="/terms" className="hover:text-black transition-colors duration-300">
                {t('footer.terms')}
              </Link>
              <Link href="/privacy" className="hover:text-black transition-colors duration-300">
                {t('footer.privacy')}
              </Link>
              <Link href="/accessibility" className="hover:text-black transition-colors duration-300">
                {t('footer.accessibility')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
