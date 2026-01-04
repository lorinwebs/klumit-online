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

export const metadata: Metadata = {
  title: 'קלומית - תיקים יוקרתיים',
  description: 'ייבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP היישר מאיטליה',
  openGraph: {
    title: 'קלומית - תיקים יוקרתיים',
    description: 'ייבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP היישר מאיטליה',
    locale: 'he_IL',
    type: 'website',
    siteName: 'Klumit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'קלומית - תיקים יוקרתיים',
    description: 'ייבואן בלעדי בישראל לתיקי RENTAO ANGI ו-CARLINO GROUP היישר מאיטליה',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${assistant.variable} ${cormorant.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}

