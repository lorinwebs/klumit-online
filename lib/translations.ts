export type Language = 'he' | 'en' | 'ru';

export interface Translations {
  // Header
  'header.home': string;
  'header.bags': string;
  'header.belts': string;
  'header.wallets': string;
  'header.products': string;
  'header.about': string;
  'header.contact': string;
  'header.talkToUs': string;
  'header.cart': string;
  
  // Hero
  'hero.title': string;
  'hero.description': string;
  'hero.cta': string;
  'hero.newTag': string;
  
  // Value Props
  'value.customerService': string;
  'value.customerServiceDetail': string;
  'value.freeShipping': string;
  'value.freeShippingDetail': string;
  'value.physicalStore': string;
  'value.physicalStoreDetail': string;
  'value.italianLeather': string;
  'value.italianLeatherDetail': string;
  'value.securePayment': string;
  'value.securePaymentDetail': string;
  
  // Products
  'products.filter': string;
  'products.sort': string;
  'products.clear': string;
  'products.newest': string;
  'products.priceLowHigh': string;
  'products.priceHighLow': string;
  'products.newTag': string;
  'products.noProducts': string;
  'products.viewAll': string;
  'products.shopWallets': string;
  'products.shopBelts': string;
  'products.shopBags': string;
  'products.addToCart': string;
  'products.outOfStock': string;
  'products.addedToCart': string;
  'products.stockWarning': string;
  'products.stockLeft': string;
  'products.description': string;
  'products.related': string;
  'products.shareViaWhatsApp': string;
  'products.color': string;
  'products.size': string;
  'products.notifyWhenBack': string;
  'products.units': string;
  'products.zoomIn': string;
  'products.zoomOut': string;
  'products.close': string;
  'products.previousImage': string;
  'products.nextImage': string;
  'products.zoomInstructions': string;
  'products.wheelZoom': string;
  'products.dragMove': string;
  'products.noProductsInCategory': string;
  'products.resetFilters': string;
  'products.addToCartShort': string;
  'products.soldOut': string;
  'products.quickView': string;
  
  // Membership
  'membership.topBar': string;
  'membership.discount': string;
  
  // Footer
  'footer.brand': string;
  'footer.brandDesc': string;
  'footer.navigation': string;
  'footer.home': string;
  'footer.products': string;
  'footer.cart': string;
  'footer.myAccount': string;
  'footer.customerService': string;
  'footer.contact': string;
  'footer.about': string;
  'footer.shipping': string;
  'footer.returns': string;
  'footer.terms': string;
  'footer.privacy': string;
  'footer.accessibility': string;
  'footer.viewersNow': string;
  'footer.viewersOnSite': string;
  'footer.copyright': string;
  'footer.address': string;
  'footer.addressDetails': string;
  'footer.hours': string;
  'footer.hoursDetails': string;
  'footer.fax': string;
}

export const translations: Record<Language, Translations> = {
  he: {
    // Header
    'header.home': 'בית',
    'header.bags': 'תיקים',
    'header.belts': 'חגורות',
    'header.wallets': 'ארנקים',
    'header.products': 'מוצרים',
    'header.about': 'אודות',
    'header.contact': 'יצירת קשר',
    'header.talkToUs': 'דברו איתנו!',
    'header.cart': 'סל קניות',
    
    // Hero
    'hero.title': 'קולקציית 2026',
    'hero.description': 'תיקים יוקרתיים מעור איטלקי. עיצובים חדשים מ-RENATO ANGI ו-CARLINO GROUP',
    'hero.cta': 'הסיפור שלנו',
    'hero.newTag': 'נחתה באתר',
    
    // Value Props
    'value.customerService': 'שירות לקוחות',
    'value.customerServiceDetail': '054-990-3139 (וואטסאפ)',
    'value.freeShipping': 'משלוח חינם',
    'value.freeShippingDetail': 'בהזמנות מעל ₪500',
    'value.physicalStore': 'חנות פיזית',
    'value.physicalStoreDetail': 'גאולה 45, תל אביב',
    'value.italianLeather': 'עור איטלקי',
    'value.italianLeatherDetail': 'איכות פרימיום מ-1984',
    'value.securePayment': 'תשלום מאובטח',
    'value.securePaymentDetail': '100% הגנה על הפרטים',
    
    // Products
    'products.filter': 'סינון',
    'products.sort': 'מיון',
    'products.clear': 'נקה',
    'products.newest': 'חדשים ביותר',
    'products.priceLowHigh': 'מחיר: נמוך לגבוה',
    'products.priceHighLow': 'מחיר: גבוה לנמוך',
    'products.newTag': 'חדש!',
    'products.noProducts': 'לא נמצאו מוצרים',
    'products.viewAll': 'לכל הקולקציה',
    'products.shopWallets': 'SHOP WALLETS',
    'products.shopBelts': 'SHOP BELTS',
    'products.shopBags': 'SHOP BAGS',
    'products.addToCart': 'הוסף לסל',
    'products.outOfStock': 'אזל מהמלאי',
    'products.addedToCart': 'הוסף לעגלה',
    'products.stockWarning': 'נותרו רק',
    'products.stockLeft': 'יחידות במלאי',
    'products.description': 'תיאור',
    'products.related': 'מוצרים דומים',
    'products.shareViaWhatsApp': 'שתפו בוואטסאפ',
    'products.color': 'צבע',
    'products.size': 'גודל',
    'products.notifyWhenBack': 'הודיעו לי כשחוזר',
    'products.units': 'יחידות',
    'products.zoomIn': 'הגדל',
    'products.zoomOut': 'הקטן',
    'products.close': 'סגור',
    'products.previousImage': 'תמונה קודמת',
    'products.nextImage': 'תמונה הבאה',
    'products.zoomInstructions': 'לחץ + או - להגדלה/הקטנה',
    'products.wheelZoom': 'גלגל העכבר לזום',
    'products.dragMove': 'גרור להזזת התמונה',
    'products.noProductsInCategory': 'לא נמצאו מוצרים בקטגוריה זו',
    'products.resetFilters': 'נקה סינונים',
    'products.addToCartShort': 'הוספה לסל',
    'products.soldOut': 'אזל מהמלאי',
    'products.quickView': 'צפייה מהירה',
    
    // Membership
    'membership.topBar': 'הצטרפו למועדון הלקוחות ותקבלו',
    'membership.discount': '20%',
    
    // Footer
    'footer.brand': 'קלומית',
    'footer.brandDesc': 'יבואן בלעדי של תיקים יוקרתיים היישר מאיטליה',
    'footer.navigation': 'ניווט',
    'footer.home': 'בית',
    'footer.products': 'מוצרים',
    'footer.cart': 'עגלת קניות',
    'footer.myAccount': 'החשבון שלי',
    'footer.customerService': 'שירות לקוחות',
    'footer.contact': 'יצירת קשר',
    'footer.about': 'אודות',
    'footer.shipping': 'משלוחים',
    'footer.returns': 'החזרות',
    'footer.terms': 'תקנון',
    'footer.privacy': 'מדיניות פרטיות',
    'footer.accessibility': 'נגישות',
    'footer.viewersNow': 'צופים כעת',
    'footer.viewersOnSite': 'צופים באתר',
    'footer.copyright': 'כל הזכויות שמורות',
    'footer.address': 'כתובת:',
    'footer.addressDetails': 'גאולה 45, תל אביב יפו 6330447',
    'footer.hours': 'שעות פעילות',
    'footer.hoursDetails': 'א׳-ה׳: 10:00-17:00',
    'footer.fax': 'פקס:',
  },
  
  en: {
    // Header
    'header.home': 'Home',
    'header.bags': 'Bags',
    'header.belts': 'Belts',
    'header.wallets': 'Wallets',
    'header.products': 'Products',
    'header.about': 'About',
    'header.contact': 'Contact',
    'header.talkToUs': 'Talk to us!',
    'header.cart': 'Shopping Cart',
    
    // Hero
    'hero.title': '2026 Collection',
    'hero.description': 'Luxury bags made from Italian leather. New designs from RENATO ANGI and CARLINO GROUP',
    'hero.cta': 'Our Story',
    'hero.newTag': 'New Arrival',
    
    // Value Props
    'value.customerService': 'Customer Service',
    'value.customerServiceDetail': '054-990-3139 (WhatsApp)',
    'value.freeShipping': 'Free Shipping',
    'value.freeShippingDetail': 'On orders over ₪500',
    'value.physicalStore': 'Physical Store',
    'value.physicalStoreDetail': 'Geula 45, Tel Aviv',
    'value.italianLeather': 'Italian Leather',
    'value.italianLeatherDetail': 'Premium quality since 1984',
    'value.securePayment': 'Secure Payment',
    'value.securePaymentDetail': '100% Privacy Protection',
    
    // Products
    'products.filter': 'Filter',
    'products.sort': 'Sort',
    'products.clear': 'Clear',
    'products.newest': 'Newest',
    'products.priceLowHigh': 'Price: Low to High',
    'products.priceHighLow': 'Price: High to Low',
    'products.newTag': 'New!',
    'products.noProducts': 'No products found',
    'products.viewAll': 'View All Collection',
    'products.shopWallets': 'SHOP WALLETS',
    'products.shopBelts': 'SHOP BELTS',
    'products.shopBags': 'SHOP BAGS',
    'products.addToCart': 'Add to Cart',
    'products.outOfStock': 'Out of Stock',
    'products.addedToCart': 'Added to Cart',
    'products.stockWarning': 'Only',
    'products.stockLeft': 'left in stock',
    'products.description': 'Description',
    'products.related': 'Related Products',
    'products.shareViaWhatsApp': 'Share via WhatsApp',
    'products.color': 'Color',
    'products.size': 'Size',
    'products.notifyWhenBack': 'Notify me when back',
    'products.units': 'units',
    'products.zoomIn': 'Zoom In',
    'products.zoomOut': 'Zoom Out',
    'products.close': 'Close',
    'products.previousImage': 'Previous Image',
    'products.nextImage': 'Next Image',
    'products.zoomInstructions': 'Press + or - to zoom',
    'products.wheelZoom': 'Mouse wheel to zoom',
    'products.dragMove': 'Drag to move image',
    'products.noProductsInCategory': 'No products found in this category',
    'products.resetFilters': 'Reset Filters',
    'products.addToCartShort': 'Add to Cart',
    'products.soldOut': 'Sold Out',
    'products.quickView': 'Quick View',
    
    // Membership
    'membership.topBar': 'Join our customer club and get',
    'membership.discount': '20%',
    
    // Footer
    'footer.brand': 'Klumit',
    'footer.brandDesc': 'Exclusive importer of luxury bags from Italy',
    'footer.navigation': 'Navigation',
    'footer.home': 'Home',
    'footer.products': 'Products',
    'footer.cart': 'Shopping Cart',
    'footer.myAccount': 'My Account',
    'footer.customerService': 'Customer Service',
    'footer.contact': 'Contact',
    'footer.about': 'About',
    'footer.shipping': 'Shipping',
    'footer.returns': 'Returns',
    'footer.terms': 'Terms',
    'footer.privacy': 'Privacy Policy',
    'footer.accessibility': 'Accessibility',
    'footer.viewersNow': 'viewers now',
    'footer.viewersOnSite': 'viewing now',
    'footer.copyright': 'All rights reserved',
    'footer.address': 'Address:',
    'footer.addressDetails': '45 Geula St, Tel Aviv 6330447',
    'footer.hours': 'Opening Hours',
    'footer.hoursDetails': 'Sun-Thu: 10:00-17:00',
    'footer.fax': 'Fax:',
  },
  
  ru: {
    // Header
    'header.home': 'Главная',
    'header.bags': 'Сумки',
    'header.belts': 'Ремни',
    'header.wallets': 'Кошельки',
    'header.products': 'Товары',
    'header.about': 'О нас',
    'header.contact': 'Контакты',
    'header.talkToUs': 'Напишите нам!',
    'header.cart': 'Корзина',
    
    // Hero
    'hero.title': 'Коллекция 2026',
    'hero.description': 'Роскошные сумки из итальянской кожи. Новые дизайны от RENATO ANGI и CARLINO GROUP',
    'hero.cta': 'Наша история',
    'hero.newTag': 'Новое поступление',
    
    // Value Props
    'value.customerService': 'Служба поддержки',
    'value.customerServiceDetail': '054-990-3139 (WhatsApp)',
    'value.freeShipping': 'Бесплатная доставка',
    'value.freeShippingDetail': 'При заказе от ₪500',
    'value.physicalStore': 'Физический магазин',
    'value.physicalStoreDetail': 'Геула 45, Тель-Авив',
    'value.italianLeather': 'Итальянская кожа',
    'value.italianLeatherDetail': 'Премиум качество с 1984',
    'value.securePayment': 'Безопасная оплата',
    'value.securePaymentDetail': '100% защита данных',
    
    // Products
    'products.filter': 'Фильтр',
    'products.sort': 'Сортировка',
    'products.clear': 'Очистить',
    'products.newest': 'Новинки',
    'products.priceLowHigh': 'Цена: от низкой к высокой',
    'products.priceHighLow': 'Цена: от высокой к низкой',
    'products.newTag': 'Новинка!',
    'products.noProducts': 'Товары не найдены',
    'products.viewAll': 'Вся коллекция',
    'products.shopWallets': 'SHOP WALLETS',
    'products.shopBelts': 'SHOP BELTS',
    'products.shopBags': 'SHOP BAGS',
    'products.addToCart': 'Добавить в корзину',
    'products.outOfStock': 'Нет в наличии',
    'products.addedToCart': 'Добавлено в корзину',
    'products.stockWarning': 'Осталось только',
    'products.stockLeft': 'в наличии',
    'products.description': 'Описание',
    'products.related': 'Похожие товары',
    'products.shareViaWhatsApp': 'Поделиться в WhatsApp',
    'products.color': 'Цвет',
    'products.size': 'Размер',
    'products.notifyWhenBack': 'Сообщить о поступлении',
    'products.units': 'штук',
    'products.zoomIn': 'Увеличить',
    'products.zoomOut': 'Уменьшить',
    'products.close': 'Закрыть',
    'products.previousImage': 'Предыдущее фото',
    'products.nextImage': 'Следующее фото',
    'products.zoomInstructions': 'Нажмите + или - для увеличения',
    'products.wheelZoom': 'Колесико мыши для зума',
    'products.dragMove': 'Перетащите для перемещения',
    'products.noProductsInCategory': 'Товары в этой категории не найдены',
    'products.resetFilters': 'Сбросить фильтры',
    'products.addToCartShort': 'В корзину',
    'products.soldOut': 'Нет в наличии',
    'products.quickView': 'Быстрый просмотр',
    
    // Membership
    'membership.topBar': 'Присоединяйтесь к клубу клиентов и получите',
    'membership.discount': '20%',
    
    // Footer
    'footer.brand': 'Klumit',
    'footer.brandDesc': 'Эксклюзивный импортер роскошных сумок из Италии',
    'footer.navigation': 'Навигация',
    'footer.home': 'Главная',
    'footer.products': 'Товары',
    'footer.cart': 'Корзина',
    'footer.myAccount': 'Мой аккаунт',
    'footer.customerService': 'Служба поддержки',
    'footer.contact': 'Контакты',
    'footer.about': 'О нас',
    'footer.shipping': 'Доставка',
    'footer.returns': 'Возврат',
    'footer.terms': 'Условия',
    'footer.privacy': 'Конфиденциальность',
    'footer.accessibility': 'Доступность',
    'footer.viewersNow': 'просматривают',
    'footer.viewersOnSite': 'смотрят сейчас',
    'footer.copyright': 'Все права защищены',
    'footer.address': 'Адрес:',
    'footer.addressDetails': 'ул. Геула 45, Тель-Авив 6330447',
    'footer.hours': 'Часы работы',
    'footer.hoursDetails': 'Вс-Чт: 10:00-17:00',
    'footer.fax': 'Факс:',
  },
};

export function getTranslation(lang: Language, key: keyof Translations): string {
  return translations[lang][key];
}
