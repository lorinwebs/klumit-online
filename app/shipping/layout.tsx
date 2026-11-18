import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות משלוחים',
  description: 'משלוח עד הבית לכל הארץ תוך 2–5 ימי עסקים: חינם בהזמנה מעל ₪500, ומתחת לכך ₪39. איסוף עצמי מהחנות בגאולה 45, תל אביב — חינם.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/shipping',
  },
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
