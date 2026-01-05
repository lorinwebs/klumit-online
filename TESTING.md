# מדריך בדיקה - התחברות עם SMS

## ✅ מה כבר מוכן:

- ✅ Supabase מחובר
- ✅ Twilio מחובר
- ✅ משתני סביבה מוגדרים
- ✅ קוד מוכן

## 🧪 שלב 1: התקנת חבילות

```bash
npm install
```

## 🧪 שלב 2: יצירת טבלת הסנכרון

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard/project/ddpdhsgnxmhvrcbphhcv)
2. לך ל-**SQL Editor**
3. העתק את כל הקוד מ-`supabase-schema.sql`
4. הפעל את הקוד (Run)
5. ודא שהטבלה `user_shopify_sync` נוצרה

## 🧪 שלב 3: הפעלת השרת

```bash
npm run dev
```

פתח את הדפדפן ב: `http://localhost:3000`

## 🧪 שלב 4: בדיקת התחברות

1. לך ל-`http://localhost:3000/auth/login`
2. הזן מספר טלפון (למשל: `0501234567`)
3. לחץ "שלח קוד"
4. בדוק ב-Twilio Console שההודעה נשלחה
5. אם אתה ב-Sandbox, שלח את הקוד מ-WhatsApp Sandbox
6. הזן את הקוד שקיבלת
7. לחץ "אמת קוד"

## ✅ מה אמור לקרות:

1. **אחרי הזנת קוד נכון:**
   - המשתמש מתחבר
   - מועבר לדף הבית
   - אייקון משתמש ב-Header מציג תפריט

2. **אם הגדרת Shopify Admin API:**
   - נוצר לקוח ב-Shopify עם מספר הטלפון
   - ה-Shopify Customer ID נשמר ב-Supabase
   - תראה "מחובר ל-Shopify" בדף החשבון

## 🔍 בדיקות נוספות:

### בדוק ב-Supabase:
1. Authentication > Users - צריך לראות משתמש חדש
2. Table Editor > `user_shopify_sync` - צריך לראות רשומה (אם הגדרת Shopify)

### בדוק ב-Shopify:
1. Customers - צריך לראות לקוח חדש עם מספר הטלפון

### בדוק ב-Twilio:
1. Monitor > Logs - צריך לראות שההודעות נשלחות
2. אם אתה ב-Sandbox, ודא שהתחברת ל-WhatsApp Sandbox

## 🐛 פתרון בעיות:

### SMS לא מגיע:
- בדוק ב-Twilio Console שההודעות נשלחות
- ודא שמספר הטלפון בפורמט נכון (+972...)
- אם אתה ב-Sandbox, ודא שהתחברת ל-WhatsApp Sandbox
- בדוק את ה-console logs בדפדפן

### שגיאה: "Table doesn't exist"
- הפעל את ה-SQL מ-`supabase-schema.sql`
- ודא שהטבלה `user_shopify_sync` קיימת

### לקוח לא נוצר ב-Shopify:
- ודא שה-`SHOPIFY_ADMIN_ACCESS_TOKEN` מוגדר ב-`.env.local`
- בדוק שה-Admin API permissions מופעלות
- בדוק את ה-console logs

### שגיאה: "Supabase credentials missing"
- ודא ש-`.env.local` קיים
- ודא שהמשתנים `NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY` מוגדרים
- הפעל מחדש את השרת אחרי עדכון `.env.local`

## 📝 הערות:

- **Twilio Sandbox**: אם אתה משתמש ב-Sandbox, זה רק לבדיקות. לייצור, תצטרך מספר טלפון מאושר.
- **SMS עלות**: כל SMS עולה כסף (תלוי ב-Twilio plan שלך)
- **סנכרון Shopify**: אם לא הגדרת Admin API, המשתמשים יווצרו רק ב-Supabase (זה בסדר!)









