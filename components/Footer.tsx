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
          <div className="order-1" id="k-club">
            <h3 className={sectionHeading}>
              <span className="inline-flex h-5 w-5 items-center justify-center text-black/50" aria-hidden>
                ✓
              </span>
              {t('footer.kClubTitle')}
            </h3>
            <p className="text-lg md:text-xl font-light text-black mb-5 leading-relaxed">
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
            </div>
            <div className="flex items-center gap-4 mt-5">
              <a
                href="https://wa.me/972542600177"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black/40 hover:text-black transition-colors duration-300"
                aria-label={t('footer.whatsapp')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
              <a
                href="mailto:klumitltd@gmail.com"
                className="text-black/40 hover:text-black transition-colors duration-300"
                aria-label={t('footer.email')}
              >
                <Mail size={18} strokeWidth={1.5} />
              </a>
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
                href="https://www.facebook.com/klomitltd"
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

        {/* Bottom bar — brand + copyright (single strip) */}
        <div className="mt-10 md:mt-14 pt-6 md:pt-8 border-t border-black/10 flex flex-col gap-4">
          <div className="text-center md:text-start">
            <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-black/40 mb-1.5">
              Renato Angi Venezia &middot; Carlino Group
            </p>
            <p className="text-xs font-light text-black/45">{t('footer.brandDesc')}</p>
          </div>
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
