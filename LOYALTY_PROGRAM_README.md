# תכנית נאמנות - מדריך התקנה

## 📋 סקירה

תכנית נאמנות מותאמת אישית עם:
- צבירת 10% נקודות על כל רכישה
- שימוש בנקודות בדף checkout
- קודי הנחה ייחודיים, חד-פעמיים, מאובטחים

## 🚀 התקנה

### שלב 1: Database Setup

הרץ את ה-migration ב-Supabase:

```sql
-- העתק את התוכן מ-supabase/migrations/create_loyalty_tables.sql
-- והרץ ב-Supabase SQL Editor
```

או דרך CLI:
```bash
supabase db push
```

### שלב 2: Environment Variables

ודא שיש לך:
```bash
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx  # עם הרשאה write_discounts
```

### שלב 3: Vercel Cron (אופציונלי)

הוסף ל-`vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-discounts",
    "schedule": "0 * * * *"
  }]
}
```

## 📖 שימוש

### צבירת נקודות
נקודות נצברות אוטומטית אחרי כל רכישה מוצלחת דרך webhook.

### שימוש בנקודות
1. משתמש נכנס ל-checkout
2. בוחר להשתמש בנקודות
3. קוד הנחה ייחודי נוצר אוטומטית
4. הקוד מוחל על העגלה
5. אחרי רכישה מוצלחת - נקודות מתעדכנות

## 🔧 API Endpoints

- `GET /api/loyalty/points` - קבלת נקודות
- `GET /api/loyalty/history` - היסטוריית עסקאות
- `POST /api/loyalty/create-discount` - יצירת קוד הנחה
- `POST /api/loyalty/cancel-discount` - ביטול קוד
- `GET /api/cron/cleanup-discounts` - ניקוי קודים (Cron)

## 📊 חישוב נקודות

- **צבירה**: 1₪ = 10 נקודות (10% * 10)
- **שימוש**: 10 נקודות = 1₪ הנחה

## 🔐 אבטחה

- RLS policies מוגדרים - משתמשים רואים רק את הנקודות שלהם
- קודי הנחה ייחודיים - לא ניתן לשתף
- תאריך תפוגה - 2 שעות
- ניקוי אוטומטי - קודים ישנים נמחקים

## 🐛 Troubleshooting

### נקודות לא נצברות
- בדוק שה-webhook `orders/create` פעיל
- בדוק שה-user_id מקושר ל-Shopify customer

### קוד הנחה לא עובד
- בדוק שיש Admin API token עם הרשאה `write_discounts`
- בדוק שהקוד לא פג תוקף
- בדוק שהקוד לא שימש כבר

## 📚 תיעוד מלא

ראה `LOYALTY_PROGRAM_DESIGN.md` לפרטים מלאים.
