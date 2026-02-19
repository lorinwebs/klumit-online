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
  'products.addingToCart': string;
  'products.includingVAT': string;
  'products.inStock': string;
  'products.shippingAndReturns': string;
  'products.freeShippingOver': string;
  'products.shipping': string;
  'products.returns': string;
  'products.recommended': string;
  'products.complementaryCollection': string;
  'products.allProducts': string;
  
  // About Page
  'about.ourStory': string;
  'about.ourHeritage': string;
  'about.heritageText1': string;
  'about.heritageText2': string;
  'about.heritageText3': string;
  'about.image1Alt': string;
  'about.image1Caption': string;
  'about.image2Alt': string;
  'about.image2Caption': string;
  'about.image3Alt': string;
  'about.image3Caption': string;
  'about.exclusiveText': string;
  'about.collectionsText': string;
  'about.ourFamily': string;
  'about.whatMakesUsUnique': string;
  'about.whatMakesUsUniqueTitle': string;
  'about.brandSelection': string;
  'about.brandSelectionText': string;
  'about.fashionAlignment': string;
  'about.fashionAlignmentText': string;
  'about.serviceStandard': string;
  'about.serviceStandardText': string;
  'about.ourCommitment': string;
  'about.ourCommitmentTitle': string;
  'about.commitmentText': string;
  
  // Shipping Page
  'shipping.title': string;
  'shipping.deliveryTimes': string;
  'shipping.deliveryTimesText': string;
  'shipping.costs': string;
  'shipping.freeShippingOver': string;
  'shipping.homeDelivery': string;
  'shipping.tracking': string;
  'shipping.trackingText': string;
  'shipping.moreQuestions': string;
  'shipping.moreQuestionsText': string;
  
  // Returns Page
  'returns.title': string;
  'returns.intro': string;
  'returns.conditions': string;
  'returns.conditionsText': string;
  'returns.conditionNew': string;
  'returns.conditionTag': string;
  'returns.conditionInspection': string;
  'returns.cancellation': string;
  'returns.cancellationText': string;
  'returns.cancellationFee': string;
  'returns.cancellationProcessing': string;
  'returns.cancellationShipping': string;
  'returns.exchange': string;
  'returns.exchangeText': string;
  'returns.exchangeTime': string;
  'returns.exchangeSale': string;
  'returns.process': string;
  'returns.processNote': string;
  'returns.processWhatsApp': string;
  'returns.processOptions': string;
  'returns.processPhysical': string;
  'returns.processCourier': string;
  'returns.notes': string;
  'returns.noteMinPrice': string;
  'returns.noteAccessories': string;
  'returns.noteWarranty': string;
  
  // Terms Page
  'terms.title': string;
  'terms.introduction': string;
  'terms.introductionText': string;
  'terms.websiteUse': string;
  'terms.websiteUseText': string;
  'terms.websiteUseCopyright': string;
  'terms.websiteUseIllegal': string;
  'terms.websiteUseUnauthorized': string;
  'terms.orders': string;
  'terms.ordersText': string;
  'terms.ordersUnavailable': string;
  'terms.ordersPriceError': string;
  'terms.ordersTechnical': string;
  'terms.prices': string;
  'terms.pricesText': string;
  'terms.copyright': string;
  'terms.copyrightText': string;
  'terms.delivery': string;
  'terms.deliveryText': string;
  'terms.deliveryFree': string;
  'terms.deliveryHome': string;
  'terms.deliveryTracking': string;
  'terms.deliveryLink': string;
  'terms.ageLimit': string;
  'terms.ageLimitText': string;
  'terms.liability': string;
  'terms.liabilityText': string;
  'terms.liabilityDisclaimer': string;
  'terms.liabilityMisuse': string;
  'terms.liabilityDataLoss': string;
  'terms.liabilityTechnical': string;
  'terms.liabilityDelivery': string;
  'terms.liabilityWarranty': string;
  'terms.cancellation': string;
  'terms.cancellationText': string;
  'terms.cancellationProcess': string;
  'terms.cancellationRefund': string;
  'terms.cancellationShipping': string;
  'terms.cancellationLink': string;
  'terms.privacy': string;
  'terms.privacyText': string;
  'terms.privacyOrder': string;
  'terms.privacySupport': string;
  'terms.privacyUpdates': string;
  'terms.privacyImprove': string;
  'terms.privacyNoShare': string;
  'terms.privacySecure': string;
  'terms.privacyLink': string;
  'terms.changes': string;
  'terms.changesText': string;
  'terms.law': string;
  'terms.lawText': string;
  'terms.contact': string;
  'terms.contactText': string;
  'terms.companyName': string;
  'terms.address': string;
  'terms.phone': string;
  'terms.fax': string;
  'terms.email': string;
  
  // Privacy Page
  'privacy.title': string;
  'privacy.introduction': string;
  'privacy.introductionText': string;
  'privacy.lastUpdated': string;
  'privacy.whatWeCollect': string;
  'privacy.whatWeCollectText': string;
  'privacy.personalInfo': string;
  'privacy.paymentInfo': string;
  'privacy.technicalInfo': string;
  'privacy.usageInfo': string;
  'privacy.howWeUse': string;
  'privacy.howWeUseText': string;
  'privacy.useOrder': string;
  'privacy.useSupport': string;
  'privacy.useUpdates': string;
  'privacy.useImprove': string;
  'privacy.useSecurity': string;
  'privacy.sharing': string;
  'privacy.sharingText': string;
  'privacy.sharingLegal': string;
  'privacy.sharingConsent': string;
  'privacy.sharingServices': string;
  'privacy.sharingServicesText': string;
  'privacy.security': string;
  'privacy.securityText': string;
  'privacy.rights': string;
  'privacy.rightsText': string;
  'privacy.rightView': string;
  'privacy.rightCorrect': string;
  'privacy.rightDelete': string;
  'privacy.rightObject': string;
  'privacy.rightWithdraw': string;
  'privacy.rightsContact': string;
  'privacy.cookies': string;
  'privacy.cookiesText': string;
  'privacy.changes': string;
  'privacy.changesText': string;
  'privacy.contact': string;
  'privacy.contactText': string;
  'privacy.companyName': string;
  'privacy.address': string;
  'privacy.phone': string;
  'privacy.fax': string;
  'privacy.email': string;
  
  // Accessibility Page
  'accessibility.title': string;
  'accessibility.commitment': string;
  'accessibility.commitmentText': string;
  'accessibility.actions': string;
  'accessibility.actionKeyboard': string;
  'accessibility.actionScreenReader': string;
  'accessibility.actionAlt': string;
  'accessibility.actionHeadings': string;
  'accessibility.actionContrast': string;
  'accessibility.actionSkip': string;
  'accessibility.actionForms': string;
  'accessibility.actionErrors': string;
  'accessibility.keyboard': string;
  'accessibility.keyboardTab': string;
  'accessibility.keyboardShiftTab': string;
  'accessibility.keyboardEnter': string;
  'accessibility.keyboardEscape': string;
  'accessibility.browsers': string;
  'accessibility.browsersText': string;
  'accessibility.contact': string;
  'accessibility.contactText': string;
  'accessibility.contactEmail': string;
  'accessibility.contactPhone': string;
  'accessibility.update': string;
  'accessibility.updateText': string;
  
  // Product Details
  'products.technicalSpecs': string;
  'products.designDetails': string;
  'products.closureFit': string;
  'products.qualityFinish': string;
  'products.dimensions': string;
  
  // Membership
  'membership.topBar': string;
  'membership.discount': string;
  'membership.firstPurchase': string;
  
  // Accessibility Links
  'skipToMain': string;
  
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
  'footer.magazine': string;
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
    'products.shopWallets': 'כל הארנקים',
    'products.shopBelts': 'כל החגורות',
    'products.shopBags': 'כל התיקים',
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
    'products.addingToCart': 'נוסף לעגלה',
    'products.includingVAT': 'כולל מע״מ',
    'products.inStock': 'במלאי',
    'products.shippingAndReturns': 'משלוחים והחזרות',
    'products.freeShippingOver': 'משלוח חינם מעל 500 ₪ • החזרה תוך 14 ימים',
    'products.shipping': 'משלוחים',
    'products.returns': 'החזרות',
    'products.recommended': 'מומלץ',
    'products.complementaryCollection': 'הקולקציה המשלימה',
    'products.allProducts': 'לכל המוצרים',
    
    // About Page
    'about.ourStory': 'הסיפור שלנו',
    'about.ourHeritage': 'המורשת שלנו',
    'about.heritageText1': 'סיפורה של חברת "קלומית", בבעלות משה חייט, מתחיל לפני למעלה מ-40 שנה. כמי שצמח מתוך עולם האופנה הישראלי, זיהה משה את הצורך בחיבור בין הקהל המקומי לבין הסטנדרט הבינלאומי הגבוה ביותר – אומנות העור האיטלקית המסורתית.',
    'about.heritageText2': 'במהלך עשורים של פעילות, הפכה קלומית לאחת החברות הוותיקות והמוערכות בישראל בתחום ייבוא אביזרי האופנה. אנו מתמחים ביבוא של תיקים וארנקים ממותגים איטלקיים מובילים, מתוך אמונה שכל תיק הוא לא רק אביזר, אלא ביטוי של מורשת, איכות וסטייל אישי.',
    'about.heritageText3': 'הקולקציות שלנו משקפות את המסורת האיטלקית העתיקה, המשולבת עם עיצוב עכשווי ופונקציונלי. כל פריט שאנו מייבאים עובר בחירה קפדנית כדי להבטיח איכות ללא פשרות.',
    'about.image1Alt': 'משה חייט וללו קורילנו',
    'about.image1Caption': 'משה חייט וללו קורילנו, הנשיא של Carlino Group',
    'about.image2Alt': 'משה חייט',
    'about.image2Caption': 'משה חייט עם פליפו אנג\'י הבן של Renato Angi והמנהל בפועל של החברה',
    'about.image3Alt': 'משה חייט עם הבעלים של Renato Angi',
    'about.image3Caption': 'משה חייט עם רנטו האנגי הבעלים של Rento Angi',
    'about.exclusiveText': 'כיבואנים הבלעדיים בישראל של מותגי RENTAO ANGI ו-CARLINO GROUP, אנו מביאים אליכם את מיטב האומנות האיטלקית – תיקים יוקרתיים המגיעים היישר מאיטליה. כל פריט משלב עיצוב אלגנטי וקלאסי, עור איטלקי משובח ואיכות ללא פשרות.',
    'about.collectionsText': 'הקולקציות שלנו משקפות את המסורת האיטלקית העתיקה, המשולבת עם עיצוב עכשווי ופונקציונלי. כל פריט שאנו מייבאים עובר בחירה קפדנית כדי להבטיח איכות ללא פשרות.',
    'about.ourFamily': 'המשפחה שלנו, התיק שלכם',
    'about.whatMakesUsUnique': 'מה שמייחד אותנו',
    'about.whatMakesUsUniqueTitle': 'מה שמייחד אותנו',
    'about.brandSelection': 'נבחרת מותגים',
    'about.brandSelectionText': 'ייצוג בלעדי של בתי אופנה איטלקיים מובילים כמו RENATO ANGI ו-CARLINO GROUP.',
    'about.fashionAlignment': 'התאמה לצו האופנה',
    'about.fashionAlignmentText': 'עדכון מתמיד של הקולקציות בהתאם למגמות הבינלאומיות, תוך שמירה על עיצוב קלאסי על-זמני.',
    'about.serviceStandard': 'סטנדרט שירות',
    'about.serviceStandardText': 'הפצה רחבה לחנויות בוטיק ויוקרה, המבוססת על מקצועיות ואמינות ללא פשרות.',
    'about.ourCommitment': 'המחויבות שלנו',
    'about.ourCommitmentTitle': 'המחויבות שלנו',
    'about.commitmentText': 'אנו מתחייבים להעניק לך חווית קנייה יוצאת דופן ותיק שילווה אותך שנים רבות. כל תיק שאנו מייבאים הוא ביטוי לאהבתנו לאומנות העור ולמסורת האיטלקית המפוארת.',
    
    // Shipping Page
    'shipping.title': 'משלוחים',
    'shipping.deliveryTimes': 'זמני משלוח',
    'shipping.deliveryTimesText': 'משלוח עד הבית תוך 2-5 ימי עסקים מרגע אישור ההזמנה.',
    'shipping.costs': 'עלויות משלוח',
    'shipping.freeShippingOver': 'משלוח חינם להזמנות מעל ₪500',
    'shipping.homeDelivery': 'משלוח עד הבית:',
    'shipping.tracking': 'מעקב אחר משלוח',
    'shipping.trackingText': 'לאחר ביצוע ההזמנה, תקבלו אימייל עם מספר מעקב. תוכלו לעקוב אחר סטטוס המשלוח דרך הקישור באימייל או באזור האישי שלכם.',
    'shipping.moreQuestions': 'שאלות נוספות',
    'shipping.moreQuestionsText': 'לשאלות בנושא משלוחים, צרו קשר בוואטסאפ:',
    
    // Returns Page
    'returns.title': 'מדיניות החזרות והחלפות',
    'returns.intro': 'אתר "קלומית" עושה הכל כדי שתהיי מרוצה מהרכישה. עם זאת, במידה ואת מעוניינת לבצע שינוי בהזמנה, להלן המדיניות הרשמית של האתר הפועלת על פי חוק הגנת הצרכן:',
    'returns.conditions': 'תנאי סף לביצוע החלפה או החזרה',
    'returns.conditionsText': 'כל בקשה להחלפה או החזרה תיבחן אך ורק אם המוצר עומד בתנאים הבאים:',
    'returns.conditionNew': 'המוצר חדש לחלוטין, לא נעשה בו כל שימוש, לא נפגם והוא נמצא באריזתו המקורית.',
    'returns.conditionTag': 'התווית המקורית מחוברת למוצר ולא הוסרה.',
    'returns.conditionInspection': 'בדיקת תקינות: כל פריט המוחזר עובר בדיקה קפדנית. מוצר שיגיע עם ריח של בושם, סיגריות, סימני איפור או ללא אריזתו המקורית (כולל מגני פלסטיק על אבזמים במידה והיו) – לא יתקבל. במקרה כזה, המוצר יישלח בחזרה ללקוחה והיא תישא בעלות המשלוח.',
    'returns.cancellation': 'ביטול עסקה והחזר כספי (המסלול היקר)',
    'returns.cancellationText': 'ביטול עסקה לקבלת החזר כספי יתאפשר בתוך 14 ימים מיום קבלת המוצר, בכפוף לניכויים הבאים:',
    'returns.cancellationFee': 'דמי ביטול: בהתאם לחוק, ינוכו דמי ביטול בשיעור של 5% ממחיר המוצר או 100 ש"ח – הנמוך מביניהם.',
    'returns.cancellationProcessing': 'דמי סליקה: במידה והעסקה בוצעה בכרטיס אשראי, ינוכו בנוסף דמי סליקת האשראי שנגבו מהחברה בגין העסקה (בשיעור של עד 2.5%).',
    'returns.cancellationShipping': 'עלויות שילוח: דמי המשלוח המקוריים (ככל ששולמו) אינם מוחזרים. עלות השילוח חזרה למחסני החברה חלה על הלקוחה בלבד.',
    'returns.exchange': 'החלפת פריט או קבלת שובר זיכוי (המסלול המשתלם)',
    'returns.exchangeText': 'כדי להימנע מתשלום דמי ביטול ועמלות סליקה, אנו מאפשרים להחליף את הפריט או לקבל שובר זיכוי (Credit) לרכישה עתידית באתר בשווי מלא של המוצר (ללא ניכוי דמי ביטול).',
    'returns.exchangeTime': 'החלפה/זיכוי יתאפשר בתוך 14 יום ממועד קבלת הפריט.',
    'returns.exchangeSale': 'על פריטים שנרכשו במבצעי סוף עונה (Sale) או ב-Outlet, תינתן אפשרות להחלפה/זיכוי בתוך יומיים (48 שעות) בלבד ממועד קבלתם.',
    'returns.process': 'אופן ביצוע הפעולה',
    'returns.processNote': 'שימי לב: לא תתקבל כל החזרה או החלפה ללא תיאום מראש מול שירות הלקוחות.',
    'returns.processWhatsApp': 'יש לפנות לשירות הלקוחות בווטסאפ למספר: 054-990-3139 (וואטסאפ) לצורך פתיחת בקשה וקבלת אישור.',
    'returns.processOptions': 'אפשרויות החזרה/החלפה לאחר אישור:',
    'returns.processPhysical': 'הגעה פיזית: הגעה ל-Showroom שלנו ברחוב גאולה 45, תל אביב, בתיאום מראש בלבד.',
    'returns.processCourier': 'שירות שליחים: ניתן לתאם שליח שיאסוף ממך את הפריט בעלות של 29.90 ש"ח (עלות זו לא תוחזר ותקוזז מהזיכוי/ההחזר).',
    'returns.notes': 'דגשים נוספים',
    'returns.noteMinPrice': 'אין החזר כספי על מוצר שערכו נמוך מ-50 ש"ח.',
    'returns.noteAccessories': 'אביזרים שהוצאו מאריזתם אינם ניתנים להחזרה.',
    'returns.noteWarranty': 'אין אחריות על איבוד/נפילה של אבנים, ניטים או אבזמים דקורטיביים לאחר השימוש במוצר.',
    
    // Terms Page
    'terms.title': 'תקנון',
    'terms.introduction': 'הקדמה',
    'terms.introductionText': 'ברוכים הבאים לאתר קלומית. השימוש באתר זה כפוף לתנאים המפורטים להלן. שימוש באתר מהווה הסכמה מלאה לתנאים אלה.',
    'terms.websiteUse': 'שימוש באתר',
    'terms.websiteUseText': 'אתם מתחייבים להשתמש באתר למטרות חוקיות בלבד ולא:',
    'terms.websiteUseCopyright': 'להפר זכויות יוצרים או זכויות קניין רוחני אחרות',
    'terms.websiteUseIllegal': 'להעלות או להפיץ תוכן מזיק, פוגעני או בלתי חוקי',
    'terms.websiteUseUnauthorized': 'לנסות לגשת לאזורים מוגנים באתר ללא הרשאה',
    'terms.orders': 'הזמנות ותשלומים',
    'terms.ordersText': 'כל הזמנה באתר כפופה לאישור שלנו. אנו שומרים לעצמנו את הזכות לבטל הזמנה בכל עת, כולל במקרים של:',
    'terms.ordersUnavailable': 'חוסר זמינות של המוצר',
    'terms.ordersPriceError': 'שגיאה במחיר המוצר',
    'terms.ordersTechnical': 'בעיות טכניות או אבטחה',
    'terms.prices': 'מחירים',
    'terms.pricesText': 'כל המחירים באתר מצוינים בשקלים חדשים (₪) וכוללים מע"מ, אלא אם צוין אחרת. אנו שומרים לעצמנו את הזכות לשנות מחירים בכל עת ללא הודעה מוקדמת.',
    'terms.copyright': 'זכויות יוצרים',
    'terms.copyrightText': 'כל התוכן באתר, כולל טקסטים, תמונות, לוגואים ועיצוב, מוגן בזכויות יוצרים וקניין רוחני. אסור להעתיק, לשכפל או להשתמש בתוכן ללא רשות מפורשת בכתב.',
    'terms.delivery': 'מדיניות אספקת המוצר/שירות',
    'terms.deliveryText': 'המוצרים יישלחו ללקוח באמצעות חברת שליחויות מוכרת. זמן המשלוח המקסימלי מהרגע שבו בוצעה הרכישה ועד הגעת המוצר ליעד הוא עד 14 ימי עסקים.',
    'terms.deliveryFree': 'משלוח חינם מוצע להזמנות מעל 500 ₪. משלוח עד הבית עולה 39 ₪ ומגיע תוך 2-5 ימי עסקים.',
    'terms.deliveryHome': 'משלוח עד הבית',
    'terms.deliveryTracking': 'לאחר ביצוע ההזמנה, תקבלו אימייל עם מספר מעקב למעקב אחר סטטוס המשלוח.',
    'terms.deliveryLink': 'לפרטים נוספים, עיינו בעמוד משלוחים.',
    'terms.ageLimit': 'הגבלת גיל',
    'terms.ageLimitText': 'רכישה באשראי באתר זה מותרת רק למי שגילו 18 שנים ומעלה. בעת ביצוע רכישה, אתם מאשרים כי גילכם הוא 18 שנים ומעלה וכי יש לכם את הזכות החוקית לבצע את הרכישה. אנו שומרים לעצמנו את הזכות לבטל הזמנות אם יתברר שהרוכש אינו עומד בדרישות הגיל.',
    'terms.liability': 'אחריות בית העסק',
    'terms.liabilityText': 'אנו עושים כמיטב יכולתנו להציג מידע מדויק על המוצרים. עם זאת, איננו אחראים לשגיאות או אי-דיוקים במידע המוצג באתר.',
    'terms.liabilityDisclaimer': 'החברה ו/או מי מטעמה לא יהיו אחראים לכל נזק ישיר ו/או עקיף שיגרם כתוצאה משימוש בשירות ו/או שימוש במוצר שנרכש באתר, לרבות אך לא רק:',
    'terms.liabilityMisuse': 'נזקים הנובעים משימוש לא תקין במוצר',
    'terms.liabilityDataLoss': 'נזקים הנובעים מאובדן מידע או נתונים',
    'terms.liabilityTechnical': 'נזקים הנובעים מבעיות טכניות או תקלות באתר',
    'terms.liabilityDelivery': 'נזקים הנובעים מעיכובים במשלוח או אובדן משלוח',
    'terms.liabilityWarranty': 'האחריות על המוצרים מוגבלת לתקופת האחריות שצוינה על ידי היצרן בלבד.',
    'terms.cancellation': 'תנאים לביטול עסקה',
    'terms.cancellationText': 'ביטול עסקה יתבצע על-פי חוק הגנת הצרכן, התשמ"א-1981. ניתן לבטל עסקה בתוך 14 ימים מיום קבלת המוצר או מיום ביצוע הרכישה, לפי המאוחר מביניהם.',
    'terms.cancellationProcess': 'על מנת לבטל עסקה, יש לשלוח הודעה בכתב (במייל או בדואר) לחברה. המוצר חייב להיות במצבו המקורי, ללא שימוש, עם כל התוויות והאריזה המקורית.',
    'terms.cancellationRefund': 'לאחר ביטול העסקה, החברה תחזיר ללקוח את סכום התשלום בתוך 14 ימים מיום קבלת המוצר בחזרה או מיום קבלת ההודעה על הביטול, לפי המאוחר מביניהם.',
    'terms.cancellationShipping': 'עלויות המשלוח לא יוחזרו ללקוח, אלא אם בוטלה העסקה מסיבה הקשורה לחברה.',
    'terms.cancellationLink': 'לפרטים נוספים, עיינו בעמוד החזרות.',
    'terms.privacy': 'מדיניות פרטיות',
    'terms.privacyText': 'הגנת הפרטיות שלכם חשובה לנו. כל המידע שאתם מספקים לנו נשמר בצורה מאובטחת ומשמש רק למטרות הבאות:',
    'terms.privacyOrder': 'ביצוע והשלמת הזמנות',
    'terms.privacySupport': 'שירות לקוחות ותמיכה',
    'terms.privacyUpdates': 'שליחת עדכונים והזמנות (רק אם הסכמתם לכך)',
    'terms.privacyImprove': 'שיפור החוויה באתר',
    'terms.privacyNoShare': 'אנו לא נמכור, נשכיר או נשתף את המידע האישי שלכם עם צדדים שלישיים למטרות שיווקיות, אלא אם נדרש לעשות כן על פי חוק או אם קיבלנו את הסכמתכם המפורשת.',
    'terms.privacySecure': 'המידע נשמר במערכות מאובטחות ומוגנות.',
    'terms.privacyLink': 'לפרטים נוספים, עיינו במדיניות הפרטיות המלאה שלנו.',
    'terms.changes': 'שינויים בתקנון',
    'terms.changesText': 'אנו שומרים לעצמנו את הזכות לעדכן את התקנון בכל עת. שינויים ייכנסו לתוקף מייד עם פרסומם באתר. מומלץ לעיין בתקנון מעת לעת.',
    'terms.law': 'דין שולט',
    'terms.lawText': 'תקנון זה כפוף לחוקי מדינת ישראל. כל סכסוך הנובע משימוש באתר ייפתר בפני בתי המשפט המוסמכים בישראל.',
    'terms.contact': 'יצירת קשר',
    'terms.contactText': 'לשאלות או הבהרות בנוגע לתקנון זה, אנא צרו קשר עם שירות הלקוחות שלנו:',
    'terms.companyName': 'קלומית',
    'terms.address': 'כתובת: גאולה 45, תל אביב יפו 6330447',
    'terms.phone': 'טלפון: 03-5178502',
    'terms.fax': 'פקס: 03-5106781',
    'terms.email': 'אימייל: klumitltd@gmail.com',
    
    // Privacy Page
    'privacy.title': 'מדיניות פרטיות',
    'privacy.introduction': 'הקדמה',
    'privacy.introductionText': 'קלומית מתחייבת להגן על הפרטיות שלכם. מדיניות פרטיות זו מסבירה כיצד אנו אוספים, משתמשים, מגנים ומשתפים את המידע האישי שלכם בעת שימוש באתר שלנו.',
    'privacy.lastUpdated': 'עדכון אחרון',
    'privacy.whatWeCollect': 'איזה מידע אנו אוספים',
    'privacy.whatWeCollectText': 'אנו אוספים את המידע הבא:',
    'privacy.personalInfo': 'מידע אישי: שם, כתובת אימייל, מספר טלפון, כתובת משלוח',
    'privacy.paymentInfo': 'מידע תשלום: פרטי תשלום מועברים דרך Grow-il המאובטחים',
    'privacy.technicalInfo': 'מידע טכני: כתובת IP, סוג דפדפן, מערכת הפעלה, דפים שביקרת בהם',
    'privacy.usageInfo': 'מידע שימוש: כיצד אתה משתמש באתר, מוצרים שאתה צופה בהם',
    'privacy.howWeUse': 'כיצד אנו משתמשים במידע',
    'privacy.howWeUseText': 'אנו משתמשים במידע האישי שלכם למטרות הבאות:',
    'privacy.useOrder': 'ביצוע והשלמת הזמנות',
    'privacy.useSupport': 'שירות לקוחות ותמיכה',
    'privacy.useUpdates': 'שליחת עדכונים והזמנות (רק אם הסכמתם לכך)',
    'privacy.useImprove': 'שיפור החוויה באתר ושירות הלקוחות',
    'privacy.useSecurity': 'מניעת הונאות ואבטחת האתר',
    'privacy.sharing': 'שיתוף מידע עם צדדים שלישיים',
    'privacy.sharingText': 'אנו לא נמכור, נשכיר או נשתף את המידע האישי שלכם עם צדדים שלישיים למטרות שיווקיות, אלא אם:',
    'privacy.sharingLegal': 'נדרש לעשות כן על פי חוק או צו בית משפט',
    'privacy.sharingConsent': 'קיבלנו את הסכמתכם המפורשת',
    'privacy.sharingServices': 'המידע נדרש לספק שירותים חיוניים (כמו חברות משלוחים או מערכות תשלום מאובטחות)',
    'privacy.sharingServicesText': 'אנו משתמשים בשירותים של Shopify לאחסון נתונים, Grow-il לתשלומים, ו-Supabase לאימות משתמשים. כל השירותים הללו עומדים בתקני אבטחה מחמירים.',
    'privacy.security': 'אבטחת מידע',
    'privacy.securityText': 'אנו נוקטים באמצעי אבטחה טכנולוגיים וארגוניים מתקדמים כדי להגן על המידע האישי שלכם מפני גישה לא מורשית, שימוש לרעה, שינוי או הרס. המידע נשמר במערכות מאובטחות ומוגנות, והגישה אליו מוגבלת לעובדים מורשים בלבד.',
    'privacy.rights': 'זכויותיכם',
    'privacy.rightsText': 'יש לכם זכויות הבאות ביחס למידע האישי שלכם:',
    'privacy.rightView': 'זכות לעיין במידע האישי שלכם',
    'privacy.rightCorrect': 'זכות לתקן מידע שגוי או לא מעודכן',
    'privacy.rightDelete': 'זכות למחוק את המידע האישי שלכם (בכפוף למגבלות חוקיות)',
    'privacy.rightObject': 'זכות להתנגד לעיבוד המידע האישי שלכם',
    'privacy.rightWithdraw': 'זכות לבטל הסכמה לשימוש במידע למטרות שיווקיות',
    'privacy.rightsContact': 'כדי לממש את זכויותיכם, אנא צרו קשר עם שירות הלקוחות שלנו.',
    'privacy.cookies': 'עוגיות (Cookies)',
    'privacy.cookiesText': 'האתר שלנו משתמש בעוגיות כדי לשפר את החוויה שלכם. עוגיות הן קבצים קטנים שנשמרים במחשב שלכם ומסייעים לנו לזכור את ההעדפות שלכם ולשפר את הביצועים של האתר. תוכלו להגדיר את הדפדפן שלכם לדחות עוגיות, אך זה עלול להשפיע על הפונקציונליות של האתר.',
    'privacy.changes': 'שינויים במדיניות הפרטיות',
    'privacy.changesText': 'אנו שומרים לעצמנו את הזכות לעדכן את מדיניות הפרטיות בכל עת. שינויים ייכנסו לתוקף מייד עם פרסומם באתר. מומלץ לעיין במדיניות הפרטיות מעת לעת כדי להישאר מעודכנים.',
    'privacy.contact': 'יצירת קשר',
    'privacy.contactText': 'לשאלות או בקשות בנוגע למדיניות הפרטיות או למימוש זכויותיכם, אנא צרו קשר עם שירות הלקוחות שלנו:',
    'privacy.companyName': 'קלומית',
    'privacy.address': 'כתובת: גאולה 45, תל אביב יפו 6330447',
    'privacy.phone': 'טלפון: 03-5178502',
    'privacy.fax': 'פקס: 03-5106781',
    'privacy.email': 'אימייל: klumitltd@gmail.com',
    
    // Accessibility Page
    'accessibility.title': 'הצהרת נגישות',
    'accessibility.commitment': 'המחויבות שלנו לנגישות',
    'accessibility.commitmentText': 'קלומית בע"מ מחויבת להנגשת האתר לאנשים עם מוגבלויות, ופועלת להתאמתו לדרישות התקן הישראלי (ת"י 5568) ולהנחיות WCAG 2.1 ברמה AA.',
    'accessibility.actions': 'פעולות הנגשה שבוצעו',
    'accessibility.actionKeyboard': 'התאמה לניווט באמצעות מקלדת בלבד',
    'accessibility.actionScreenReader': 'תמיכה בקוראי מסך ותוכנות עזר',
    'accessibility.actionAlt': 'הוספת תיאורים חלופיים (alt) לתמונות',
    'accessibility.actionHeadings': 'מבנה כותרות היררכי ונכון',
    'accessibility.actionContrast': 'ניגודיות צבעים מתאימה',
    'accessibility.actionSkip': 'אפשרות לדילוג ישיר לתוכן העמוד הראשי',
    'accessibility.actionForms': 'סימון שדות טפסים בצורה ברורה',
    'accessibility.actionErrors': 'הודעות שגיאה נגישות',
    'accessibility.keyboard': 'ניווט באמצעות מקלדת',
    'accessibility.keyboardTab': 'Tab - מעבר לאלמנט הבא',
    'accessibility.keyboardShiftTab': 'Shift + Tab - מעבר לאלמנט הקודם',
    'accessibility.keyboardEnter': 'Enter - הפעלת קישור או כפתור',
    'accessibility.keyboardEscape': 'Escape - סגירת חלונות קופצים',
    'accessibility.browsers': 'דפדפנים נתמכים',
    'accessibility.browsersText': 'האתר מותאם לגלישה בדפדפנים Chrome, Firefox, Safari ו-Edge בגרסאותיהם העדכניות.',
    'accessibility.contact': 'יצירת קשר בנושא נגישות',
    'accessibility.contactText': 'במידה ונתקלתם בבעיית נגישות או שיש לכם הצעות לשיפור, נשמח לשמוע מכם:',
    'accessibility.contactEmail': 'אימייל:',
    'accessibility.contactPhone': 'טלפון:',
    'accessibility.update': 'עדכון אחרון',
    'accessibility.updateText': 'הצהרת נגישות זו עודכנה לאחרונה בתאריך: ינואר 2026',
    
    // Product Details
    'products.technicalSpecs': 'מפרט טכני',
    'products.designDetails': 'עיצוב ופרטים',
    'products.closureFit': 'סגירה והתאמה',
    'products.qualityFinish': 'איכות וגימור',
    'products.dimensions': 'מידות',
    
    // Membership
    'membership.topBar': 'הצטרפו למועדון הלקוחות ותקבלו',
    'membership.discount': '20%',
    'membership.firstPurchase': 'בקניה ראשונה!',
    
    // Accessibility Links
    'skipToMain': 'דלג לתוכן הראשי',
    
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
    'footer.magazine': 'המגזין',
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
    'products.addingToCart': 'Adding to Cart',
    'products.includingVAT': 'Including VAT',
    'products.inStock': 'In Stock',
    'products.shippingAndReturns': 'Shipping & Returns',
    'products.freeShippingOver': 'Free shipping over ₪500 • Returns within 14 days',
    'products.shipping': 'Shipping',
    'products.returns': 'Returns',
    'products.recommended': 'Recommended',
    'products.complementaryCollection': 'Complementary Collection',
    'products.allProducts': 'All Products',
    
    // About Page
    'about.ourStory': 'Our Story',
    'about.ourHeritage': 'Our Heritage',
    'about.heritageText1': 'The story of Klumit, owned by Moshe Hayat, begins over 40 years ago. Having grown from the Israeli fashion world, Moshe recognized the need to connect the local audience with the highest international standard – traditional Italian leather craftsmanship.',
    'about.heritageText2': 'Over decades of activity, Klumit has become one of the oldest and most respected companies in Israel in the field of fashion accessories import. We specialize in importing bags and wallets from leading Italian brands, believing that every bag is not just an accessory, but an expression of heritage, quality, and personal style.',
    'about.heritageText3': 'Our collections reflect the ancient Italian tradition, combined with contemporary and functional design. Every item we import undergoes careful selection to ensure uncompromising quality.',
    'about.image1Alt': 'Moshe Hayat and Lelo Corilano',
    'about.image1Caption': 'Moshe Hayat and Lelo Corilano, President of Carlino Group',
    'about.image2Alt': 'Moshe Hayat',
    'about.image2Caption': 'Moshe Hayat with Filippo Angi, son of Renato Angi and acting manager of the company',
    'about.image3Alt': 'Moshe Hayat with the owner of Renato Angi',
    'about.image3Caption': 'Moshe Hayat with Renato Angi, owner of Renato Angi',
    'about.exclusiveText': 'As exclusive importers in Israel of RENATO ANGI and CARLINO GROUP brands, we bring you the finest Italian craftsmanship – luxury bags that come directly from Italy. Each item combines elegant and classic design, premium Italian leather, and uncompromising quality.',
    'about.collectionsText': 'Our collections reflect the ancient Italian tradition, combined with contemporary and functional design. Every item we import undergoes careful selection to ensure uncompromising quality.',
    'about.ourFamily': 'Our Family, Your Bag',
    'about.whatMakesUsUnique': 'What Makes Us Unique',
    'about.whatMakesUsUniqueTitle': 'What Makes Us Unique',
    'about.brandSelection': 'Brand Selection',
    'about.brandSelectionText': 'Exclusive representation of leading Italian fashion houses such as RENATO ANGI and CARLINO GROUP.',
    'about.fashionAlignment': 'Fashion Alignment',
    'about.fashionAlignmentText': 'Constant updating of collections according to international trends, while maintaining timeless classic design.',
    'about.serviceStandard': 'Service Standard',
    'about.serviceStandardText': 'Extensive distribution to boutique and luxury stores, based on professionalism and uncompromising reliability.',
    'about.ourCommitment': 'Our Commitment',
    'about.ourCommitmentTitle': 'Our Commitment',
    'about.commitmentText': 'We are committed to providing you with an exceptional shopping experience and a bag that will accompany you for many years. Every bag we import is an expression of our love for leather craftsmanship and the glorious Italian tradition.',
    
    // Shipping Page
    'shipping.title': 'Shipping',
    'shipping.deliveryTimes': 'Delivery Times',
    'shipping.deliveryTimesText': 'Home delivery within 2-5 business days from order confirmation.',
    'shipping.costs': 'Shipping Costs',
    'shipping.freeShippingOver': 'Free shipping for orders over ₪500',
    'shipping.homeDelivery': 'Home Delivery:',
    'shipping.tracking': 'Track Your Shipment',
    'shipping.trackingText': 'After placing your order, you will receive an email with a tracking number. You can track the shipment status via the link in the email or in your personal area.',
    'shipping.moreQuestions': 'More Questions',
    'shipping.moreQuestionsText': 'For shipping questions, contact us on WhatsApp:',
    
    // Returns Page
    'returns.title': 'Returns & Exchanges Policy',
    'returns.intro': 'Klumit website does everything to ensure your satisfaction with your purchase. However, if you wish to make changes to your order, here is the official website policy operating according to the Consumer Protection Law:',
    'returns.conditions': 'Conditions for Exchange or Return',
    'returns.conditionsText': 'Any request for exchange or return will only be considered if the product meets the following conditions:',
    'returns.conditionNew': 'The product is completely new, unused, undamaged, and in its original packaging.',
    'returns.conditionTag': 'The original tag is attached to the product and has not been removed.',
    'returns.conditionInspection': 'Quality inspection: Every returned item undergoes a thorough inspection. A product that arrives with perfume smell, cigarette smell, makeup marks, or without its original packaging (including plastic protectors on clasps if they existed) will not be accepted. In such a case, the product will be sent back to the customer, who will bear the shipping costs.',
    'returns.cancellation': 'Transaction Cancellation and Refund (Expensive Route)',
    'returns.cancellationText': 'Transaction cancellation for a refund will be possible within 14 days of receiving the product, subject to the following deductions:',
    'returns.cancellationFee': 'Cancellation fee: According to the law, a cancellation fee of 5% of the product price or ₪100 – whichever is lower – will be deducted.',
    'returns.cancellationProcessing': 'Processing fee: If the transaction was made with a credit card, credit card processing fees charged to the company for the transaction (up to 2.5%) will also be deducted.',
    'returns.cancellationShipping': 'Shipping costs: Original shipping fees (if paid) are not refunded. The cost of shipping back to the company warehouse is borne solely by the customer.',
    'returns.exchange': 'Item Exchange or Credit Voucher (Beneficial Route)',
    'returns.exchangeText': 'To avoid cancellation fees and processing charges, we allow exchanging the item or receiving a credit voucher (Credit) for future purchases on the website for the full value of the product (without cancellation fee deduction).',
    'returns.exchangeTime': 'Exchange/credit will be possible within 14 days of receiving the item.',
    'returns.exchangeSale': 'For items purchased during end-of-season sales (Sale) or at the Outlet, exchange/credit will only be available within two days (48 hours) of receipt.',
    'returns.process': 'How to Proceed',
    'returns.processNote': 'Please note: No return or exchange will be accepted without prior coordination with customer service.',
    'returns.processWhatsApp': 'Please contact customer service on WhatsApp at: 054-990-3139 (WhatsApp) to open a request and receive approval.',
    'returns.processOptions': 'Return/exchange options after approval:',
    'returns.processPhysical': 'Physical visit: Visit our Showroom at Geula 45, Tel Aviv, by prior appointment only.',
    'returns.processCourier': 'Courier service: You can arrange for a courier to pick up the item from you at a cost of ₪29.90 (this cost will not be refunded and will be deducted from the credit/refund).',
    'returns.notes': 'Additional Notes',
    'returns.noteMinPrice': 'No refund for products valued under ₪50.',
    'returns.noteAccessories': 'Accessories removed from their packaging are not returnable.',
    'returns.noteWarranty': 'No warranty for loss/falling of stones, studs, or decorative clasps after product use.',
    
    // Terms Page
    'terms.title': 'Terms & Conditions',
    'terms.introduction': 'Introduction',
    'terms.introductionText': 'Welcome to the Klumit website. Use of this website is subject to the terms set forth below. Use of the website constitutes full agreement to these terms.',
    'terms.websiteUse': 'Website Use',
    'terms.websiteUseText': 'You agree to use the website for lawful purposes only and not to:',
    'terms.websiteUseCopyright': 'Violate copyright or other intellectual property rights',
    'terms.websiteUseIllegal': 'Upload or distribute harmful, offensive, or illegal content',
    'terms.websiteUseUnauthorized': 'Attempt to access protected areas of the website without authorization',
    'terms.orders': 'Orders & Payments',
    'terms.ordersText': 'All orders on the website are subject to our approval. We reserve the right to cancel an order at any time, including in cases of:',
    'terms.ordersUnavailable': 'Product unavailability',
    'terms.ordersPriceError': 'Product price error',
    'terms.ordersTechnical': 'Technical or security issues',
    'terms.prices': 'Prices',
    'terms.pricesText': 'All prices on the website are stated in Israeli Shekels (₪) and include VAT, unless otherwise stated. We reserve the right to change prices at any time without prior notice.',
    'terms.copyright': 'Copyright',
    'terms.copyrightText': 'All content on the website, including texts, images, logos, and design, is protected by copyright and intellectual property. It is prohibited to copy, reproduce, or use content without explicit written permission.',
    'terms.delivery': 'Product/Service Delivery Policy',
    'terms.deliveryText': 'Products will be shipped to the customer via a recognized courier company. Maximum delivery time from purchase to product arrival at destination is up to 14 business days.',
    'terms.deliveryFree': 'Free shipping is offered for orders over ₪500. Home delivery costs ₪39 and arrives within 2-5 business days.',
    'terms.deliveryHome': 'Home Delivery',
    'terms.deliveryTracking': 'After placing your order, you will receive an email with a tracking number to track shipment status.',
    'terms.deliveryLink': 'For more details, see the shipping page.',
    'terms.ageLimit': 'Age Limit',
    'terms.ageLimitText': 'Credit purchases on this website are only permitted for those aged 18 and over. When making a purchase, you confirm that you are 18 years of age or older and that you have the legal right to make the purchase. We reserve the right to cancel orders if it turns out that the purchaser does not meet the age requirements.',
    'terms.liability': 'Business Liability',
    'terms.liabilityText': 'We do our best to present accurate information about products. However, we are not responsible for errors or inaccuracies in the information displayed on the website.',
    'terms.liabilityDisclaimer': 'The company and/or anyone on its behalf will not be liable for any direct and/or indirect damage caused as a result of using the service and/or using a product purchased on the website, including but not limited to:',
    'terms.liabilityMisuse': 'Damages resulting from improper use of the product',
    'terms.liabilityDataLoss': 'Damages resulting from loss of information or data',
    'terms.liabilityTechnical': 'Damages resulting from technical problems or malfunctions on the website',
    'terms.liabilityDelivery': 'Damages resulting from delivery delays or loss of shipment',
    'terms.liabilityWarranty': 'Product liability is limited to the warranty period specified by the manufacturer only.',
    'terms.cancellation': 'Transaction Cancellation Terms',
    'terms.cancellationText': 'Transaction cancellation will be carried out according to the Consumer Protection Law, 1981. A transaction can be cancelled within 14 days of receiving the product or making the purchase, whichever is later.',
    'terms.cancellationProcess': 'To cancel a transaction, a written notice (by email or mail) must be sent to the company. The product must be in its original condition, unused, with all original tags and packaging.',
    'terms.cancellationRefund': 'After transaction cancellation, the company will refund the customer the payment amount within 14 days of receiving the product back or receiving the cancellation notice, whichever is later.',
    'terms.cancellationShipping': 'Shipping costs will not be refunded to the customer, unless the transaction was cancelled for a company-related reason.',
    'terms.cancellationLink': 'For more details, see the returns page.',
    'terms.privacy': 'Privacy Policy',
    'terms.privacyText': 'Protecting your privacy is important to us. All information you provide to us is stored securely and used only for the following purposes:',
    'terms.privacyOrder': 'Processing and completing orders',
    'terms.privacySupport': 'Customer service and support',
    'terms.privacyUpdates': 'Sending updates and promotions (only if you have consented)',
    'terms.privacyImprove': 'Improving website experience',
    'terms.privacyNoShare': 'We will not sell, rent, or share your personal information with third parties for marketing purposes, unless required by law or if we have received your explicit consent.',
    'terms.privacySecure': 'Information is stored in secure and protected systems.',
    'terms.privacyLink': 'For more details, see our full privacy policy.',
    'terms.changes': 'Changes to Terms',
    'terms.changesText': 'We reserve the right to update the terms at any time. Changes will take effect immediately upon publication on the website. We recommend reviewing the terms periodically.',
    'terms.law': 'Governing Law',
    'terms.lawText': 'These terms are subject to the laws of the State of Israel. Any dispute arising from use of the website will be resolved in the competent courts of Israel.',
    'terms.contact': 'Contact',
    'terms.contactText': 'For questions or clarifications regarding these terms, please contact our customer service:',
    'terms.companyName': 'Klumit',
    'terms.address': 'Address: Geula 45, Tel Aviv Yafo 6330447',
    'terms.phone': 'Phone: 03-5178502',
    'terms.fax': 'Fax: 03-5106781',
    'terms.email': 'Email: klumitltd@gmail.com',
    
    // Privacy Page
    'privacy.title': 'Privacy Policy',
    'privacy.introduction': 'Introduction',
    'privacy.introductionText': 'Klumit is committed to protecting your privacy. This privacy policy explains how we collect, use, protect, and share your personal information when using our website.',
    'privacy.lastUpdated': 'Last Updated',
    'privacy.whatWeCollect': 'What Information We Collect',
    'privacy.whatWeCollectText': 'We collect the following information:',
    'privacy.personalInfo': 'Personal information: name, email address, phone number, shipping address',
    'privacy.paymentInfo': 'Payment information: payment details are processed through secure Grow-il',
    'privacy.technicalInfo': 'Technical information: IP address, browser type, operating system, pages visited',
    'privacy.usageInfo': 'Usage information: how you use the website, products you view',
    'privacy.howWeUse': 'How We Use Information',
    'privacy.howWeUseText': 'We use your personal information for the following purposes:',
    'privacy.useOrder': 'Processing and completing orders',
    'privacy.useSupport': 'Customer service and support',
    'privacy.useUpdates': 'Sending updates and promotions (only if you have consented)',
    'privacy.useImprove': 'Improving website experience and customer service',
    'privacy.useSecurity': 'Preventing fraud and securing the website',
    'privacy.sharing': 'Sharing Information with Third Parties',
    'privacy.sharingText': 'We will not sell, rent, or share your personal information with third parties for marketing purposes, unless:',
    'privacy.sharingLegal': 'Required by law or court order',
    'privacy.sharingConsent': 'We have received your explicit consent',
    'privacy.sharingServices': 'The information is required to provide essential services (such as shipping companies or secure payment systems)',
    'privacy.sharingServicesText': 'We use Shopify for data storage, Grow-il for payments, and Supabase for user authentication. All these services meet strict security standards.',
    'privacy.security': 'Information Security',
    'privacy.securityText': 'We employ advanced technological and organizational security measures to protect your personal information from unauthorized access, misuse, alteration, or destruction. Information is stored in secure and protected systems, and access is limited to authorized employees only.',
    'privacy.rights': 'Your Rights',
    'privacy.rightsText': 'You have the following rights regarding your personal information:',
    'privacy.rightView': 'Right to view your personal information',
    'privacy.rightCorrect': 'Right to correct inaccurate or outdated information',
    'privacy.rightDelete': 'Right to delete your personal information (subject to legal limitations)',
    'privacy.rightObject': 'Right to object to processing of your personal information',
    'privacy.rightWithdraw': 'Right to withdraw consent for use of information for marketing purposes',
    'privacy.rightsContact': 'To exercise your rights, please contact our customer service.',
    'privacy.cookies': 'Cookies',
    'privacy.cookiesText': 'Our website uses cookies to enhance your experience. Cookies are small files stored on your computer that help us remember your preferences and improve website performance. You can configure your browser to reject cookies, but this may affect website functionality.',
    'privacy.changes': 'Changes to Privacy Policy',
    'privacy.changesText': 'We reserve the right to update the privacy policy at any time. Changes will take effect immediately upon publication on the website. We recommend reviewing the privacy policy periodically to stay updated.',
    'privacy.contact': 'Contact',
    'privacy.contactText': 'For questions or requests regarding the privacy policy or exercising your rights, please contact our customer service:',
    'privacy.companyName': 'Klumit',
    'privacy.address': 'Address: Geula 45, Tel Aviv Yafo 6330447',
    'privacy.phone': 'Phone: 03-5178502',
    'privacy.fax': 'Fax: 03-5106781',
    'privacy.email': 'Email: klumitltd@gmail.com',
    
    // Accessibility Page
    'accessibility.title': 'Accessibility Statement',
    'accessibility.commitment': 'Our Commitment to Accessibility',
    'accessibility.commitmentText': 'Klumit Ltd. is committed to making the website accessible to people with disabilities and works to adapt it to the requirements of the Israeli standard (SI 5568) and WCAG 2.1 guidelines at level AA.',
    'accessibility.actions': 'Accessibility Actions Taken',
    'accessibility.actionKeyboard': 'Adaptation for keyboard-only navigation',
    'accessibility.actionScreenReader': 'Support for screen readers and assistive software',
    'accessibility.actionAlt': 'Adding alternative descriptions (alt) to images',
    'accessibility.actionHeadings': 'Proper hierarchical heading structure',
    'accessibility.actionContrast': 'Appropriate color contrast',
    'accessibility.actionSkip': 'Option to skip directly to main page content',
    'accessibility.actionForms': 'Clear form field labeling',
    'accessibility.actionErrors': 'Accessible error messages',
    'accessibility.keyboard': 'Keyboard Navigation',
    'accessibility.keyboardTab': 'Tab - Move to next element',
    'accessibility.keyboardShiftTab': 'Shift + Tab - Move to previous element',
    'accessibility.keyboardEnter': 'Enter - Activate link or button',
    'accessibility.keyboardEscape': 'Escape - Close pop-up windows',
    'accessibility.browsers': 'Supported Browsers',
    'accessibility.browsersText': 'The website is adapted for browsing on Chrome, Firefox, Safari, and Edge browsers in their latest versions.',
    'accessibility.contact': 'Accessibility Contact',
    'accessibility.contactText': 'If you encounter an accessibility issue or have suggestions for improvement, we would be happy to hear from you:',
    'accessibility.contactEmail': 'Email:',
    'accessibility.contactPhone': 'Phone:',
    'accessibility.update': 'Last Update',
    'accessibility.updateText': 'This accessibility statement was last updated on: January 2026',
    
    // Product Details
    'products.technicalSpecs': 'Technical Specifications',
    'products.designDetails': 'Design & Details',
    'products.closureFit': 'Closure & Fit',
    'products.qualityFinish': 'Quality & Finish',
    'products.dimensions': 'Dimensions',
    
    // Membership
    'membership.topBar': 'Join our customer club and get',
    'membership.discount': '20%',
    'membership.firstPurchase': 'on your first purchase!',
    
    // Accessibility Links
    'skipToMain': 'Skip to main content',
    
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
    'footer.magazine': 'Magazine',
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
    'products.shopWallets': 'ВСЕ КОШЕЛЬКИ',
    'products.shopBelts': 'ВСЕ РЕМНИ',
    'products.shopBags': 'ВСЕ СУМКИ',
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
    'products.addingToCart': 'Добавляется в корзину',
    'products.includingVAT': 'Включая НДС',
    'products.inStock': 'В наличии',
    'products.shippingAndReturns': 'Доставка и возврат',
    'products.freeShippingOver': 'Бесплатная доставка от ₪500 • Возврат в течение 14 дней',
    'products.shipping': 'Доставка',
    'products.returns': 'Возврат',
    'products.recommended': 'Рекомендуется',
    'products.complementaryCollection': 'Дополнительная коллекция',
    'products.allProducts': 'Все товары',
    
    // About Page
    'about.ourStory': 'Наша история',
    'about.ourHeritage': 'Наше наследие',
    'about.heritageText1': 'История компании "Klumit", принадлежащей Моше Хаяту, начинается более 40 лет назад. Выросший из израильского мира моды, Моше понял необходимость связи между местной аудиторией и высочайшим международным стандартом – традиционным итальянским мастерством работы с кожей.',
    'about.heritageText2': 'За десятилетия деятельности Klumit стала одной из старейших и самых уважаемых компаний в Израиле в области импорта модных аксессуаров. Мы специализируемся на импорте сумок и кошельков от ведущих итальянских брендов, веря, что каждая сумка – это не просто аксессуар, а выражение наследия, качества и личного стиля.',
    'about.heritageText3': 'Наши коллекции отражают древнюю итальянскую традицию, сочетающуюся с современным и функциональным дизайном. Каждый товар, который мы импортируем, проходит тщательный отбор, чтобы гарантировать бескомпромиссное качество.',
    'about.image1Alt': 'Моше Хаят и Лело Корилано',
    'about.image1Caption': 'Моше Хаят и Лело Корилано, президент Carlino Group',
    'about.image2Alt': 'Моше Хаят',
    'about.image2Caption': 'Моше Хаят с Филиппо Анджи, сыном Ренато Анджи и действующим менеджером компании',
    'about.image3Alt': 'Моше Хаят с владельцем Renato Angi',
    'about.image3Caption': 'Моше Хаят с Ренато Анджи, владельцем Renato Angi',
    'about.exclusiveText': 'Как эксклюзивные импортеры в Израиле брендов RENATO ANGI и CARLINO GROUP, мы привозим вам лучшее итальянское мастерство – роскошные сумки, которые приходят прямо из Италии. Каждый предмет сочетает элегантный и классический дизайн, премиальную итальянскую кожу и бескомпромиссное качество.',
    'about.collectionsText': 'Наши коллекции отражают древнюю итальянскую традицию, сочетающуюся с современным и функциональным дизайном. Каждый товар, который мы импортируем, проходит тщательный отбор, чтобы гарантировать бескомпромиссное качество.',
    'about.ourFamily': 'Наша семья, ваша сумка',
    'about.whatMakesUsUnique': 'Что нас отличает',
    'about.whatMakesUsUniqueTitle': 'Что нас отличает',
    'about.brandSelection': 'Выбор брендов',
    'about.brandSelectionText': 'Эксклюзивное представительство ведущих итальянских домов моды, таких как RENATO ANGI и CARLINO GROUP.',
    'about.fashionAlignment': 'Соответствие моде',
    'about.fashionAlignmentText': 'Постоянное обновление коллекций в соответствии с международными тенденциями, сохраняя вневременной классический дизайн.',
    'about.serviceStandard': 'Стандарт обслуживания',
    'about.serviceStandardText': 'Широкое распространение в бутиках и магазинах роскоши, основанное на профессионализме и бескомпромиссной надежности.',
    'about.ourCommitment': 'Наша приверженность',
    'about.ourCommitmentTitle': 'Наша приверженность',
    'about.commitmentText': 'Мы обязуемся предоставить вам исключительный опыт покупок и сумку, которая будет сопровождать вас долгие годы. Каждая сумка, которую мы импортируем, является выражением нашей любви к мастерству работы с кожей и славной итальянской традиции.',
    
    // Shipping Page
    'shipping.title': 'Доставка',
    'shipping.deliveryTimes': 'Сроки доставки',
    'shipping.deliveryTimesText': 'Доставка на дом в течение 2-5 рабочих дней с момента подтверждения заказа.',
    'shipping.costs': 'Стоимость доставки',
    'shipping.freeShippingOver': 'Бесплатная доставка для заказов свыше ₪500',
    'shipping.homeDelivery': 'Доставка на дом:',
    'shipping.tracking': 'Отслеживание доставки',
    'shipping.trackingText': 'После оформления заказа вы получите email с номером отслеживания. Вы можете отслеживать статус доставки по ссылке в email или в личном кабинете.',
    'shipping.moreQuestions': 'Дополнительные вопросы',
    'shipping.moreQuestionsText': 'По вопросам доставки свяжитесь с нами в WhatsApp:',
    
    // Returns Page
    'returns.title': 'Политика возврата и обмена',
    'returns.intro': 'Сайт "Klumit" делает все, чтобы вы были довольны покупкой. Однако, если вы хотите внести изменения в заказ, вот официальная политика сайта, действующая в соответствии с Законом о защите прав потребителей:',
    'returns.conditions': 'Условия для обмена или возврата',
    'returns.conditionsText': 'Любой запрос на обмен или возврат будет рассмотрен только в том случае, если товар соответствует следующим условиям:',
    'returns.conditionNew': 'Товар совершенно новый, не использовался, не поврежден и находится в оригинальной упаковке.',
    'returns.conditionTag': 'Оригинальная бирка прикреплена к товару и не была удалена.',
    'returns.conditionInspection': 'Проверка качества: каждый возвращенный товар проходит тщательную проверку. Товар, который прибывает с запахом духов, сигарет, следами макияжа или без оригинальной упаковки (включая пластиковые защитные элементы на застежках, если они были) - не будет принят. В таком случае товар будет отправлен обратно клиенту, который несет расходы на доставку.',
    'returns.cancellation': 'Отмена сделки и возврат средств (дорогой путь)',
    'returns.cancellationText': 'Отмена сделки для возврата средств будет возможна в течение 14 дней с момента получения товара, при условии следующих вычетов:',
    'returns.cancellationFee': 'Комиссия за отмену: согласно закону, будет вычтена комиссия за отмену в размере 5% от цены товара или ₪100 - в зависимости от того, что меньше.',
    'returns.cancellationProcessing': 'Комиссия за обработку: если сделка была совершена кредитной картой, также будут вычтены комиссии за обработку кредитной карты, взимаемые с компании за сделку (до 2.5%).',
    'returns.cancellationShipping': 'Расходы на доставку: оригинальные расходы на доставку (если были оплачены) не возвращаются. Стоимость доставки обратно на склад компании несет исключительно клиент.',
    'returns.exchange': 'Обмен товара или получение кредитного ваучера (выгодный путь)',
    'returns.exchangeText': 'Чтобы избежать комиссий за отмену и обработку, мы разрешаем обменять товар или получить кредитный ваучер (Credit) для будущих покупок на сайте на полную стоимость товара (без вычета комиссии за отмену).',
    'returns.exchangeTime': 'Обмен/кредит будет возможен в течение 14 дней с момента получения товара.',
    'returns.exchangeSale': 'Для товаров, приобретенных во время распродаж конца сезона (Sale) или в Outlet, обмен/кредит будет доступен только в течение двух дней (48 часов) с момента получения.',
    'returns.process': 'Как действовать',
    'returns.processNote': 'Обратите внимание: никакой возврат или обмен не будет принят без предварительной координации со службой поддержки клиентов.',
    'returns.processWhatsApp': 'Пожалуйста, свяжитесь со службой поддержки клиентов в WhatsApp по номеру: 054-990-3139 (WhatsApp) для открытия запроса и получения одобрения.',
    'returns.processOptions': 'Варианты возврата/обмена после одобрения:',
    'returns.processPhysical': 'Физический визит: посетите наш Showroom по адресу Геула 45, Тель-Авив, только по предварительной записи.',
    'returns.processCourier': 'Служба курьера: вы можете договориться о курьере, который заберет товар у вас за стоимость ₪29.90 (эта стоимость не будет возвращена и будет вычтена из кредита/возврата).',
    'returns.notes': 'Дополнительные примечания',
    'returns.noteMinPrice': 'Нет возврата средств за товары стоимостью менее ₪50.',
    'returns.noteAccessories': 'Аксессуары, извлеченные из упаковки, не подлежат возврату.',
    'returns.noteWarranty': 'Нет гарантии на потерю/падение камней, шпилек или декоративных застежек после использования товара.',
    
    // Terms Page
    'terms.title': 'Условия использования',
    'terms.introduction': 'Введение',
    'terms.introductionText': 'Добро пожаловать на сайт Klumit. Использование этого сайта подчиняется условиям, изложенным ниже. Использование сайта означает полное согласие с этими условиями.',
    'terms.websiteUse': 'Использование сайта',
    'terms.websiteUseText': 'Вы соглашаетесь использовать сайт только в законных целях и не:',
    'terms.websiteUseCopyright': 'Нарушать авторские права или другие права интеллектуальной собственности',
    'terms.websiteUseIllegal': 'Загружать или распространять вредоносный, оскорбительный или незаконный контент',
    'terms.websiteUseUnauthorized': 'Пытаться получить доступ к защищенным областям сайта без авторизации',
    'terms.orders': 'Заказы и платежи',
    'terms.ordersText': 'Все заказы на сайте подлежат нашему одобрению. Мы оставляем за собой право отменить заказ в любое время, включая случаи:',
    'terms.ordersUnavailable': 'Недоступность товара',
    'terms.ordersPriceError': 'Ошибка в цене товара',
    'terms.ordersTechnical': 'Технические проблемы или проблемы безопасности',
    'terms.prices': 'Цены',
    'terms.pricesText': 'Все цены на сайте указаны в израильских шекелях (₪) и включают НДС, если не указано иное. Мы оставляем за собой право изменять цены в любое время без предварительного уведомления.',
    'terms.copyright': 'Авторские права',
    'terms.copyrightText': 'Весь контент на сайте, включая тексты, изображения, логотипы и дизайн, защищен авторским правом и интеллектуальной собственностью. Запрещается копировать, воспроизводить или использовать контент без явного письменного разрешения.',
    'terms.delivery': 'Политика доставки товара/услуги',
    'terms.deliveryText': 'Товары будут отправлены клиенту через признанную курьерскую компанию. Максимальное время доставки с момента покупки до прибытия товара в пункт назначения составляет до 14 рабочих дней.',
    'terms.deliveryFree': 'Бесплатная доставка предлагается для заказов свыше ₪500. Доставка на дом стоит ₪39 и прибывает в течение 2-5 рабочих дней.',
    'terms.deliveryHome': 'Доставка на дом',
    'terms.deliveryTracking': 'После оформления заказа вы получите email с номером отслеживания для отслеживания статуса доставки.',
    'terms.deliveryLink': 'Для получения дополнительной информации см. страницу доставки.',
    'terms.ageLimit': 'Возрастное ограничение',
    'terms.ageLimitText': 'Покупки в кредит на этом сайте разрешены только лицам в возрасте 18 лет и старше. При совершении покупки вы подтверждаете, что вам 18 лет или больше, и что у вас есть законное право совершить покупку. Мы оставляем за собой право отменять заказы, если выяснится, что покупатель не соответствует возрастным требованиям.',
    'terms.liability': 'Ответственность бизнеса',
    'terms.liabilityText': 'Мы делаем все возможное, чтобы представить точную информацию о товарах. Однако мы не несем ответственности за ошибки или неточности в информации, отображаемой на сайте.',
    'terms.liabilityDisclaimer': 'Компания и/или любое лицо от ее имени не несут ответственности за любой прямой и/или косвенный ущерб, причиненный в результате использования услуги и/или использования товара, приобретенного на сайте, включая, но не ограничиваясь:',
    'terms.liabilityMisuse': 'Ущерб, возникший в результате неправильного использования товара',
    'terms.liabilityDataLoss': 'Ущерб, возникший в результате потери информации или данных',
    'terms.liabilityTechnical': 'Ущерб, возникший в результате технических проблем или сбоев на сайте',
    'terms.liabilityDelivery': 'Ущерб, возникший в результате задержек доставки или потери отправления',
    'terms.liabilityWarranty': 'Ответственность за товары ограничена только периодом гарантии, указанным производителем.',
    'terms.cancellation': 'Условия отмены сделки',
    'terms.cancellationText': 'Отмена сделки будет осуществлена в соответствии с Законом о защите прав потребителей 1981 года. Сделка может быть отменена в течение 14 дней с момента получения товара или совершения покупки, в зависимости от того, что наступит позже.',
    'terms.cancellationProcess': 'Для отмены сделки необходимо отправить письменное уведомление (по электронной почте или почтой) в компанию. Товар должен быть в оригинальном состоянии, неиспользованным, со всеми оригинальными бирками и упаковкой.',
    'terms.cancellationRefund': 'После отмены сделки компания вернет клиенту сумму платежа в течение 14 дней с момента получения товара обратно или получения уведомления об отмене, в зависимости от того, что наступит позже.',
    'terms.cancellationShipping': 'Расходы на доставку не будут возвращены клиенту, если только сделка не была отменена по причине, связанной с компанией.',
    'terms.cancellationLink': 'Для получения дополнительной информации см. страницу возврата.',
    'terms.privacy': 'Политика конфиденциальности',
    'terms.privacyText': 'Защита вашей конфиденциальности важна для нас. Вся информация, которую вы предоставляете нам, хранится безопасно и используется только для следующих целей:',
    'terms.privacyOrder': 'Обработка и выполнение заказов',
    'terms.privacySupport': 'Обслуживание клиентов и поддержка',
    'terms.privacyUpdates': 'Отправка обновлений и акций (только если вы дали согласие)',
    'terms.privacyImprove': 'Улучшение опыта использования сайта',
    'terms.privacyNoShare': 'Мы не будем продавать, сдавать в аренду или делиться вашей личной информацией с третьими лицами в маркетинговых целях, если только это не требуется по закону или если мы не получили ваше явное согласие.',
    'terms.privacySecure': 'Информация хранится в защищенных системах.',
    'terms.privacyLink': 'Для получения дополнительной информации см. нашу полную политику конфиденциальности.',
    'terms.changes': 'Изменения в условиях',
    'terms.changesText': 'Мы оставляем за собой право обновлять условия в любое время. Изменения вступают в силу немедленно после публикации на сайте. Рекомендуется периодически просматривать условия.',
    'terms.law': 'Применимое право',
    'terms.lawText': 'Эти условия подчиняются законам Государства Израиль. Любой спор, возникающий в результате использования сайта, будет разрешен в компетентных судах Израиля.',
    'terms.contact': 'Контакты',
    'terms.contactText': 'По вопросам или разъяснениям относительно этих условий, пожалуйста, свяжитесь с нашей службой поддержки клиентов:',
    'terms.companyName': 'Klumit',
    'terms.address': 'Адрес: ул. Геула 45, Тель-Авив Яффо 6330447',
    'terms.phone': 'Телефон: 03-5178502',
    'terms.fax': 'Факс: 03-5106781',
    'terms.email': 'Email: klumitltd@gmail.com',
    
    // Privacy Page
    'privacy.title': 'Политика конфиденциальности',
    'privacy.introduction': 'Введение',
    'privacy.introductionText': 'Klumit обязуется защищать вашу конфиденциальность. Эта политика конфиденциальности объясняет, как мы собираем, используем, защищаем и делимся вашей личной информацией при использовании нашего сайта.',
    'privacy.lastUpdated': 'Последнее обновление',
    'privacy.whatWeCollect': 'Какую информацию мы собираем',
    'privacy.whatWeCollectText': 'Мы собираем следующую информацию:',
    'privacy.personalInfo': 'Личная информация: имя, адрес электронной почты, номер телефона, адрес доставки',
    'privacy.paymentInfo': 'Платежная информация: данные платежа обрабатываются через защищенный Grow-il',
    'privacy.technicalInfo': 'Техническая информация: IP-адрес, тип браузера, операционная система, посещенные страницы',
    'privacy.usageInfo': 'Информация об использовании: как вы используете сайт, товары, которые вы просматриваете',
    'privacy.howWeUse': 'Как мы используем информацию',
    'privacy.howWeUseText': 'Мы используем вашу личную информацию для следующих целей:',
    'privacy.useOrder': 'Обработка и выполнение заказов',
    'privacy.useSupport': 'Обслуживание клиентов и поддержка',
    'privacy.useUpdates': 'Отправка обновлений и акций (только если вы дали согласие)',
    'privacy.useImprove': 'Улучшение опыта использования сайта и обслуживания клиентов',
    'privacy.useSecurity': 'Предотвращение мошенничества и защита сайта',
    'privacy.sharing': 'Обмен информацией с третьими лицами',
    'privacy.sharingText': 'Мы не будем продавать, сдавать в аренду или делиться вашей личной информацией с третьими лицами в маркетинговых целях, если только:',
    'privacy.sharingLegal': 'Требуется по закону или судебному решению',
    'privacy.sharingConsent': 'Мы получили ваше явное согласие',
    'privacy.sharingServices': 'Информация необходима для предоставления основных услуг (таких как компании доставки или защищенные платежные системы)',
    'privacy.sharingServicesText': 'Мы используем Shopify для хранения данных, Grow-il для платежей и Supabase для аутентификации пользователей. Все эти сервисы соответствуют строгим стандартам безопасности.',
    'privacy.security': 'Безопасность информации',
    'privacy.securityText': 'Мы применяем передовые технологические и организационные меры безопасности для защиты вашей личной информации от несанкционированного доступа, неправомерного использования, изменения или уничтожения. Информация хранится в защищенных системах, и доступ к ней ограничен только уполномоченными сотрудниками.',
    'privacy.rights': 'Ваши права',
    'privacy.rightsText': 'Вы имеете следующие права в отношении вашей личной информации:',
    'privacy.rightView': 'Право просматривать вашу личную информацию',
    'privacy.rightCorrect': 'Право исправлять неточную или устаревшую информацию',
    'privacy.rightDelete': 'Право удалять вашу личную информацию (с учетом правовых ограничений)',
    'privacy.rightObject': 'Право возражать против обработки вашей личной информации',
    'privacy.rightWithdraw': 'Право отозвать согласие на использование информации в маркетинговых целях',
    'privacy.rightsContact': 'Для осуществления ваших прав, пожалуйста, свяжитесь с нашей службой поддержки клиентов.',
    'privacy.cookies': 'Файлы cookie',
    'privacy.cookiesText': 'Наш сайт использует файлы cookie для улучшения вашего опыта. Файлы cookie - это небольшие файлы, которые сохраняются на вашем компьютере и помогают нам запоминать ваши предпочтения и улучшать производительность сайта. Вы можете настроить браузер на отклонение файлов cookie, но это может повлиять на функциональность сайта.',
    'privacy.changes': 'Изменения в политике конфиденциальности',
    'privacy.changesText': 'Мы оставляем за собой право обновлять политику конфиденциальности в любое время. Изменения вступают в силу немедленно после публикации на сайте. Рекомендуется периодически просматривать политику конфиденциальности, чтобы оставаться в курсе.',
    'privacy.contact': 'Контакты',
    'privacy.contactText': 'По вопросам или запросам относительно политики конфиденциальности или осуществления ваших прав, пожалуйста, свяжитесь с нашей службой поддержки клиентов:',
    'privacy.companyName': 'Klumit',
    'privacy.address': 'Адрес: ул. Геула 45, Тель-Авив Яффо 6330447',
    'privacy.phone': 'Телефон: 03-5178502',
    'privacy.fax': 'Факс: 03-5106781',
    'privacy.email': 'Email: klumitltd@gmail.com',
    
    // Accessibility Page
    'accessibility.title': 'Заявление о доступности',
    'accessibility.commitment': 'Наша приверженность доступности',
    'accessibility.commitmentText': 'Klumit Ltd. обязуется сделать сайт доступным для людей с ограниченными возможностями и работает над адаптацией к требованиям израильского стандарта (SI 5568) и рекомендациям WCAG 2.1 уровня AA.',
    'accessibility.actions': 'Действия по обеспечению доступности',
    'accessibility.actionKeyboard': 'Адаптация для навигации только с клавиатуры',
    'accessibility.actionScreenReader': 'Поддержка программ чтения с экрана и вспомогательного программного обеспечения',
    'accessibility.actionAlt': 'Добавление альтернативных описаний (alt) к изображениям',
    'accessibility.actionHeadings': 'Правильная иерархическая структура заголовков',
    'accessibility.actionContrast': 'Подходящий цветовой контраст',
    'accessibility.actionSkip': 'Возможность пропустить прямо к основному содержимому страницы',
    'accessibility.actionForms': 'Четкая маркировка полей форм',
    'accessibility.actionErrors': 'Доступные сообщения об ошибках',
    'accessibility.keyboard': 'Навигация с клавиатуры',
    'accessibility.keyboardTab': 'Tab - переход к следующему элементу',
    'accessibility.keyboardShiftTab': 'Shift + Tab - переход к предыдущему элементу',
    'accessibility.keyboardEnter': 'Enter - активация ссылки или кнопки',
    'accessibility.keyboardEscape': 'Escape - закрытие всплывающих окон',
    'accessibility.browsers': 'Поддерживаемые браузеры',
    'accessibility.browsersText': 'Сайт адаптирован для просмотра в браузерах Chrome, Firefox, Safari и Edge в их последних версиях.',
    'accessibility.contact': 'Контакты по вопросам доступности',
    'accessibility.contactText': 'Если вы столкнулись с проблемой доступности или у вас есть предложения по улучшению, мы будем рады услышать от вас:',
    'accessibility.contactEmail': 'Email:',
    'accessibility.contactPhone': 'Телефон:',
    'accessibility.update': 'Последнее обновление',
    'accessibility.updateText': 'Это заявление о доступности было последний раз обновлено: январь 2026',
    
    // Product Details
    'products.technicalSpecs': 'Технические характеристики',
    'products.designDetails': 'Дизайн и детали',
    'products.closureFit': 'Застежка и посадка',
    'products.qualityFinish': 'Качество и отделка',
    'products.dimensions': 'Размеры',
    
    // Membership
    'membership.topBar': 'Присоединяйтесь к клубу клиентов и получите',
    'membership.discount': '20%',
    'membership.firstPurchase': 'при первой покупке!',
    
    // Accessibility Links
    'skipToMain': 'Перейти к основному контенту',
    
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
    'footer.magazine': 'Журнал',
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
