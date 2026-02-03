'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

export default function PrivacyPage() {
  const { t, language } = useLanguage();
  
  const formatDate = (date: Date) => {
    if (language === 'he') {
      return date.toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });
    } else if (language === 'ru') {
      return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <Header />
      <main id="main-content" className="flex-grow max-w-4xl mx-auto px-4 py-20" role="main">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-4 text-right">
          {t('privacy.title')}
        </h1>
        <p className="text-sm text-gray-500 mb-12 text-right">
          {t('privacy.lastUpdated')}: {formatDate(new Date('2026-02-03'))}
        </p>
        
        <div className="prose prose-lg max-w-none text-right space-y-8">
          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('privacy.introduction')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('privacy.introductionText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('privacy.whatWeCollect')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('privacy.whatWeCollectText')}
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.personalInfo')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.paymentInfo')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.technicalInfo')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.usageInfo')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('privacy.howWeUse')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('privacy.howWeUseText')}
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.useOrder')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.useSupport')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.useUpdates')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.useImprove')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.useSecurity')}</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('privacy.sharing')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('privacy.sharingText')}
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.sharingLegal')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.sharingConsent')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.sharingServices')}</span>
              </li>
            </ul>
            <p className="font-light leading-relaxed text-gray-700 mt-4">
              {t('privacy.sharingServicesText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('privacy.security')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('privacy.securityText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('privacy.rights')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('privacy.rightsText')}
            </p>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.rightView')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.rightCorrect')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.rightDelete')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.rightObject')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold mt-1">•</span>
                <span>{t('privacy.rightWithdraw')}</span>
              </li>
            </ul>
            <p className="font-light leading-relaxed text-gray-700 mt-4">
              {t('privacy.rightsContact')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('privacy.cookies')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('privacy.cookiesText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('privacy.changes')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('privacy.changesText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('privacy.contact')}</h2>
            <div className="font-light leading-relaxed text-gray-700 space-y-3">
              <p>
                {t('privacy.contactText')}
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>{t('privacy.companyName')}</strong>
                </p>
                <p>
                  {t('privacy.address')}
                </p>
                <p>
                  {t('privacy.phone')}
                </p>
                <p>
                  {t('privacy.fax')}
                </p>
                <p>
                  {t('privacy.email')}
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
