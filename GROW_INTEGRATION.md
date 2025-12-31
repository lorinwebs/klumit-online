# אינטגרציה עם Grow-il Payment

מדריך להגדרת תשלומים דרך Grow-il בחנות Shopify.

## הגדרות נדרשות

### 1. משתני סביבה (.env.local)

הוסף את המשתנים הבאים ל-`.env.local`:

```env
# Grow-il API
GROW_API_KEY=your-grow-api-key
GROW_ENVIRONMENT=sandbox  # או production

# Shopify Admin API (לעדכון הזמנות)
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx

# Base URL של האתר (להפניות)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. קבלת Grow API Key

1. פנה לתמיכה של Grow-il לקבלת `x-api-key` ו-`userId` + `pageCode`
2. העתק את ה-API key ל-`GROW_API_KEY`

### 3. הגדרת Shopify Admin API

1. ב-Shopify Admin: **Settings** > **Apps and sales channels** > **Develop apps**
2. צור אפליקציה חדשה והפעל **Admin API**
3. הפעל הרשאות:
   - `read_orders`
   - `write_orders`
4. התקן את האפליקציה והעתק את ה-**Admin API access token**
5. העתק ל-`SHOPIFY_ADMIN_API_TOKEN`

### 4. הגדרת Webhook ב-Grow

1. היכנס לדשבורד של Grow
2. עבור ל-**Webhooks** > **יצירת וובהוק חדש**
3. מלא את הפרטים הבאים:

   - **שם הוובהוק**: `shopify-payments`
   - **לינק לעדכון השרת**: `https://your-domain.com/api/grow/webhook`
   - **פרמטר מזהה**: `order_id` או `reference`
   - **סוג הוובהוק**: `עדכון לאחר ביצוע עסקה` / `Payment done`
   - **דיווחים**: 
     - ✅ `כל העסקאות` (או ספציפית `Payment Links`)
   - **צורת שליחת הנתונים**: `JSON`
   - **סטטוס**: `פעיל`

4. שמור את ה-**Webhook Key** (אמור להיות: `e485000d-0d0c-012c-f75e-83270122aac5`)

## איך זה עובד

### תהליך התשלום

1. **לקוח לוחץ "המשך לתשלום"** → `/checkout`
2. **יוצרת עגלה ב-Shopify** → מקבלת `cartId` וסכום כולל
3. **יוצרת Payment Link ב-Grow** → דרך `/api/grow/create-payment-link`
4. **מפנה ל-Grow** → הלקוח משלם בדף של Grow
5. **Grow שולח Webhook** → כשהתשלום מצליח, Grow שולח בקשה ל-`/api/grow/webhook`
6. **עדכון הזמנה ב-Shopify** → ה-Webhook מעדכן את ההזמנה עם תגית "Paid via Grow"

### קבצים שנוצרו

- `lib/grow.ts` - פונקציות ל-Grow API
- `app/api/grow/webhook/route.ts` - Webhook endpoint
- `app/api/grow/create-payment-link/route.ts` - יצירת Payment Link
- `app/checkout/page.tsx` - דף checkout מעודכן
- `app/payment/success/page.tsx` - דף הצלחה
- `app/payment/cancel/page.tsx` - דף ביטול
- `lib/shopify-admin.ts` - פונקציות לעדכון הזמנות ב-Shopify

## בדיקות

### בדיקת Webhook

1. שלח בקשה GET ל-`https://your-domain.com/api/grow/webhook`
2. אמור לקבל: `{ message: "Grow webhook endpoint is active", ... }`

### בדיקת תשלום

1. הוסף מוצר לעגלה
2. לחץ "המשך לתשלום"
3. אמור להיות מופנה לדף תשלום של Grow
4. לאחר תשלום מוצלח, בדוק ב-Shopify Admin שההזמנה עודכנה עם תגית "Paid via Grow"

## פתרון בעיות

### שגיאה: "GROW_API_KEY לא מוגדר"
- ודא שהוספת את `GROW_API_KEY` ל-`.env.local`
- הפעל מחדש את שרת הפיתוח

### שגיאה: "SHOPIFY_ADMIN_API_TOKEN לא מוגדר"
- ודא שהוספת את `SHOPIFY_ADMIN_API_TOKEN` ל-`.env.local`
- ודא שהטוקן תקין וההרשאות נכונות

### Webhook לא מתקבל
- ודא שה-URL נגיש מהאינטרנט (לא localhost)
- בדוק את הלוגים של השרת
- ודא שה-Webhook מוגדר כ-"פעיל" ב-Grow

### הזמנה לא מתעדכנת ב-Shopify
- בדוק שהטוקן של Admin API תקין
- ודא שההרשאות `write_orders` מופעלות
- בדוק את הלוגים של השרת לשגיאות

## הערות חשובות

1. **ביטחון**: כל בקשות API ל-Grow חייבות להישלח מהשרת (backend), לא מהדפדפן
2. **Webhook**: ה-Webhook חייב להיות HTTPS ונגיש מהאינטרנט
3. **מזהה הזמנה**: ה-`reference` שמועבר ל-Grow חייב להיות ייחודי ולהישמר כדי לשייך את התשלום להזמנה
4. **תמיכה**: אם יש בעיות, פנה לתמיכה של Grow-il

## קישורים שימושיים

- [תיעוד Grow-il API](https://grow-il.readme.io/)
- [Shopify Admin API](https://shopify.dev/docs/api/admin-graphql)

