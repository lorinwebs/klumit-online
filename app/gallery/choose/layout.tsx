import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'בחירת תמונות',
  robots: { index: false, follow: false },
};

export default function GalleryChooseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
