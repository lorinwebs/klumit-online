# הגדרת WhatsApp Business למערכת הצ'אט

## סקירה כללית

המערכת תומכת כעת גם ב-WhatsApp Business API בנוסף ל-Telegram. ניתן להחליף בין הפלטפורמות באמצעות משתנה סביבה.

## הגדרת משתני סביבה

הוסף את המשתנים הבאים ל-`.env.local` או ל-Vercel:

```env
# בחירת פלטפורמה (true = WhatsApp, false או לא מוגדר = Telegram)
USE_WHATSAPP=true

# WhatsApp Business API - פרטי חיבור
WHATSAPP_PHONE_NUMBER_ID=123456789012345  # Phone Number ID מ-Meta Business
WHATSAPP_ACCESS_TOKEN=your_access_token_here  # Access Token מ-Meta Business
WHATSAPP_RECIPIENT_PHONE=972501234567  # מספר טלפון של היעד (בפורמט 972XXXXXXXXX)
WHATSAPP_API_VERSION=v21.0  # גרסת API (אופציונלי, ברירת מחדל: v21.0)
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345  # Business Account ID (אופציונלי)
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token_here  # Token לאימות webhook
```

## הגדרת WhatsApp Business API

### 1. יצירת Meta App

1. היכנס ל-[Meta for Developers](https://developers.facebook.com/)
2. צור App חדש מסוג "Business"
3. הוסף את ה-WhatsApp product ל-App

### 2. קבלת Phone Number ID ו-Access Token

1. ב-Meta Business Suite, עבור ל-WhatsApp > API Setup
2. העתק את ה-Phone Number ID
3. צור Access Token (System User או User Token)
4. העתק את ה-Access Token

### 3. הגדרת Webhook

1. ב-Meta App Dashboard, עבור ל-WhatsApp > Configuration
2. הוסף Webhook URL: `https://your-domain.com/api/whatsapp/webhook`
3. הוסף Verify Token (השתמש ב-`WHATSAPP_WEBHOOK_VERIFY_TOKEN`)
4. בחר את ה-Events הבאים:
   - `messages`
   - `message_status`

### 4. אישור מספר טלפון

1. ודא שמספר הטלפון שלך מאושר ב-WhatsApp Business
2. העתק את המספר בפורמט 972XXXXXXXXX (ללא + או 0)

## הרצת Migration

הרץ את ה-SQL migration כדי להוסיף את השדות הנדרשים:

```bash
# דרך Supabase Dashboard:
# העתק את התוכן מ-supabase-whatsapp-migration.sql והרץ ב-SQL Editor

# או דרך CLI:
supabase db push supabase-whatsapp-migration.sql
```

## החלפה בין Telegram ל-WhatsApp

### להפעלת WhatsApp:
```env
USE_WHATSAPP=true
```

### להפעלת Telegram (ברירת מחדל):
```env
USE_WHATSAPP=false
# או פשוט מחק את המשתנה
```

## הבדלים בין Telegram ל-WhatsApp

### Telegram:
- תומך ב-inline keyboards (כפתורי תגובה מהירה)
- תומך ב-typing indicator
- תומך ב-multiple chat IDs

### WhatsApp:
- לא תומך ב-inline keyboards דרך API
- לא תומך ב-typing indicator דרך API
- תומך במספר טלפון אחד בלבד (לפי `WHATSAPP_RECIPIENT_PHONE`)
- דורש webhook verification (GET request)

## בדיקת תקינות

1. ודא שה-webhook מאומת ב-Meta Dashboard
2. שלח הודעה דרך ChatWidget באתר
3. בדוק שההודעה מגיעה ל-WhatsApp
4. שלח תגובה מ-WhatsApp
5. בדוק שהתגובה מופיעה באתר

## פתרון בעיות

### ההודעות לא נשלחות:
- ודא ש-`USE_WHATSAPP=true`
- בדוק שה-Access Token תקף
- ודא שה-Phone Number ID נכון
- בדוק את ה-logs ב-Vercel/Server

### Webhook לא עובד:
- ודא שה-URL נגיש (לא localhost)
- בדוק שה-Verify Token תואם
- ודא שה-webhook מאומת ב-Meta Dashboard

### תגובות מ-WhatsApp לא מופיעות:
- בדוק שה-webhook מוגדר נכון
- ודא שה-Events נבחרו ב-Meta Dashboard
- בדוק את ה-logs ב-Vercel/Server

## הערות חשובות

1. **מספר טלפון**: חייב להיות בפורמט 972XXXXXXXXX (ללא + או 0)
2. **Access Token**: יכול להיות System User Token או User Token
3. **Webhook**: חייב להיות HTTPS (לא HTTP)
4. **Rate Limits**: WhatsApp Business API יש מגבלות rate - בדוק את ה-documentation

## קישורים שימושיים

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
