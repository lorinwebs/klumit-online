/** תמונות ב-public/moving-sale/ — למשל `/moving-sale/ummi-1.png` */
export type MovingSaleItem = {
  id: string;
  name: string;
  description: string;
  price?: number;
  originalPrice?: number;
  category: string;
  status: 'available' | 'reserved' | 'sold';
  image?: string;
  images?: string[];
  referenceUrl?: string;
  emoji?: string;
};

export const MOVING_SALE_CONTACT = {
  location: 'ראשון לציון',
  note: 'איסוף עצמי מראשון לציון · תשלום במזומן / ביט',
  primary: { name: 'לורין', phone: '972524893329', display: '052-489-3329' },
  secondary: { name: 'מור', phone: '972542600177', display: '054-260-0177' },
  /** primary phone — used by all CTAs */
  get phone() {
    return this.primary.phone;
  },
};

export const MOVING_SALE_ITEMS: MovingSaleItem[] = [
  {
    id: 'ummi',
    name: 'קומודה מעץ עם 6 מגירות',
    description:
      'מדגם UMMI של KUALA — קומודה מודרנית עם 6 מגירות, גוף שחור ורגליים מעץ אלון. יש שריטות על החלק העליון.',
    price: 1000,
    originalPrice: 3200,
    category: 'ריהוט',
    status: 'available',
    images: ['/moving-sale/ummi-main-v2.png', '/moving-sale/ummi-receipt.png'],
    referenceUrl: 'https://kualastyle.com/products/ummi?variant=42383765405851',
  },
  {
    id: 'doron-wardrobe',
    name: 'ארון בגדים מרהיטי דורון',
    description:
      'מצב טוב. ארון לבן עם 2 דלתות הזזה ו-2 מגירות תחתונות. מידות: רוחב 1.40 מ\', גובה 2.40 מ\', עומק 60 ס"מ.',
    category: 'ארונות',
    status: 'available',
    images: ['/moving-sale/doron-wardrobe-1.png', '/moving-sale/doron-wardrobe-2.png'],
  },
  {
    id: 'doron-wardrobe-3door',
    name: 'ארון בגדים 3 דלתות — רהיטי דורון',
    description:
      'מצב טוב. ארון לבן עם 3 דלתות — מדפים, 4 מגירות ומוט תלייה. מידות: רוחב 1.80 מ\', גובה 2.40 מ\'.',
    category: 'ארונות',
    status: 'available',
    images: ['/moving-sale/doron-wardrobe-2-1.png', '/moving-sale/doron-wardrobe-2-2.png'],
  },
  {
    id: 'carlsson-tables',
    name: 'סט שולחנות סלון',
    description:
      'מ-KUALA, מדגם Carlsson — סט שני שולחנות בגווני שחור ועץ טבעי. יש שברים בפינה. מידות: אורך 1.30 מ\', רוחב 60 ס"מ, גובה 35 ס"מ.',
    price: 800,
    originalPrice: 3300,
    category: 'ריהוט',
    status: 'available',
    images: [
      '/moving-sale/tables-1.png',
      '/moving-sale/tables-2.png',
      '/moving-sale/tables-3.png',
      '/moving-sale/tables-4.png',
      '/moving-sale/tables-5.png',
      '/moving-sale/ummi-receipt.png',
    ],
    referenceUrl:
      'https://kualastyle.com/products/carlsan?srsltid=AfmBOoqH2f70GJ566OXrttYHC0GjOjvtdjkBR3uiF9REyFFOL2rP38GG',
  },
  {
    id: 'sinclair-sideboard',
    name: 'מזנון נורדי מעץ ומתכת',
    description:
      'מ-KUALA, מדגם Sinclair — מזנון מודרני בשילוב עץ אלון טבעי ומתכת שחורה, רוחב 220 ס"מ.',
    price: 1400,
    originalPrice: 4800,
    category: 'ריהוט',
    status: 'available',
    images: ['/moving-sale/sinclair-1.png', '/moving-sale/ummi-receipt.png'],
    referenceUrl:
      'https://kualastyle.com/products/sinclair?srsltid=AfmBOormofT3Wxgj9kfsbzGkK-bQ_AepseOytwDCzCKSFEGPRVYbgRR5',
  },
  {
    id: 'doron-closet-room',
    name: 'חדר ארונות — רהיטי דורון',
    description:
      '5 חלקים מרהיטי דורון, מחוברים יחד. ניתן לרכוש חלק בודד או את כל הסט. מחיר בפרטי — כתבו בוואטסאפ.',
    category: 'ארונות',
    status: 'available',
    images: [
      '/moving-sale/closet-1.png',
      '/moving-sale/closet-2.png',
      '/moving-sale/closet-3.png',
    ],
  },
  {
    id: 'kallax',
    name: 'כוורת KALLAX 4×3 — IKEA',
    description:
      'יחידת מדפים KALLAX של IKEA, 12 תאים (4×3). כולל סלים מסרגה. מצב טוב.',
    price: 600,
    originalPrice: 1200,
    category: 'ריהוט',
    status: 'available',
    images: ['/moving-sale/kallax-1.png'],
    referenceUrl:
      'https://www.ikea.com/il/he/p/kallax-shelving-unit-with-4-inserts-white-s79278250/',
  },
  {
    id: 'alex-desk',
    name: 'שולחן עבודה עם 5 מגירות — IKEA',
    description:
      'ANFALLARE / ALEX של IKEA — משטח במבוק, יחידת ALEX עם 5 מגירות, 140×65 ס"מ. מצב חדש. 2 יחידות זמינות!',
    price: 500,
    originalPrice: 1000,
    category: 'ריהוט',
    status: 'available',
    images: ['/moving-sale/desk-alex-1.png'],
    referenceUrl: 'https://www.ikea.com/il/he/p/anfallare-alex-desk-bamboo-white-s59417742/',
  },
];

export function whatsAppLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function isReceiptImage(src: string) {
  return /receipt/i.test(src);
}

export function itemGalleryImages(item: MovingSaleItem): string[] {
  const raw = item.images?.length ? [...item.images] : item.image ? [item.image] : [];
  const photos = raw.filter((src) => !isReceiptImage(src));
  const receipts = raw.filter((src) => isReceiptImage(src));
  return [...photos, ...receipts];
}

export function itemCoverImage(item: MovingSaleItem): string | undefined {
  return itemGalleryImages(item).find((src) => !isReceiptImage(src));
}

export function itemWhatsAppText(item: MovingSaleItem) {
  const pricePart = item.price ? ` ב-₪${item.price.toLocaleString('he-IL')}` : '';
  return `היי! מעוניין/ת ב"${item.name}"${pricePart}`;
}
