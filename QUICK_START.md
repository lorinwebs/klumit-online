# מדריך התחלה מהיר

## ✅ מה כבר מוגדר:

1. **Supabase** - מוגדר עם Project ID: `ddpdhsgnxmhvrcbphhcv`
2. **Twilio** - מחובר ומוגדר
3. **Shopify Storefront API** - מוגדר
4. **משתני סביבה** - מוגדרים ב-`.env.local`

## 🚀 מה עוד צריך לעשות:

### 1. צור את טבלת הסנכרון ב-Supabase

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**SQL Editor**
4. העתק והפעל את הקוד מ-`supabase-schema.sql`
5. זה יוצר את טבלת `user_shopify_sync` לסנכרון עם Shopify

### 2. הגדר Shopify Admin API (אופציונלי - לסנכרון לקוחות)

אם תרצה שכל משתמש שנרשם יווצר אוטומטית גם ב-Shopify:

1. ב-Shopify Admin: **Settings** > **Apps and sales channels** > **Develop apps**
2. צור/ערוך אפליקציה
3. תחת **Admin API**, הפעל:
   - ✅ `write_customers`
   - ✅ `read_customers`
4. לחץ **Install app** והעתק את ה-**Admin API access token**
5. הוסף ל-`.env.local`:
   ```env
   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxxxx
   ```

### 3. בדוק שהכל עובד

1. הפעל את השרת:
   ```bash
   npm run dev
   ```

2. פתח את הדפדפן ב-`http://localhost:3000`

3. נסה להתחבר:
   - לך ל-`/auth/login`
   - הזן מספר טלפון
   - קבל קוד SMS
   - הזן את הקוד

4. בדוק ב-Shopify:
   - לך ל-Shopify Admin > **Customers**
   - צריך לראות לקוח חדש עם מספר הטלפון

## 📝 הערות חשובות:

- **Twilio Sandbox**: אם אתה משתמש ב-Sandbox, זה רק לבדיקות. לייצור, תצטרך מספר טלפון מאושר.
- **SMS עלות**: כל SMS עולה כסף (תלוי ב-Twilio plan שלך)
- **סנכרון Shopify**: אם לא הגדרת Admin API, המשתמשים יווצרו רק ב-Supabase

## 🔗 קישורים שימושיים:

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Shopify Admin](https://admin.shopify.com)
- [Twilio Console](https://console.twilio.com)

## 🆘 פתרון בעיות:

### SMS לא מגיע:
- בדוק ב-Twilio Console שההודעות נשלחות
- ודא שמספר הטלפון בפורמט נכון (+972...)
- אם אתה ב-Sandbox, ודא שהתחברת ל-WhatsApp Sandbox

### לקוח לא נוצר ב-Shopify:
- ודא שה-`SHOPIFY_ADMIN_ACCESS_TOKEN` מוגדר
- בדוק שה-Admin API permissions מופעלות
- בדוק את ה-console logs לשגיאות

### טבלה לא קיימת:
- הפעל את ה-SQL מ-`supabase-schema.sql`
- ודא שיש הרשאות ליצור טבלאות



