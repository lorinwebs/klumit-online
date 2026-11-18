import { CONTACT } from '@/lib/contact';
import { ANSWERS, MARIO_VALENTINO_FAQ } from '@/lib/faq';
import type { FaqItem } from '@/lib/seo';

export interface BrandPage {
  slug: string;
  name: string;
  /** Case-insensitive substring of the Shopify vendor */
  vendorMatch: string;
  title: string;
  description: string;
  intro: string[];
  faq: FaqItem[];
}

/** Brands with enough stock for a landing page of their own; smaller brands stay as catalog filters. */
export const BRAND_PAGES: BrandPage[] = [
  {
    slug: 'renato-angi',
    name: 'Renato Angi Venezia',
    vendorMatch: 'renato',
    title: 'Renato Angi בישראל – תיקי עור איטלקיים',
    description:
      'Renato Angi Venezia – תיקים מעור איטלקי אמיתי מוונציה. קלומית היא היבואנית הבלעדית של המותג בישראל: תיקי כתף, תיקי צד, תיקי גב ותיקי ערב, באתר ובחנות בתל אביב.',
    intro: [
      'Renato Angi Venezia הוא מותג תיקים איטלקי מוונציה. קולקציית Renato Angi עשויה מעור איטלקי אמיתי.',
      'קלומית היא היבואנית הבלעדית של Renato Angi בישראל. אצלנו תמצאו את הדגמים העדכניים של המותג: תיקי כתף, תיקי צד, תיקי גב, תיקי יד מיני ותיקי ערב, וגם תיקים וארנקים לגבר.',
    ],
    faq: [
      {
        question: 'האם תיקי Renato Angi עשויים מעור אמיתי?',
        answer:
          'כן. קולקציית Renato Angi עשויה מעור איטלקי אמיתי, ובדגמים רבים מצוין גם סוג העור, כמו עור נאפה או עור קלוע.',
      },
      {
        question: 'איפה קונים Renato Angi בישראל?',
        answer: `קלומית היא היבואנית הבלעדית של Renato Angi בישראל. אפשר להזמין באתר עם משלוח עד הבית, או לראות את הדגמים בחנות שלנו ברחוב ${CONTACT.address} (מומלץ לתאם מראש בוואטסאפ ${CONTACT.whatsappDisplay}).`,
      },
      {
        question: 'יש דגמים של Renato Angi לגברים?',
        answer: 'כן. בקולקציה יש גם תיקי צד וארנקים לגבר.',
      },
      { question: 'כמה זמן לוקח המשלוח?', answer: ANSWERS.shipping },
    ],
  },
  {
    slug: 'mario-valentino',
    name: 'Mario Valentino',
    vendorMatch: 'valentino',
    title: 'Mario Valentino – תיקים, ארנקים וחגורות',
    description:
      'Mario Valentino בקלומית: תיקי טוט, תיקי כתף, תיקי גב, תיקי צד לגבר, ארנקים, מחזיקי כרטיסים וחגורות. משלוח תוך 2–5 ימי עסקים, חינם מעל ₪500.',
    intro: [
      'Mario Valentino הוא בית אופנה איטלקי שנוסד בנאפולי ב-1952 ומעצב תיקים, נעליים ואביזרים. על חלק מהפריטים מופיע הלוגו VALENTINO.',
      'בקלומית תמצאו מבחר מהקולקציה: תיקי טוט ותיקי כתף, תיקי גב, תיקי צד ומסנג׳ר לגבר, ארנקים, מחזיקי כרטיסים וחגורות עם אבזם V.',
    ],
    faq: [
      MARIO_VALENTINO_FAQ,
      {
        question: 'האם המוצרים של Mario Valentino עשויים מעור?',
        answer:
          'זה משתנה מדגם לדגם. יש פריטים מעור אמיתי ויש פריטים מדמוי עור או מחומרים אחרים, כמו קש קלוע. החומר מצוין בעמוד של כל מוצר.',
      },
      { question: 'אפשר לראות את הדגמים לפני שקונים?', answer: ANSWERS.showroom },
      { question: 'כמה זמן לוקח המשלוח?', answer: ANSWERS.shipping },
    ],
  },
];

export function brandPath(brand: BrandPage) {
  return `/brands/${brand.slug}`;
}

export function getBrandPage(slug: string) {
  return BRAND_PAGES.find((brand) => brand.slug === slug);
}

/** Landing page for a Shopify vendor, if that brand has one */
export function brandPageForVendor(vendor: string | undefined) {
  const v = vendor?.toLowerCase();
  if (!v) return undefined;
  return BRAND_PAGES.find((brand) => v.includes(brand.vendorMatch));
}
