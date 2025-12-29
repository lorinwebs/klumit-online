import type { Metadata } from 'next';
import { Assistant } from 'next/font/google';
import './globals.css';

const assistant = Assistant({ 
  subsets: ['latin', 'latin-ext'],
  weight: ['200', '300', '400', '500', '600', '700'],
  variable: '--font-assistant',
});

export const metadata: Metadata = {
  title: 'Klomit - תיקים יוקרתיים',
  description: 'תיקים יוקרתיים בעיצוב איטלקי',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${assistant.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}

