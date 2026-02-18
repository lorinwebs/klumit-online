import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות החזרות והחלפות | קלומית',
  description: 'מדיניות החזרות קלומית - החזרת מוצרים תוך 14 יום. החלפה בחנות הפיזית בתל אביב או באמצעות שליח. שירות לקוחות: 054-2600177.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/returns',
  },
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
