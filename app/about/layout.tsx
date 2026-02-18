import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'אודות קלומית | יבואן תיקי עור מאיטליה מאז 1984',
  description: 'קלומית - יבואן בלעדי של תיקי עור איטלקיים יוקרתיים מאז 1984. מותגים: Renato Angi Venezia, Carlino Group. חנות פיזית בתל אביב, גאולה 45.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
