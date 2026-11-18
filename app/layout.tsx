import type { Metadata, Viewport } from 'next';
import { Assistant, David_Libre } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import { Suspense } from 'react';
import AnalyticsProvider from '@/components/Analytics';
import ConditionalLayout from '@/components/ConditionalLayout';
import { LanguageProvider } from '@/lib/LanguageContext';
import { SaleProvider } from '@/lib/SaleContext';
import { hasSaleProducts } from '@/lib/products-server';
import PostHogAuth from '@/components/PostHogAuth';
import './globals.css';

/* Display serif for headings and the wordmark — Hebrew + Latin in one family.
   To try another face, swap the font here; everything reads it through --font-display.
   David Libre has no light weight, so font-light on headings renders as regular (400). */
const displayFont = David_Libre({
  weight: ['400', '500', '700'],
  subsets: ['latin', 'hebrew'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
});

/* Body / UI text — Hebrew + Latin in one family */
const assistant = Assistant({ 
  subsets: ['latin', 'latin-ext', 'hebrew'],
  weight: ['400', '500', '600'],
  variable: '--font-assistant',
  display: 'swap',
  preload: true,
});

const siteUrl = 'https://www.klumit-online.co.il';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
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
  description: 'יבואן בלעדי בישראל לתיקי RENATO ANGI ו-CARLINO GROUP. קולקציית Renato Angi מעור אמיתי; מותגים נוספים לפי המצוין בכל מוצר. משלוח חינם מעל 500₪.',
  keywords: [
    'תיקים יוקרתיים',
    'תיקי עור',
    'תיקים מאיטליה',
    'קלומית',
    'klumit',
    'RENATO ANGI',
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
    description: 'יבואן בלעדי בישראל לתיקי RENATO ANGI ו-CARLINO GROUP. קולקציית Renato Angi מעור אמיתי; מותגים נוספים לפי המצוין בכל מוצר.',
    url: siteUrl,
    locale: 'he_IL',
    type: 'website',
    siteName: 'Klumit - קלומית',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'קלומית - תיקים יוקרתיים מאיטליה',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'קלומית - תיקים יוקרתיים מאיטליה',
    description: 'יבואן בלעדי בישראל לתיקי RENATO ANGI ו-CARLINO GROUP היישר מאיטליה',
    images: ['/og-image.png'],
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
      foundingDate: '1983',
      email: 'klumitltd@gmail.com',
      brand: [
        { '@type': 'Brand', name: 'Renato Angi Venezia' },
        { '@type': 'Brand', name: 'Carlino Group' },
        { '@type': 'Brand', name: 'Mario Valentino' },
      ],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+972-54-990-3139',
          contactType: 'customer service',
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
      description: 'יבואן בלעדי בישראל לתיקים יוקרתיים מאיטליה - Renato Angi Venezia, Carlino Group. קולקציית Renato Angi מעור אמיתי; מותגים נוספים לפי המצוין בכל מוצר. מאז 1983.',
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
      description: 'חנות תיקים יוקרתיים מאיטליה. יבואן בלעדי של Renato Angi Venezia ו-Carlino Group מאז 1983. קולקציית Renato Angi מעור אמיתי; מותגים נוספים לפי המצוין בכל מוצר.',
      priceRange: '₪₪₪',
      currenciesAccepted: 'ILS',
      paymentAccepted: 'Cash, Credit Card, Bit, Apple Pay, Google Pay',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'גאולה 45',
        addressLocality: 'תל אביב יפו',
        postalCode: '6330447',
        addressCountry: 'IL',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 32.0714,
        longitude: 34.7689,
      },
      parentOrganization: { '@id': `${siteUrl}/#organization` },
      telephone: '+972-54-990-3139',
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
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasSale = await hasSaleProducts();

  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        {/* Set language and direction before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Prefer Hebrew first paint for this storefront; language switcher updates after hydration.
                  document.documentElement.setAttribute('lang', 'he');
                  document.documentElement.setAttribute('dir', 'rtl');
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
        {/* Hero LCP image is preloaded automatically by next/image (priority) */}
        {/* Preconnect to Shopify CDN for product images */}
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.shopify.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${displayFont.variable} ${assistant.variable} font-sans overflow-x-clip`}>
        <PostHogAuth />
        <LanguageProvider>
          <SaleProvider hasSale={hasSale}>
            <ConditionalLayout>
              <Suspense fallback={null}>
                <AnalyticsProvider />
              </Suspense>
              {children}
              <Analytics />
            </ConditionalLayout>
          </SaleProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

