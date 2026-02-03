'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

export default function ReturnsPage() {
  const { t, language } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <Header />
      <main id="main-content" className="flex-grow max-w-4xl mx-auto px-4 py-20" role="main">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-8 text-right">
          {t('returns.title')}
        </h1>
        
        <div className="prose prose-lg max-w-none text-right space-y-10">
          <section className="mb-8">
            <p className="font-light leading-relaxed text-gray-700 text-lg">
              {t('returns.intro')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">1. {t('returns.conditions')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('returns.conditionsText')}
            </p>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.conditionNew')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.conditionTag')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>
                  {t('returns.conditionInspection')}
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">2. {t('returns.cancellation')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('returns.cancellationText')}
            </p>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.cancellationFee')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.cancellationProcessing')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.cancellationShipping')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">3. {t('returns.exchange')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('returns.exchangeText')}
            </p>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.exchangeTime')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.exchangeSale')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">4. {t('returns.process')}</h2>
            <div className="bg-[#f9f9f9] border border-[#e5e5e5] p-6 mb-6">
              <p className="font-medium text-[#1a1a1a] mb-4">
                {t('returns.processNote')}
              </p>
              <p className="font-light leading-relaxed text-gray-700 mb-4">
                {t('returns.processWhatsApp')}
              </p>
            </div>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('returns.processOptions')}
            </p>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.processPhysical')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.processCourier')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl md:text-3xl font-light luxury-font mb-6">5. {t('returns.notes')}</h2>
            <ul className="list-none space-y-4 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.noteMinPrice')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.noteAccessories')}</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-[#1a1a1a] mt-1 font-medium">•</span>
                <span>{t('returns.noteWarranty')}</span>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
