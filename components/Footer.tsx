'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Instagram, Mail, Accessibility, AlertCircle } from 'lucide-react';
import PaymentIcons from './PaymentIcons';
import { useLanguage } from '@/lib/LanguageContext';

type KClubField = 'firstName' | 'lastName' | 'email' | 'phone';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return /^[\d\s()+-]+$/.test(value) && digits.length >= 9 && digits.length <= 15;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-[13px] leading-snug text-terracotta-light">
      <AlertCircle size={14} strokeWidth={2} className="shrink-0" aria-hidden />
      {message}
    </p>
  );
}

export default function Footer() {
  const { t, language } = useLanguage();
  const isHe = language === 'he';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showErrors, setShowErrors] = useState(false);

  const link = 'text-[15px] text-stone-dark transition-colors duration-300 hover:text-espresso';
  const columnHeading = 'mb-4 text-[13px] font-semibold tracking-[0.08em] text-espresso';
  const iconLink = 'text-stone-dark transition-colors duration-300 hover:text-espresso';
  // 16px text keeps iOS from zooming the page when a field is focused
  const inputClass =
    'w-full border bg-transparent px-4 py-3 text-base text-cream outline-none transition-colors placeholder:text-cream/60';

  const errors: Partial<Record<KClubField, string>> = {};
  if (!firstName.trim()) errors.firstName = t('footer.errorFirstName');
  if (!lastName.trim()) errors.lastName = t('footer.errorLastName');
  if (!email.trim()) errors.email = t('footer.errorEmail');
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = t('footer.errorEmailInvalid');
  if (!phone.trim()) errors.phone = t('footer.errorPhone');
  else if (!isValidPhone(phone.trim())) errors.phone = t('footer.errorPhoneInvalid');

  // Errors appear only after the first submit attempt, then update live as the user types
  const fieldError = (field: KClubField) => (showErrors ? errors[field] : undefined);
  const errorId = (field: KClubField) => `k-club-${field}-error`;
  const fieldProps = (field: KClubField) => {
    const error = fieldError(field);
    return {
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? errorId(field) : undefined,
      className: `${inputClass} ${error ? 'border-terracotta-light' : 'border-cream/45 focus:border-cream'}`,
    };
  };

  const onKClubSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fieldOrder: KClubField[] = ['firstName', 'lastName', 'email', 'phone'];
    const firstInvalid = fieldOrder.find((field) => errors[field]);
    if (firstInvalid) {
      setShowErrors(true);
      (e.currentTarget.elements.namedItem(firstInvalid) as HTMLInputElement | null)?.focus();
      return;
    }
    if (!consent) return;
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
    <footer className="bg-cream text-espresso">
      {/* THE K CLUB — the site's single sign-up form; the announcement bar links here (#k-club) */}
      <section
        id="k-club"
        className="focus-light scroll-mt-28 bg-espresso px-4 py-14 text-cream md:px-8 md:py-20"
        aria-labelledby="k-club-title"
      >
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-9 md:grid-cols-2 md:gap-16">
          <div className="text-center md:text-start">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-terracotta-light">
              {t('footer.kClubTitle')}
            </p>
            <h2
              id="k-club-title"
              className="mx-auto max-w-md text-balance font-display text-[2rem] leading-[1.15] md:mx-0 md:text-[2.6rem]"
            >
              {t('footer.kClubTagline')}
            </h2>
          </div>

          {status === 'success' ? (
            <p className="text-lg text-cream" role="status">
              {t('footer.joinSuccess')}
            </p>
          ) : (
            <form onSubmit={onKClubSubmit} noValidate className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('footer.firstName')}
                  aria-label={t('footer.firstName')}
                  required
                  {...fieldProps('firstName')}
                />
                <FieldError id={errorId('firstName')} message={fieldError('firstName')} />
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('footer.lastName')}
                  aria-label={t('footer.lastName')}
                  required
                  {...fieldProps('lastName')}
                />
                <FieldError id={errorId('lastName')} message={fieldError('lastName')} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.emailField')}
                  aria-label={t('footer.emailField')}
                  required
                  {...fieldProps('email')}
                />
                <FieldError id={errorId('email')} message={fieldError('email')} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('footer.phoneField')}
                  aria-label={t('footer.phoneField')}
                  required
                  {...fieldProps('phone')}
                />
                <FieldError id={errorId('phone')} message={fieldError('phone')} />
              </div>
              {/* The whole row is the tap target (44px), so the box itself can stay small —
                  `!` overrides the global 44px minimum for checkboxes on touch screens */}
              <label className="col-span-2 flex min-h-[44px] cursor-pointer items-center gap-3 text-[15px] text-cream/85">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="h-5 w-5 !min-h-0 !min-w-0 shrink-0 accent-terracotta-light"
                />
                <span>{t('footer.consent')}</span>
              </label>
              <button
                type="submit"
                disabled={status === 'loading' || !consent}
                className={`col-span-2 min-h-[52px] bg-cream px-8 font-medium text-espresso transition-colors duration-300 hover:bg-cream-deep disabled:opacity-50 ${
                  isHe ? 'text-base' : 'text-[13px] uppercase tracking-[0.14em]'
                }`}
              >
                {status === 'loading' ? '…' : t('footer.join')}
              </button>
              {status === 'error' && (
                <p className="col-span-2 text-sm text-cream" role="alert">
                  {t('footer.joinError')}
                </p>
              )}
            </form>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-14 md:px-8 md:pt-20">
        {/* Centred while the columns are stacked (phones); aligned to the reading side once they sit in a row */}
        <div className="grid grid-cols-1 gap-10 text-center sm:grid-cols-2 md:grid-cols-4 md:gap-8 md:text-start lg:gap-12">
          {/* Brand */}
          <div>
            <div className="flex justify-center md:justify-start">
              <span
                dir="ltr"
                className="block border border-espresso py-2.5 pl-5 pr-[calc(1.25rem-0.3em)] font-display text-xl uppercase leading-none tracking-[0.3em] text-espresso"
              >
                KLUMIT
              </span>
            </div>
            <p className="mx-auto mt-4 max-w-[26ch] text-[15px] leading-relaxed text-stone-dark md:mx-0">
              {t('footer.brandDesc')}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-stone">
              Renato Angi Venezia &middot; Carlino Group
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className={columnHeading}>{t('footer.contact')}</h3>
            <p className="text-[15px] leading-relaxed text-stone-dark">
              <span className="font-medium text-espresso">{t('footer.hours')}</span>
              <br />
              {t('footer.addressDetails')}
              <br />
              {t('footer.hoursDetails')}
            </p>
            <div className="mt-5 flex items-center justify-center gap-5 md:justify-start">
              <a
                href="https://wa.me/972549903139"
                target="_blank"
                rel="noopener noreferrer"
                className={iconLink}
                aria-label={t('footer.whatsapp')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
              <a href="mailto:klumitltd@gmail.com" className={iconLink} aria-label={t('footer.email')}>
                <Mail size={20} strokeWidth={1.5} />
              </a>
              <a
                href="https://www.instagram.com/klumit_bags/"
                target="_blank"
                rel="noopener noreferrer"
                className={iconLink}
                aria-label="Instagram"
              >
                <Instagram size={20} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className={columnHeading}>{t('footer.shop')}</h3>
            <p className="mb-4 text-[15px] text-stone-dark">{t('footer.pciSecure')}</p>
            <PaymentIcons className="mb-5 md:!justify-start" />
            <Link
              href="/accessibility"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-espresso px-5 text-[15px] font-medium text-espresso transition-colors duration-300 hover:bg-espresso hover:text-cream"
            >
              <Accessibility size={18} strokeWidth={1.75} aria-hidden />
              {t('footer.accessibilityButton')}
            </Link>
          </div>

          {/* Site */}
          <div>
            <h3 className={columnHeading}>{t('footer.site')}</h3>
            <div className="grid grid-cols-2 gap-x-4">
              <ul className="space-y-2.5">
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
                  <Link href="/bags" className={link}>
                    {t('header.bags')}
                  </Link>
                </li>
                <li>
                  <Link href="/belts" className={link}>
                    {t('header.belts')}
                  </Link>
                </li>
                <li>
                  <Link href="/wallets" className={link}>
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
              <ul className="space-y-2.5">
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
                  <Link href="/faq" className={link}>
                    {t('footer.faq')}
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

        <p className="mt-12 border-t border-sand pt-6 text-center text-[13px] text-stone md:mt-16">
          &copy; {new Date().getFullYear()} {t('footer.copyright')}{' '}
          <span dir="ltr" className="font-display uppercase tracking-[0.15em] text-espresso">
            KLUMIT
          </span>
        </p>
      </div>
    </footer>
  );
}
