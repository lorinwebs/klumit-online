'use client';

import { useState, FormEvent } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function HomeNewsletter() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const em = t('home.newsletterTitleEm');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="bg-cream px-5 py-16 md:py-20 text-center border-t border-black/10">
      <p className="text-[11px] tracking-[0.3em] uppercase text-black/50 mb-3">
        {t('home.newsletterEyebrow')}
      </p>
      <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] text-black font-light mb-8">
        {t('home.newsletterTitle')}
        {em ? (
          <>
            {' '}
            <em className="italic">{em}</em>
          </>
        ) : null}
      </h2>
      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-md flex-col items-stretch gap-3 border-b border-black/20 sm:flex-row sm:items-center sm:gap-2"
      >
        <label htmlFor="home-newsletter-email" className="sr-only">
          {t('home.newsletterPlaceholder')}
        </label>
        <input
          id="home-newsletter-email"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('home.newsletterPlaceholder')}
          required
          className="min-h-[44px] flex-1 bg-transparent px-1 py-3 text-sm text-black placeholder:text-black/40 outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="min-h-[44px] shrink-0 self-center px-6 py-3 text-[11px] tracking-[0.22em] uppercase text-black hover:opacity-60 disabled:opacity-50 sm:self-auto sm:px-2"
        >
          {status === 'loading' ? '…' : t('home.newsletterSubmit')}
        </button>
      </form>
      {status === 'success' && (
        <p className="mt-4 text-sm text-black/70" role="status">
          {t('home.newsletterSuccess')}
        </p>
      )}
      {status === 'error' && (
        <p className="mt-4 text-sm text-black/70" role="alert">
          {t('home.newsletterError')}
        </p>
      )}
    </section>
  );
}
