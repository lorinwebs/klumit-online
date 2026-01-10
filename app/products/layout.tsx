import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'תיקים יוקרתיים מאיטליה',
  description: 'קולקציית תיקים יוקרתיים מאיטליה - RENTAO ANGI ו-CARLINO GROUP. תיקי עור איכותיים, תיקי גב, תיקי צד וחגורות. משלוח חינם מעל 500₪.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/products',
  },
  openGraph: {
    title: 'תיקים יוקרתיים מאיטליה | קלומית',
    description: 'קולקציית תיקים יוקרתיים מאיטליה - RENTAO ANGI ו-CARLINO GROUP',
    type: 'website',
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}





