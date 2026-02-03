'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

export default function AccessibilityPage() {
  const { t, language } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <Header />
      <main id="main-content" className="flex-grow max-w-4xl mx-auto px-4 py-12 md:py-20" role="main">
        <h1 className="text-3xl md:text-4xl font-light luxury-font mb-8 text-right">
          {t('accessibility.title')}
        </h1>

        <div className="prose prose-lg max-w-none text-right space-y-6 font-light text-gray-700">
          <section aria-labelledby="commitment">
            <h2 id="commitment" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              {t('accessibility.commitment')}
            </h2>
            <p>
              {t('accessibility.commitmentText')}
            </p>
          </section>

          <section aria-labelledby="actions">
            <h2 id="actions" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              {t('accessibility.actions')}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li>{t('accessibility.actionKeyboard')}</li>
              <li>{t('accessibility.actionScreenReader')}</li>
              <li>{t('accessibility.actionAlt')}</li>
              <li>{t('accessibility.actionHeadings')}</li>
              <li>{t('accessibility.actionContrast')}</li>
              <li>{t('accessibility.actionSkip')}</li>
              <li>{t('accessibility.actionForms')}</li>
              <li>{t('accessibility.actionErrors')}</li>
            </ul>
          </section>

          <section aria-labelledby="keyboard">
            <h2 id="keyboard" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              {t('accessibility.keyboard')}
            </h2>
            <ul className="list-disc list-inside space-y-2 mr-4">
              <li><kbd className="bg-gray-100 px-2 py-1 rounded">{t('accessibility.keyboardTab')}</kbd></li>
              <li><kbd className="bg-gray-100 px-2 py-1 rounded">{t('accessibility.keyboardShiftTab')}</kbd></li>
              <li><kbd className="bg-gray-100 px-2 py-1 rounded">{t('accessibility.keyboardEnter')}</kbd></li>
              <li><kbd className="bg-gray-100 px-2 py-1 rounded">{t('accessibility.keyboardEscape')}</kbd></li>
            </ul>
          </section>

          <section aria-labelledby="browsers">
            <h2 id="browsers" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              {t('accessibility.browsers')}
            </h2>
            <p>
              {t('accessibility.browsersText')}
            </p>
          </section>

          <section aria-labelledby="contact">
            <h2 id="contact" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              {t('accessibility.contact')}
            </h2>
            <p>
              {t('accessibility.contactText')}
            </p>
            <ul className="list-none space-y-2 mr-4 mt-4">
              <li>
                <strong>{t('accessibility.contactEmail')}</strong>{' '}
                <a href="mailto:klumitltd@gmail.com" className="text-[#1a1a1a] underline hover:no-underline">
                  klumitltd@gmail.com
                </a>
              </li>
              <li>
                <strong>{t('accessibility.contactPhone')}</strong>{' '}
                <a href="tel:+97235178502" className="text-[#1a1a1a] underline hover:no-underline">
                  03-5178502
                </a>
              </li>
            </ul>
          </section>

          <section aria-labelledby="update">
            <h2 id="update" className="text-xl md:text-2xl font-light luxury-font mt-8 mb-4 text-[#1a1a1a]">
              {t('accessibility.update')}
            </h2>
            <p>
              {t('accessibility.updateText')}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
