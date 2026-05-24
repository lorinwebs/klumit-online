import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'משמרות בטבריה',
  robots: { index: false, follow: false },
};

export default function TiberiaShiftsLayout({ children }: { children: React.ReactNode }) {
  return <div className="font-sans">{children}</div>;
}
