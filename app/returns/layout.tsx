import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מדיניות החזרות והחלפות | קלומית',
  description: 'מדיניות החזרות קלומית — החזרה תוך 14 יום (מוצרי מבצע: 48 שעות). החלפה בחנות או באמצעות שליח. וואטסאפ: 054-990-3139.',
  alternates: {
    canonical: 'https://www.klumit-online.co.il/returns',
  },
};

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
