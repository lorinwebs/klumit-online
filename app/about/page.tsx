'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';

export default function AboutPage() {
  const { t, language } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col bg-[#fdfcfb]" style={{ fontFamily: "'Ellinia', 'Helvetica Neue', Helvetica, Arial, sans-serif" }} dir={language === 'he' ? 'rtl' : 'ltr'}>
      <Header />
      <main id="main-content" className="flex-grow" role="main">
        {/* Story Section with Image */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
              <div className="order-2 md:order-1 space-y-3">
                <div className="relative aspect-[4/2.25] rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src="/about-image-3.jpg"
                    alt={t('about.image1Alt')}
                    fill
                    className="object-cover"
                    style={{ objectPosition: 'center 30%' }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center font-light italic">
                  {t('about.image1Caption')}
                </p>
              </div>
              <div className="text-right space-y-4 order-1 md:order-2">
                <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light block">
                  {t('about.ourStory')}
                </span>
                <h2 className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-4">
                  {t('about.ourHeritage')}
                </h2>
                <div className="space-y-4 text-base font-light text-gray-700 leading-relaxed">
                  <p>
                    {t('about.heritageText1')}
                  </p>
                  <p>
                    {t('about.heritageText2')}
                  </p>
                  <p className="text-lg font-light text-gray-800 mt-6">
                    {t('about.ourFamily')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-right space-y-4">
                <div className="space-y-3 text-base font-light text-gray-700 leading-relaxed">
                  <p>
                    {t('about.exclusiveText')}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="relative aspect-[4/2.25] rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src="/about-image-2.jpg"
                    alt={t('about.image2Alt')}
                    fill
                    className="object-cover"
                    style={{ objectPosition: 'center 20%' }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center font-light italic">
                  {t('about.image2Caption')}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center mt-12">
              <div className="order-2 md:order-1 space-y-3">
                <div className="relative aspect-[4/2.25] rounded-lg overflow-hidden shadow-2xl">
                  <Image
                    src="/about-image-1.jpg"
                    alt={t('about.image3Alt')}
                    fill
                    className="object-cover"
                    style={{ objectPosition: 'center 30%' }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <p className="text-sm text-gray-600 text-center font-light italic">
                  {t('about.image3Caption')}
                </p>
              </div>
              <div className="text-right space-y-4 order-1 md:order-2">
                <div className="space-y-3 text-base font-light text-gray-700 leading-relaxed">
                  <p>
                    {t('about.collectionsText')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-20 bg-white border-t border-gray-200 mt-16 md:mt-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light mb-3 block">
                {t('about.whatMakesUsUnique')}
              </span>
              <h2 className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-6">
                {t('about.whatMakesUsUniqueTitle')}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="text-right space-y-3 border-t border-gray-200 pt-6">
                <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light block">
                  01
                </span>
                <h3 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a] mb-3">
                  {t('about.brandSelection')}
                </h3>
                <p className="text-sm md:text-base font-light text-gray-600 leading-relaxed">
                  {t('about.brandSelectionText')}
                </p>
              </div>
              <div className="text-right space-y-3 border-t border-gray-200 pt-6">
                <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light block">
                  02
                </span>
                <h3 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a] mb-3">
                  {t('about.fashionAlignment')}
                </h3>
                <p className="text-sm md:text-base font-light text-gray-600 leading-relaxed">
                  {t('about.fashionAlignmentText')}
                </p>
              </div>
              <div className="text-right space-y-3 border-t border-gray-200 pt-6">
                <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light block">
                  03
                </span>
                <h3 className="text-xl md:text-2xl font-light luxury-font text-[#1a1a1a] mb-3">
                  {t('about.serviceStandard')}
                </h3>
                <p className="text-sm md:text-base font-light text-gray-600 leading-relaxed">
                  {t('about.serviceStandardText')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="pt-12 pb-6">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-amber-600/70 font-light mb-3 block">
              {t('about.ourCommitment')}
            </span>
            <h2 className="text-3xl md:text-4xl font-light luxury-font text-[#1a1a1a] mb-4">
              {t('about.ourCommitmentTitle')}
            </h2>
            <p className="text-base md:text-lg font-light text-gray-700 leading-relaxed">
              {t('about.commitmentText')}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
