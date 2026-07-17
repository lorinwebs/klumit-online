import type { Metadata, Viewport } from 'next';
import { Assistant, Cormorant_Garamond } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { Suspense } from 'react';
import AnalyticsProvider from '@/components/Analytics';
import ConditionalLayout from '@/components/ConditionalLayout';
import { LanguageProvider } from '@/lib/LanguageContext';
import './globals.css';

const assistant = Assistant({ 
  subsets: ['latin', 'latin-ext', 'hebrew'],
  weight: ['400', '500', '600'],
  variable: '--font-assistant',
  display: 'swap',
  preload: true,
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
  preload: false,
});

const siteUrl = 'https://www.klumit-online.co.il';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#F5F5F5',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  icons: {
    icon: '/favicon.svg',
  },
  title: {
    default: 'קלומית - תיקים יוקרתיים מאיטליה | Klumit',
    template: '%s | קלומית - Klumit',
  },
  description: 'יבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP. תיקים יוקרתיים מעור איטלקי איכותי, חגורות ואביזרי אופנה היישר מאיטליה. משלוח חינם מעל 500₪.',
  keywords: [
    'תיקים יוקרתיים',
    'תיקי עור',
    'תיקים מאיטליה',
    'קלומית',
    'klumit',
    'RENTAO ANGI',
    'CARLINO GROUP',
    'תיקי נשים',
    'תיקי גב',
    'חגורות עור',
    'אביזרי אופנה',
    'עור איטלקי',
    'תיקים איכותיים',
    'יבוא תיקים',
  ],
  authors: [{ name: 'קלומית בע"מ' }],
  creator: 'קלומית',
  publisher: 'קלומית בע"מ',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: 'קלומית - תיקים יוקרתיים מאיטליה',
    description: 'יבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP. תיקים יוקרתיים מעור איטלקי היישר מאיטליה.',
    url: siteUrl,
    locale: 'he_IL',
    type: 'website',
    siteName: 'Klumit - קלומית',
    images: [
      {
        url: '/hero-venice.jpg',
        width: 1200,
        height: 630,
        alt: 'קלומית - תיקים יוקרתיים מאיטליה',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'קלומית - תיקים יוקרתיים מאיטליה',
    description: 'יבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP היישר מאיטליה',
    images: ['/hero-venice.jpg'],
  },
  category: 'shopping',
};

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'KLUMIT',
      alternateName: ['קלומית בע"מ', 'Klumit'],
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo-klumit.svg`,
      },
      foundingDate: '1984',
      email: 'klumitltd@gmail.com',
      brand: [
        { '@type': 'Brand', name: 'Renato Angi Venezia' },
        { '@type': 'Brand', name: 'Carlino Group' },
        { '@type': 'Brand', name: 'Mario Valentino' },
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+972-3-5178502',
          contactType: 'customer service',
          availableLanguage: ['Hebrew', 'English'],
        },
        {
          '@type': 'ContactPoint',
          telephone: '+972-54-2600177',
          contactType: 'sales',
          availableLanguage: ['Hebrew', 'English'],
        },
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'גאולה 45',
        addressLocality: 'תל אביב יפו',
        postalCode: '6330447',
        addressCountry: 'IL',
      },
      sameAs: [
        'https://www.instagram.com/klumit_bags/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'קלומית - Klumit',
      description: 'יבואן בלעדי בישראל לתיקי עור איטלקיים יוקרתיים - Renato Angi Venezia, Carlino Group. תיקים, חגורות וארנקים מעור איטלקי מאז 1984.',
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'he-IL',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/products?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Store',
      '@id': `${siteUrl}/#store`,
      name: 'קלומית - תיקי עור איטלקיים',
      image: `${siteUrl}/hero-venice.jpg`,
      description: 'חנות תיקי עור יוקרתיים מאיטליה. יבואן בלעדי של Renato Angi Venezia ו-Carlino Group מאז 1984. תיקים, חגורות וארנקים מעור איטלקי אמיתי.',
      priceRange: '₪₪₪',
      currenciesAccepted: 'ILS',
      paymentAccepted: 'Cash, Credit Card, Bit, PayPal',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'גאולה 45',
        addressLocality: 'תל אביב יפו',
        postalCode: '6330447',
        addressCountry: 'IL',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 32.0654,
        longitude: 34.7731,
      },
      telephone: '+972-3-5178502',
      email: 'klumitltd@gmail.com',
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '10:00',
        closes: '17:00',
      },
      areaServed: [
        { '@type': 'City', name: 'תל אביב' },
        { '@type': 'Country', name: 'IL' },
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'האם התיקים עשויים מעור אמיתי?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'כן! כל התיקים שלנו עשויים מעור איטלקי אמיתי 100%. אנחנו יבואנים בלעדיים מאיטליה מאז 1984 ומתמחים בתיקי עור איכותיים בעבודת יד.',
          },
        },
        {
          '@type': 'Question',
          name: 'האם יש משלוח חינם?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'כן! משלוח חינם בכל הזמנה מעל ₪500. משלוח מהיר תוך 3-5 ימי עסקים לכל רחבי הארץ.',
          },
        },
        {
          '@type': 'Question',
          name: 'האם אפשר לראות את התיקים בחנות פיזית?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'בהחלט! החנות שלנו ממוקמת ברחוב גאולה 45, תל אביב. פתוח א\'-ה\' בין השעות 10:00-17:00. מומלץ לתאם פגישה בטלפון 054-2600177.',
          },
        },
        {
          '@type': 'Question',
          name: 'מה מדיניות ההחזרות?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'ניתן להחזיר מוצרים תוך 14 יום מקבלת ההזמנה, בתנאי שהמוצר לא נעשה בו שימוש ובאריזתו המקורית. החזרה בחנות הפיזית או באמצעות שליח.',
          },
        },
        {
          '@type': 'Question',
          name: 'מה ההטבה לחברי מועדון?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'חברי מועדון הלקוחות של קלומית מקבלים 20% הנחה על הקנייה הראשונה, גישה מוקדמת למבצעים והטבות בלעדיות לאורך כל השנה.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Set language and direction before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedLang = localStorage.getItem('language');
                  var lang = (savedLang && ['he', 'en', 'ru'].includes(savedLang)) ? savedLang : 'en';
                  document.documentElement.setAttribute('lang', lang);
                  document.documentElement.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Meta Pixel + GA deferred so they don't block shopping UI */}
        <Script id="meta-pixel" strategy="lazyOnload">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '812488071826982');
          fbq('track', 'PageView');
        `}</Script>
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=812488071826982&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-FZT27KSTMM" strategy="lazyOnload" />
        <Script id="google-analytics" strategy="lazyOnload">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-FZT27KSTMM', { send_page_view: false });
        `}</Script>
        {/* Permissions Policy - allow unload for Supabase Realtime */}
        <meta httpEquiv="Permissions-Policy" content="unload=*" />
        {/* Preload real LCP hero image */}
        <link
          rel="preload"
          href="/hero-venice.png"
          as="image"
          type="image/png"
          fetchPriority="high"
        />
        {/* Preconnect to Shopify CDN for product images */}
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${assistant.variable} ${cormorant.variable} font-sans overflow-x-clip`}>
        <LanguageProvider>
          <ConditionalLayout>
            <Suspense fallback={null}>
              <AnalyticsProvider>
                {children}
              </AnalyticsProvider>
            </Suspense>
            <Analytics />
          </ConditionalLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}

