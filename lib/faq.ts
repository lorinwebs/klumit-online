import { CONTACT } from '@/lib/contact';
import type { FaqItem } from '@/lib/seo';
import { STORE_POLICY } from '@/lib/store-policy';

const {
  freeShippingThreshold,
  standardShippingPrice,
  deliveryBusinessDays,
  returnWindowDays,
  saleExchangeWindowHours,
  returnCourierFee,
} = STORE_POLICY;

/** Answers repeated on the FAQ, category and brand pages — keep them identical everywhere. */
export const ANSWERS = {
  material:
    'קולקציית Renato Angi עשויה מעור איטלקי אמיתי. בפריטים של מותגים אחרים, כמו Mario Valentino, החומר משתנה מדגם לדגם — עור אמיתי או דמוי עור — והוא מצוין בעמוד של כל מוצר.',
  shipping: `משלוח עד הבית לכל הארץ תוך ${deliveryBusinessDays.min}–${deliveryBusinessDays.max} ימי עסקים מרגע אישור ההזמנה. המשלוח חינם בהזמנה מעל ₪${freeShippingThreshold}, ומתחת לסכום הזה הוא עולה ₪${standardShippingPrice}.`,
  showroom: `כן. אפשר לראות את הפריטים בחנות שלנו ברחוב ${CONTACT.address}, בימים ${CONTACT.hours}. מומלץ לתאם הגעה מראש בוואטסאפ ${CONTACT.whatsappDisplay}.`,
  exchange: `פריט במחיר מלא אפשר להחליף או לקבל עליו שובר זיכוי בשווי מלא תוך ${returnWindowDays} יום מקבלתו. פריט במבצע או ב-Outlet אפשר להחליף או לקבל עליו זיכוי תוך ${saleExchangeWindowHours} שעות בלבד. בשני המקרים הפריט צריך להיות חדש, בלי סימני שימוש, באריזה המקורית ועם התווית מחוברת.`,
};

export const MARIO_VALENTINO_FAQ: FaqItem = {
  question: 'האם Mario Valentino הוא אותו מותג כמו Valentino Garavani?',
  answer:
    'לא. Mario Valentino הוא בית אופנה איטלקי נפרד, שנוסד בנאפולי ב-1952. על חלק מהפריטים שלו מופיע הלוגו VALENTINO, אבל אין לו קשר ל-Valentino Garavani.',
};

export interface FaqGroup {
  title: string;
  items: FaqItem[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    title: 'המוצרים',
    items: [
      { question: 'האם התיקים עשויים מעור אמיתי?', answer: ANSWERS.material },
      {
        question: 'מאיפה מגיעים התיקים?',
        answer:
          'התיקים מיובאים מאיטליה. קלומית פועלת מאז 1983 והיא היבואנית הבלעדית בישראל של Renato Angi Venezia ו-Carlino Group.',
      },
      {
        question: 'אילו מותגים יש באתר?',
        answer:
          'Renato Angi Venezia, Mario Valentino, Biasia ו-ByByblos. המבחר מתעדכן לפי הקולקציות שמגיעות מאיטליה.',
      },
      MARIO_VALENTINO_FAQ,
      {
        question: 'איפה רואים את המידות של תיק?',
        answer: `המידות מפורטות בתיאור של כל מוצר. אם חסר פרט או שאתם לא בטוחים שהתיק מתאים, שלחו לנו הודעה בוואטסאפ ${CONTACT.whatsappDisplay}.`,
      },
      {
        question: 'יש באתר גם תיקים וארנקים לגברים?',
        answer: 'כן. בקטלוג יש תיקי צד, תיקי מסנג׳ר ותיקי גב לגבר, וגם ארנקים ומחזיקי כרטיסים.',
      },
    ],
  },
  {
    title: 'משלוחים',
    items: [
      { question: 'כמה זמן לוקח המשלוח?', answer: ANSWERS.shipping },
      {
        question: 'כמה עולה משלוח?',
        answer: `המשלוח חינם בהזמנה מעל ₪${freeShippingThreshold}. בהזמנה בסכום נמוך יותר, משלוח עד הבית עולה ₪${standardShippingPrice}.`,
      },
      {
        question: 'אפשר לאסוף את ההזמנה מהחנות?',
        answer: `כן. בשלב פרטי ההזמנה בוחרים "איסוף עצמי מהחנות", משלמים באתר ולא משלמים דמי משלוח. האיסוף מהחנות ברחוב ${CONTACT.address}, בימים ${CONTACT.hours}, וניצור איתכם קשר כשההזמנה מוכנה.`,
      },
      {
        question: 'איך עוקבים אחרי המשלוח?',
        answer:
          'אחרי ההזמנה נשלח אליכם אימייל עם מספר מעקב. אפשר לעקוב אחרי המשלוח דרך הקישור באימייל או באזור האישי באתר.',
      },
    ],
  },
  {
    title: 'תשלום',
    items: [
      {
        question: 'אילו אמצעי תשלום אפשר להשתמש בהם?',
        answer:
          'כרטיס אשראי (Visa, Mastercard ו-American Express), Bit, Apple Pay ו-Google Pay, לפי מה שזמין במכשיר שלכם. התשלום באתר מאובטח בתקן PCI.',
      },
    ],
  },
  {
    title: 'החזרות והחלפות',
    items: [
      { question: 'אפשר להחליף פריט או לקבל זיכוי?', answer: ANSWERS.exchange },
      {
        question: 'אפשר לבטל עסקה ולקבל החזר כספי?',
        answer: `כן, תוך ${returnWindowDays} יום מקבלת המוצר ובתנאי שהוא חדש ובאריזה המקורית. לפי החוק מנוכים דמי ביטול של 5% ממחיר המוצר או ₪100, הנמוך מביניהם, ובתשלום בכרטיס אשראי עשויה להיות מנוכה גם עמלת הסליקה (עד 2.5%). דמי המשלוח המקוריים לא מוחזרים. כדי להימנע מהניכויים אפשר לבחור החלפה או שובר זיכוי.`,
      },
      {
        question: 'איך מחזירים או מחליפים פריט?',
        answer: `פותחים בקשה בוואטסאפ ${CONTACT.whatsappDisplay}. אחרי האישור אפשר להביא את הפריט לחנות ברחוב ${CONTACT.address} בתיאום מראש, או להזמין שליח שיאסוף אותו בעלות ₪${returnCourierFee.toFixed(2)}, שמקוזזת מהזיכוי או מההחזר.`,
      },
    ],
  },
  {
    title: 'החנות ושירות הלקוחות',
    items: [
      { question: 'אפשר לראות את התיקים לפני שקונים?', answer: ANSWERS.showroom },
      {
        question: 'איך יוצרים קשר?',
        answer: `בוואטסאפ ${CONTACT.whatsappDisplay} או באימייל ${CONTACT.email}.`,
      },
      {
        question: 'מה מקבלים במועדון הלקוחות?',
        answer:
          '10% הנחה בקנייה הראשונה, גישה מוקדמת למבצעים והטבות בלעדיות לאורך השנה. ההצטרפות בטופס שבתחתית כל עמוד באתר.',
      },
    ],
  },
];
