import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'אודות קלומית | יבואן תיקים יוקרתיים מאיטליה מאז 1983',
  description: 'קלומית - יבואן בלעדי של תיקים יוקרתיים מאיטליה מאז 1983. מותגים: Renato Angi Venezia, Carlino Group. חנות פיזית בתל אביב, גאולה 45.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
