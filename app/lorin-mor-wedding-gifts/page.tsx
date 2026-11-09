import type { Metadata } from 'next';
import WeddingGifts from './WeddingGifts';

export const metadata: Metadata = {
  title: { absolute: 'לורין ומור · כמה החברים הביאו' },
  description: 'כמה אורחים הגיעו, כמה כסף הביאו, וכמה זה יוצא לאורח.',
  robots: { index: false, follow: false },
};

export default function LorinMorWeddingGiftsPage() {
  return <WeddingGifts />;
}
