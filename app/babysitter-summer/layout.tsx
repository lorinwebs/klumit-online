import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'בייביסטר קיץ',
  robots: { index: false, follow: false },
};

export default function BabysitterSummerLayout({ children }: { children: React.ReactNode }) {
  return <div className="font-sans">{children}</div>;
}
