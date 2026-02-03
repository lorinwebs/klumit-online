'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useLanguage } from '@/lib/LanguageContext';

export default function TermsPage() {
  const { t, language } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <Header />
      <main id="main-content" className="flex-grow max-w-4xl mx-auto px-4 py-20" role="main">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-12 text-right">
          {t('terms.title')}
        </h1>
        
        <div className="prose prose-lg max-w-none text-right space-y-8">
          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.introduction')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.introductionText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.websiteUse')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.websiteUseText')}
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.websiteUseCopyright')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.websiteUseIllegal')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.websiteUseUnauthorized')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.orders')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.ordersText')}
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.ordersUnavailable')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.ordersPriceError')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.ordersTechnical')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.prices')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.pricesText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.copyright')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.copyrightText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.delivery')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.deliveryText')}
            </p>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.deliveryFree')}
            </p>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.deliveryTracking')} <Link href="/shipping" className="text-[#1a1a1a] underline hover:no-underline">{t('terms.deliveryLink')}</Link>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.ageLimit')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.ageLimitText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.liability')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.liabilityText')}
            </p>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.liabilityDisclaimer')}
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.liabilityMisuse')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.liabilityDataLoss')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.liabilityTechnical')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.liabilityDelivery')}</span>
              </li>
            </ul>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.liabilityWarranty')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.cancellation')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.cancellationText')}
            </p>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.cancellationProcess')}
            </p>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.cancellationRefund')}
            </p>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.cancellationShipping')} <Link href="/returns" className="text-[#1a1a1a] underline hover:no-underline">{t('terms.cancellationLink')}</Link>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.privacy')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.privacyText')}
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.privacyOrder')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.privacySupport')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.privacyUpdates')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('terms.privacyImprove')}</span>
              </li>
            </ul>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('terms.privacyNoShare')}
            </p>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.privacySecure')} <Link href="/privacy" className="text-[#1a1a1a] underline hover:no-underline">{t('terms.privacyLink')}</Link>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.changes')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.changesText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.law')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('terms.lawText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('terms.contact')}</h2>
            <div className="font-light leading-relaxed text-gray-700 space-y-3">
              <p>
                {t('terms.contactText')}
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{t('terms.companyName')}</strong>
                </p>
                <p>
                  {t('terms.address')}
                </p>
                <p>
                  {t('terms.phone')}
                </p>
                <p>
                  {t('terms.fax')}
                </p>
                <p>
                  {t('terms.email')}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
