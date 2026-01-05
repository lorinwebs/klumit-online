import type { Metadata } from 'next';
import { Assistant, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const assistant = Assistant({ 
  subsets: ['latin', 'latin-ext', 'hebrew'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-assistant',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
});

const siteUrl = 'https://www.klumit-online.co.il';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
      name: 'קלומית בע"מ',
      alternateName: 'Klumit',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/hero-venice.jpg`,
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+972-3-5178502',
        contactType: 'customer service',
        availableLanguage: ['Hebrew', 'English'],
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'גאולה 45',
        addressLocality: 'תל אביב יפו',
        postalCode: '6330447',
        addressCountry: 'IL',
      },
      sameAs: [
        'https://www.instagram.com/klomit/',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'קלומית - Klumit',
      description: 'יבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP',
      publisher: { '@id': `${siteUrl}/#organization` },
      inLanguage: 'he-IL',
    },
    {
      '@type': 'Store',
      '@id': `${siteUrl}/#store`,
      name: 'קלומית',
      image: `${siteUrl}/hero-venice.jpg`,
      priceRange: '₪₪₪',
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
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '10:00',
        closes: '17:00',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${assistant.variable} ${cormorant.variable} font-sans overflow-x-hidden`}>
        {children}
      </body>
    </html>
  );
}

