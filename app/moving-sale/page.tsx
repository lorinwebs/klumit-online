import type { Metadata } from 'next';
import MovingSaleClient from './MovingSaleClient';

export const metadata: Metadata = {
  title: { absolute: 'עוברים דירה ומוכרים הכל!' },
  description: 'ריהוט, ארונות ומוצרים לבית במחירים מוזלים. איסוף עצמי מראשון לציון.',
  openGraph: {
    title: 'עוברים דירה ומוכרים הכל!',
    description: 'ריהוט, ארונות ומוצרים לבית במחירים מוזלים. איסוף עצמי מראשון לציון.',
    type: 'website',
    locale: 'he_IL',
    images: [{ url: '/moving-sale/ummi-main-v2.png', width: 1200, height: 630, alt: 'עוברים דירה ומוכרים הכל!' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'עוברים דירה ומוכרים הכל!',
    description: 'ריהוט, ארונות ומוצרים לבית במחירים מוזלים. איסוף עצמי מראשון לציון.',
    images: ['/moving-sale/ummi-main-v2.png'],
  },
  robots: { index: false, follow: false },
};

export default function MovingSalePage() {
  return <MovingSaleClient />;
}
