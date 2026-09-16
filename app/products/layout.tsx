import type { Metadata } from 'next';

/** Base metadata; page-level generateMetadata overrides per tab. */
export const metadata: Metadata = {
  title: 'תיקים יוקרתיים מאיטליה | קלומית - Klumit',
  description:
    'קולקציית תיקים יוקרתיים מאיטליה - RENATO ANGI ו-CARLINO GROUP. תיקים, תיקי גב, תיקי צד וחגורות. משלוח חינם מעל 500₪.',
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
