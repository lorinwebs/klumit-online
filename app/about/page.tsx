'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { motion } from 'framer-motion';
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay: number) => ({
    opacity: 1,
    transition: { duration: 1, delay, ease: 'easeOut' },
  }),
};

const scaleReveal = {
  hidden: { opacity: 0, scale: 1.08 },
  visible: (delay: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function AboutPage() {
  const { t, language } = useLanguage();
  const isRtl = language === 'he';
  return (
    <div
      className="min-h-screen flex flex-col bg-cream"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Header />
      <main id="main-content" className="flex-grow" role="main">

        {/* ══════════ HERO SECTION ══════════ */}
        <section className="relative overflow-hidden bg-espresso">
          {/* Subtle radial gradient background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#3D332E_0%,_#2C2420_70%)]" />

          <div className="relative z-10 max-w-5xl mx-auto px-5 md:px-10 py-20 md:py-32 lg:py-40 text-center">
            <motion.span
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={0.2}
              className="inline-block text-[10px] md:text-xs tracking-editorial uppercase text-terracotta-light/80 font-medium mb-4 md:mb-6"
            >
              {t('about.ourStory')}
            </motion.span>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.4}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-cream leading-tight mb-6 md:mb-8"
            >
              {t('about.ourHeritage')}
            </motion.h1>

            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={0.7}
              className="w-12 h-[1px] bg-terracotta/60 mx-auto mb-6 md:mb-8"
            />

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0.8}
              className="text-sm md:text-base font-light text-cream/60 max-w-2xl mx-auto leading-relaxed"
            >
              {t('about.heritageText1')}
            </motion.p>

            {/* Year badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1.1}
              className="mt-10 md:mt-14 inline-flex flex-col items-center"
            >
              <span className="text-[10px] tracking-editorial uppercase text-cream/30 mb-2">Since</span>
              <span className="font-display text-5xl md:text-6xl font-light text-terracotta-light/40">1984</span>
            </motion.div>
          </div>
        </section>

        {/* ══════════ HERITAGE STORY ══════════ */}
        <section className="py-16 md:py-28 bg-cream">
          <div className="max-w-7xl mx-auto px-5 md:px-10">

            {/* First row: Text + Image */}
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                custom={0.1}
                className="space-y-6 order-2 md:order-1"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-[1px] bg-terracotta/50" />
                  <span className="text-[10px] tracking-editorial uppercase text-terracotta/70 font-medium">
                    {t('about.ourStory')}
                  </span>
                </div>
                <p className="text-base md:text-lg font-light text-stone-dark leading-[1.9]">
                  {t('about.heritageText2')}
                </p>
                <p className="text-base md:text-lg font-medium text-terracotta-dark tracking-wide mt-4 text-center">
                  {t('about.ourFamily')}
                </p>
              </motion.div>

              <motion.div
                variants={scaleReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                custom={0.3}
                className="order-1 md:order-2"
              >
                <div className="relative group">
                  <div className="relative aspect-[4/3] rounded-sm overflow-hidden">
                    <Image
                      src="/about-image-3.jpg"
                      alt={t('about.image1Alt')}
                      fill
                      className="object-cover transition-transform duration-700 ease-luxury group-hover:scale-[1.03]"
                      style={{ objectPosition: 'center 30%' }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  {/* Caption */}
                  <p className="mt-3 text-xs md:text-sm text-stone-dark text-center font-light">
                    {t('about.image1Caption')}
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 my-16 md:my-24">
              <div className="flex-1 h-[1px] bg-sand-dark/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-terracotta/30" />
              <div className="flex-1 h-[1px] bg-sand-dark/40" />
            </div>

            {/* Second row: Image + Text */}
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <motion.div
                variants={scaleReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                custom={0.1}
              >
                <div className="relative group">
                  <div className="relative aspect-[4/3] rounded-sm overflow-hidden">
                    <Image
                      src="/about-image-2.jpg"
                      alt={t('about.image2Alt')}
                      fill
                      className="object-cover transition-transform duration-700 ease-luxury group-hover:scale-[1.03]"
                      style={{ objectPosition: 'center 20%' }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <p className="mt-3 text-xs md:text-sm text-stone-dark text-center font-light">
                    {t('about.image2Caption')}
                  </p>
                </div>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                custom={0.3}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-[1px] bg-terracotta/50" />
                  <span className="text-[10px] tracking-editorial uppercase text-terracotta/70 font-medium">
                    Exclusive Import
                  </span>
                </div>
                <p className="text-base md:text-lg font-light text-stone-dark leading-[1.9]">
                  {t('about.exclusiveText')}
                </p>
              </motion.div>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center justify-center gap-4 my-16 md:my-24">
              <div className="flex-1 h-[1px] bg-sand-dark/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-terracotta/30" />
              <div className="flex-1 h-[1px] bg-sand-dark/40" />
            </div>

            {/* Third row: Text + Image */}
            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                custom={0.1}
                className="space-y-6 order-2 md:order-1"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-[1px] bg-terracotta/50" />
                  <span className="text-[10px] tracking-editorial uppercase text-terracotta/70 font-medium">
                    Italian Tradition
                  </span>
                </div>
                <p className="text-base md:text-lg font-light text-stone-dark leading-[1.9]">
                  {t('about.collectionsText')}
                </p>
              </motion.div>

              <motion.div
                variants={scaleReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                custom={0.3}
                className="order-1 md:order-2"
              >
                <div className="relative group">
                  <div className="relative aspect-[4/3] rounded-sm overflow-hidden">
                    <Image
                      src="/about-image-1.jpg"
                      alt={t('about.image3Alt')}
                      fill
                      className="object-cover transition-transform duration-700 ease-luxury group-hover:scale-[1.03]"
                      style={{ objectPosition: 'center 30%' }}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <p className="mt-3 text-xs md:text-sm text-stone-dark text-center font-light">
                    {t('about.image3Caption')}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════ VALUES SECTION ══════════ */}
        <section className="py-20 md:py-32 bg-cream-warm relative overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #2C2420 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }} />

          <div className="relative z-10 max-w-6xl mx-auto px-5 md:px-10">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              custom={0.1}
              className="text-center mb-14 md:mb-20"
            >
              <span className="text-[10px] tracking-editorial uppercase text-terracotta/70 font-medium mb-4 block">
                {t('about.whatMakesUsUnique')}
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-espresso">
                {t('about.whatMakesUsUniqueTitle')}
              </h2>
              <div className="w-12 h-[1px] bg-terracotta/40 mx-auto mt-6" />
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  num: '01',
                  title: t('about.brandSelection'),
                  text: t('about.brandSelectionText'),
                  delay: 0.2,
                },
                {
                  num: '02',
                  title: t('about.fashionAlignment'),
                  text: t('about.fashionAlignmentText'),
                  delay: 0.35,
                },
                {
                  num: '03',
                  title: t('about.serviceStandard'),
                  text: t('about.serviceStandardText'),
                  delay: 0.5,
                },
              ].map((item) => (
                <motion.div
                  key={item.num}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  custom={item.delay}
                  className="group bg-cream rounded-sm p-7 md:p-9 border border-sand transition-all duration-500 hover:border-terracotta/30 hover:shadow-lg hover:shadow-terracotta/5"
                >
                  <span className="font-display text-3xl md:text-4xl font-light text-terracotta/20 block mb-4 group-hover:text-terracotta/40 transition-colors duration-500">
                    {item.num}
                  </span>
                  <h3 className="font-display text-xl md:text-2xl font-light text-espresso mb-3">
                    {item.title}
                  </h3>
                  <div className="w-6 h-[1px] bg-terracotta/30 mb-4 group-hover:w-10 transition-all duration-500" />
                  <p className="text-sm md:text-[15px] font-light text-stone-dark leading-[1.85]">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ COMMITMENT SECTION ══════════ */}
        <section className="relative py-20 md:py-32 bg-espresso overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-espresso via-espresso-light/20 to-espresso" />

          <div className="relative z-10 max-w-3xl mx-auto px-5 md:px-10 text-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              custom={0.1}
            >
              <span className="text-[10px] tracking-editorial uppercase text-terracotta-light/60 font-medium mb-4 block">
                {t('about.ourCommitment')}
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-cream leading-tight mb-6 md:mb-8">
                {t('about.ourCommitmentTitle')}
              </h2>
              <div className="w-12 h-[1px] bg-terracotta/40 mx-auto mb-8 md:mb-10" />
              <p className="text-sm md:text-base font-light text-cream/55 leading-[1.9] max-w-2xl mx-auto">
                {t('about.commitmentText')}
              </p>
            </motion.div>

            {/* Decorative brand names */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0.6}
              className="mt-14 md:mt-20 flex items-center justify-center gap-6 md:gap-10"
            >
              <span className="text-[10px] md:text-xs tracking-editorial uppercase text-cream/20 font-light">
                Renato Angi Venezia
              </span>
              <div className="w-1 h-1 rounded-full bg-terracotta/30" />
              <span className="text-[10px] md:text-xs tracking-editorial uppercase text-cream/20 font-light">
                Carlino Group
              </span>
            </motion.div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
