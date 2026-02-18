import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות משלוחים | קלומית',
  description: 'משלוח חינם בקנייה מעל ₪250. משלוח מהיר תוך 3-5 ימי עסקים לכל רחבי הארץ. איסוף עצמי מהחנות בגאולה 45, תל אביב.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/shipping',
  },
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
