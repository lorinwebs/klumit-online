'use client';

import { useState, FormEvent } from 'react';
import { useLanguage } from '@/lib/LanguageContext';

export default function HomeNewsletter() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
    <section className="bg-biasia-ink px-5 py-16 md:py-20 text-center">
      <p className="text-[11px] tracking-[0.3em] uppercase text-[#f4efe8]/60 mb-3">
        {t('home.newsletterEyebrow')}
      </p>
      <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] text-biasia-bg mb-8">
        {t('home.newsletterTitle')}{' '}
        <em className="italic text-biasia-bg/95">{t('home.newsletterTitleEm')}</em>
      </h2>
      <form
        onSubmit={onSubmit}
        className="mx-auto flex max-w-md flex-col gap-2 border-b border-[rgba(244,239,232,0.35)] sm:flex-row sm:items-center"
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
          className="min-h-[44px] flex-1 bg-transparent px-1 py-3 text-sm text-biasia-bg placeholder:text-[#f4efe8]/50 outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="min-h-[44px] shrink-0 px-2 py-3 text-[11px] tracking-[0.22em] uppercase text-biasia-bg hover:text-white disabled:opacity-50"
        >
          {status === 'loading' ? '…' : t('home.newsletterSubmit')}
        </button>
      </form>
      {status === 'success' && (
        <p className="mt-4 text-sm text-biasia-bg/80" role="status">
          {t('home.newsletterSuccess')}
        </p>
      )}
      {status === 'error' && (
        <p className="mt-4 text-sm text-terracotta-light" role="alert">
          {t('home.newsletterError')}
        </p>
      )}
    </section>
  );
}
