import type { Metadata } from 'next';
import MovingSaleClient from './MovingSaleClient';

export const metadata: Metadata = {
  title: 'מכירת ריהוט ומוצרים — מעבר דירה',
  description: 'עוברים דירה ומוכרים ריהוט, מכשירי חשמל ומטבח במחירים נמוכים. איסוף עצמי.',
  robots: { index: false, follow: false },
};

export default function MovingSalePage() {
  return <MovingSaleClient />;
}
