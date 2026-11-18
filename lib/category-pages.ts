import { CONTACT } from '@/lib/contact';
import { ANSWERS } from '@/lib/faq';
import type { ProductCategory } from '@/lib/product-search';
import type { FaqItem } from '@/lib/seo';

export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface CategoryPage {
  category: ProductCategory;
  path: string;
  /** Short name for breadcrumbs */
  name: string;
  title: string;
  description: string;
  guideTitle: string;
  sections: GuideSection[];
  faq: FaqItem[];
}

/** Category landing pages (/bags, /belts, /wallets) — the indexable replacements for /products?tab=… */
export const CATEGORY_PAGES: Record<ProductCategory, CategoryPage> = {
  bags: {
    category: 'bags',
    path: '/bags',
    name: 'תיקים',
    title: 'תיקים מאיטליה – תיקי עור, כתף, צד וגב',
    description:
      'תיקים מאיטליה מבית Renato Angi (עור איטלקי אמיתי), Mario Valentino ועוד: תיקי כתף, תיקי צד, תיקי גב ותיקי ערב. משלוח תוך 2–5 ימי עסקים, חינם מעל ₪500.',
    guideTitle: 'איך בוחרים תיק',
    sections: [
      {
        heading: 'איזה גודל מתאים לך?',
        paragraphs: [
          'לסידורים וליציאות ערב מספיק תיק קטן — תיק צד או תיק יד מיני שמחזיק טלפון, ארנק ומפתחות. לעבודה וללימודים כדאי לבחור תיק כתף גדול, תיק טוט או תיק גב, ולבדוק בעמוד המוצר שהמידות מתאימות למחשב או לטאבלט.',
          'תיק צד עם רצועה ארוכה או תיק גב משאירים את הידיים פנויות. תיק כתף עם ידיות נראה מסודר יותר בפגישות ובמשרד.',
        ],
      },
      {
        heading: 'עור איטלקי אמיתי או דמוי עור?',
        paragraphs: [ANSWERS.material],
      },
      {
        heading: 'תיקים לגברים',
        paragraphs: ['בקטלוג יש גם תיקים לגבר: תיקי צד, תיקי מסנג׳ר ותיקי גב.'],
      },
    ],
    faq: [
      { question: 'האם התיקים עשויים מעור אמיתי?', answer: ANSWERS.material },
      {
        question: 'איך יודעים אם תיק מתאים ללפטופ?',
        answer: `המידות של התיק מפורטות בעמוד המוצר. השוו אותן למידות המחשב עצמו, ולא רק לגודל המסך באינצ׳ים. אם המידות לא מופיעות או שאתם לא בטוחים, שלחו לנו הודעה בוואטסאפ ${CONTACT.whatsappDisplay}.`,
      },
      { question: 'אפשר לראות את התיקים לפני שקונים?', answer: ANSWERS.showroom },
      { question: 'כמה זמן לוקח המשלוח?', answer: ANSWERS.shipping },
    ],
  },
  belts: {
    category: 'belts',
    path: '/belts',
    name: 'חגורות',
    title: 'חגורות מעוצבות מאיטליה',
    description:
      'חגורות בעיצוב איטלקי ממותגים כמו Mario Valentino, עם אבזמים מעוצבים. משלוח עד הבית תוך 2–5 ימי עסקים, חינם מעל ₪500.',
    guideTitle: 'איך בוחרים חגורה',
    sections: [
      {
        heading: 'איך בוחרים מידה?',
        paragraphs: [
          'הדרך הפשוטה ביותר: מודדים חגורה שכבר יש לכם, מהאבזם ועד החור שבו אתם משתמשים הכי הרבה, ומשווים למידות שבעמוד המוצר. אפשר גם למדוד סביב המותניים, בגובה שבו החגורה יושבת על המכנסיים או על השמלה.',
        ],
      },
      {
        heading: 'חגורה רחבה או צרה?',
        paragraphs: [
          'חגורה רחבה עם אבזם בולט מתאימה לג׳ינס, למכנסיים בגזרה גבוהה ולמעילים. חגורה צרה עדינה יותר ומתאימה לשמלות, לחצאיות ולבלייזרים.',
        ],
      },
    ],
    faq: [
      {
        question: 'מה עושים אם המידה לא מתאימה?',
        answer: `${ANSWERS.exchange} מתאמים את ההחלפה מראש בוואטסאפ ${CONTACT.whatsappDisplay}.`,
      },
      {
        question: 'ממה עשויות החגורות?',
        answer: 'החומר משתנה מדגם לדגם ומצוין בעמוד של כל מוצר.',
      },
      { question: 'כמה זמן לוקח המשלוח?', answer: ANSWERS.shipping },
    ],
  },
  wallets: {
    category: 'wallets',
    path: '/wallets',
    name: 'ארנקים',
    title: 'ארנקים ומחזיקי כרטיסים מאיטליה לנשים ולגברים',
    description:
      'ארנקים ומחזיקי כרטיסים מאיטליה ממותגים כמו Mario Valentino ו-Renato Angi, לנשים ולגברים. משלוח תוך 2–5 ימי עסקים, חינם מעל ₪500.',
    guideTitle: 'איך בוחרים ארנק',
    sections: [
      {
        heading: 'איזה ארנק מתאים לך?',
        paragraphs: [
          'ארנק גדול עם רוכסן מחזיק שטרות, מטבעות וכרטיסים ומתאים לשימוש בתוך תיק. ארנק קומפקטי נכנס לכיס או לתיק ערב קטן. מחזיק כרטיסים דק מספיק למי שמשלמים בעיקר בכרטיס או בטלפון.',
        ],
      },
      {
        heading: 'ארנק כמתנה',
        paragraphs: [
          'ארנק או מחזיק כרטיסים הם מתנה שלא צריך לנחש בשבילה מידה. אם המתנה לא מתאימה, אפשר להחליף אותה או לקבל זיכוי לפי מדיניות ההחלפות.',
        ],
      },
    ],
    faq: [
      {
        question: 'האם הארנקים עשויים מעור?',
        answer:
          'זה תלוי בדגם ובמותג. פריטי Renato Angi עשויים מעור איטלקי אמיתי, ובשאר המותגים החומר מצוין בעמוד המוצר.',
      },
      {
        question: 'יש ארנקים לגברים?',
        answer: 'כן. בקטלוג יש ארנקים ומחזיקי כרטיסים לגברים, מארנקים קומפקטיים עם כיס רוכסן ועד מחזיקי כרטיסים דקים.',
      },
      { question: 'כמה זמן לוקח המשלוח?', answer: ANSWERS.shipping },
    ],
  },
};
