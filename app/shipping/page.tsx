'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/lib/LanguageContext';

export default function ShippingPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-grow max-w-4xl mx-auto px-4 py-20" role="main">
        <h1 className="text-4xl md:text-5xl font-light luxury-font mb-12 text-right">
          {t('shipping.title')}
        </h1>
        
        <div className="prose prose-lg max-w-none text-right space-y-8">
          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('shipping.deliveryTimes')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('shipping.deliveryTimesText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('shipping.costs')}</h2>
            <ul className="list-none space-y-3 font-light leading-relaxed text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span><strong>{t('shipping.freeShippingOver')}</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#1a1a1a] mt-1">•</span>
                <span>{t('shipping.homeDelivery')} <strong>₪39</strong></span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('shipping.tracking')}</h2>
            <p className="font-light leading-relaxed text-gray-700">
              {t('shipping.trackingText')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-light luxury-font mb-4">{t('shipping.moreQuestions')}</h2>
            <p className="font-light leading-relaxed text-gray-700 mb-4">
              {t('shipping.moreQuestionsText')}
            </p>
            <a 
              href="https://wa.me/972542600177" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-lg font-light text-[#1a1a1a] hover:opacity-70 transition-opacity"
            >
              📱 054-260-0177 (וואטסאפ)
            </a>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
