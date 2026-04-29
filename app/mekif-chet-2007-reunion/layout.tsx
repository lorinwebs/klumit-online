import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מקיף ח׳ - מפגש מחזור 20 שנה',
  description: 'מפגש איחוד מחזור 2007 של מקיף ח׳. הרשמה, תשלום, גלריית תמונות וסרטונים.',
  icons: {
    icon: 'https://mekifh.mashov.info/wp-content/uploads/sites/82/2021/06/Semel-MekifH-%D7%A9%D7%9C%D7%95%D7%9D-%D7%95%D7%90%D7%A0%D7%95%D7%A0%D7%95.png',
  },
  openGraph: {
    title: 'מקיף ח׳ - מפגש מחזור 20 שנה',
    description: 'מפגש איחוד מחזור 2007 של מקיף ח׳. הרשמה, תשלום, גלריית תמונות וסרטונים.',
    siteName: 'מקיף ח׳ מפגש איחוד',
    locale: 'he_IL',
    type: 'website',
    images: [
      {
        url: 'https://mekifh.mashov.info/wp-content/uploads/sites/82/2021/06/Semel-MekifH-%D7%A9%D7%9C%D7%95%D7%9D-%D7%95%D7%90%D7%A0%D7%95%D7%A0%D7%95.png',
        width: 400,
        height: 400,
        alt: 'לוגו מקיף ח׳',
      },
    ],
  },
};

export default function MekifChetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
