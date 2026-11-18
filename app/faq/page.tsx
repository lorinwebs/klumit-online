import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FaqList from '@/components/seo/FaqList';
import JsonLd from '@/components/seo/JsonLd';
import { GuideLinks, siteGuideLinks } from '@/components/seo/SeoGuide';
import { CONTACT, whatsappUrl } from '@/lib/contact';
import { FAQ_GROUPS } from '@/lib/faq';
import { SITE_URL, generateBreadcrumbJsonLd, generateFaqJsonLd } from '@/lib/seo';

const url = `${SITE_URL}/faq`;
const description =
  'תשובות על המוצרים, המשלוחים, התשלום וההחזרות בקלומית: עור איטלקי אמיתי, משלוח תוך 2–5 ימי עסקים, החלפות תוך 14 יום וחנות בתל אביב.';

export const metadata: Metadata = {
  title: 'שאלות נפוצות',
  description,
  alternates: { canonical: url },
  openGraph: {
    title: 'שאלות נפוצות | קלומית',
    description,
    url,
    type: 'website',
    locale: 'he_IL',
    siteName: 'Klumit - קלומית',
    images: ['/og-image.png'],
  },
};

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <JsonLd data={generateFaqJsonLd(FAQ_GROUPS.flatMap((group) => group.items))} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'בית', url: SITE_URL },
          { name: 'שאלות נפוצות', url },
        ])}
      />
      <Header />
      <main id="main-content" className="flex-grow" role="main">
        <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
          <h1 className="font-display text-3xl font-light text-espresso md:text-4xl">שאלות נפוצות</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-stone-dark">
            תשובות קצרות על המוצרים, המשלוחים, התשלום וההחזרות. לא מצאתם תשובה?{' '}
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 transition-colors hover:text-espresso"
            >
              כתבו לנו בוואטסאפ {CONTACT.whatsappDisplay}
            </a>
            .
          </p>

          {FAQ_GROUPS.map((group) => (
            <section key={group.title} className="mt-12">
              <h2 className="mb-4 font-display text-2xl font-light text-espresso">{group.title}</h2>
              <FaqList items={group.items} />
            </section>
          ))}

          <GuideLinks links={siteGuideLinks('/faq')} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
