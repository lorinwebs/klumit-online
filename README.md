# Klumit - אתר E-commerce לתיקים יוקרתיים

אתר E-commerce מודרני ומעוצב לתיקים יוקרתיים עם תמיכה מלאה ב-RTL (עברית) ואינטגרציה עם Shopify.

## תכונות

- 🛍️ **סל קניות מלא** - ניהול עגלת קניות עם Zustand
- 🎨 **עיצוב יוקרתי** - UI מודרני ומעוצב ברמה גבוהה
- 🌐 **תמיכה ב-RTL** - תמיכה מלאה בעברית וכיוון ימין לשמאל
- 📦 **ניהול מלאי** - הצגת זמינות מוצרים בזמן אמת
- 🏷️ **מבצעים** - דף מבצעים מיוחד עם מחירים מוזלים
- 🔗 **אינטגרציה עם Shopify** - חיבור ל-Shopify Storefront API

## התקנה

1. התקן את התלויות:
```bash
npm install
```

2. צור קובץ `.env.local` והגדר את המשתנים הבאים:
```
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-access-token
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

3. הפעל את שרת הפיתוח:
```bash
npm run dev
```

4. פתח את הדפדפן בכתובת [http://localhost:3000](http://localhost:3000)

## קבלת Storefront Access Token מ-Shopify

1. היכנס ל-Shopify Admin
2. לך ל-Settings > Apps and sales channels
3. לחץ על "Develop apps"
4. צור אפליקציה חדשה
5. תחת "Configuration" > "Storefront API", הפעל את הגישה
6. העתק את ה-Storefront access token

## מבנה הפרויקט

```
├── app/                    # Next.js App Router
│   ├── page.tsx           # דף הבית
│   ├── products/           # דפי מוצרים
│   ├── cart/              # דף עגלת קניות
│   └── sales/             # דף מבצעים
├── components/            # רכיבי React
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── ProductCard.tsx
│   └── ...
├── lib/                   # ספריות ושירותים
│   └── shopify.ts        # אינטגרציה עם Shopify
└── store/                 # ניהול state
    └── cartStore.ts      # Zustand store לעגלה
```

## טכנולוגיות

- **Next.js 14** - Framework ל-React
- **TypeScript** - טייפים בטוחים
- **Tailwind CSS** - עיצוב
- **Zustand** - ניהול state
- **Framer Motion** - אנימציות
- **Shopify Storefront API** - חיבור לחנות

## רישיון

כל הזכויות שמורות © 2024 Klumit


# klumit-online
# klumit-online
# klumit-online


