# תכנית נאמנות - תכנון מלא

## 🎯 מטרה

לבנות תכנית נאמנות מותאמת אישית עם:
- **10% צבירת נקודות** על כל רכישה
- **שימוש בנקודות** בדף הסיכום (checkout)
- **קודי הנחה ייחודיים** - חד-פעמיים, דינמיים, מאובטחים

## 📋 דרישות

### פונקציונליות
1. ✅ צבירת נקודות: 10% מכל רכישה (1₪ = 10 נקודות)
2. ✅ הצגת נקודות: בחשבון המשתמש
3. ✅ שימוש בנקודות: בדף checkout
4. ✅ היסטוריית נקודות: עסקאות צבירה ושימוש
5. ✅ קוד הנחה ייחודי: נוצר דינמית, חד-פעמי, עם תפוגה

### אבטחה
- ✅ קוד ייחודי לכל משתמש/רכישה
- ✅ שימוש חד-פעמי בלבד
- ✅ תאריך תפוגה (2 שעות)
- ✅ ניקוי אוטומטי של קודים שלא שימשו

## 🏗️ ארכיטקטורה

### 1. מסד נתונים (Supabase)

#### טבלה: `loyalty_points`
```sql
CREATE TABLE loyalty_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shopify_customer_id TEXT,
  total_points INTEGER DEFAULT 0 NOT NULL,
  lifetime_points INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loyalty_points_shopify_customer ON loyalty_points(shopify_customer_id);
```

#### טבלה: `loyalty_transactions`
```sql
CREATE TABLE loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  order_id TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_order_id ON loyalty_transactions(order_id);
CREATE INDEX idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);
```

#### טבלה: `loyalty_discount_codes`
```sql
CREATE TABLE loyalty_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_code TEXT NOT NULL UNIQUE,
  points_used INTEGER NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  shopify_discount_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_loyalty_discount_codes_user_id ON loyalty_discount_codes(user_id);
CREATE INDEX idx_loyalty_discount_codes_status ON loyalty_discount_codes(status);
CREATE INDEX idx_loyalty_discount_codes_expires_at ON loyalty_discount_codes(expires_at);
CREATE INDEX idx_loyalty_discount_codes_code ON loyalty_discount_codes(discount_code);
```

### 2. API Endpoints

#### `GET /api/loyalty/points`
קבלת נקודות של משתמש מחובר

**Response:**
```json
{
  "totalPoints": 500,
  "lifetimePoints": 1200,
  "availablePoints": 500
}
```

#### `GET /api/loyalty/history`
היסטוריית עסקאות נקודות

**Query Params:**
- `limit` (default: 50)
- `offset` (default: 0)

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "points": 100,
      "type": "earned",
      "orderId": "ORDER-123",
      "description": "נקודות על רכישה",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 25
}
```

#### `POST /api/loyalty/create-discount`
יצירת קוד הנחה ייחודי

**Body:**
```json
{
  "points": 200,
  "discountAmount": 20
}
```

**Response:**
```json
{
  "discountCode": "LOYALTY-abc123-xyz",
  "expiresAt": "2024-01-01T02:00:00Z",
  "discountAmount": 20
}
```

#### `POST /api/loyalty/cancel-discount`
ביטול קוד הנחה

**Body:**
```json
{
  "discountCode": "LOYALTY-abc123-xyz"
}
```

#### `GET /api/cron/cleanup-discounts` (Cron Job)
ניקוי קודי הנחה שפג תוקפם

### 3. Webhook Handlers

#### `POST /api/shopify/webhook/orders/route.ts`
**שינויים:**
- הוספת לוגיקה לחישוב נקודות על רכישה מוצלחת
- עדכון `loyalty_points` ו-`loyalty_transactions`
- עדכון סטטוס קוד הנחה ל-'used' אם שימש

### 4. UI Components

#### דף חשבון (`/app/account/AccountClient.tsx`)
- כרטיס "נקודות נאמנות"
- הצגת סך נקודות זמינות
- היסטוריית עסקאות
- לינק לפרטים נוספים

#### דף Checkout (`/app/checkout/page.tsx`)
- שדה "השתמש בנקודות"
- הצגת נקודות זמינות
- בחירת כמות נקודות לשימוש
- יצירת קוד הנחה דינמי
- החלת קוד על cart
- ביטול קוד אם המשתמש עוזב

## 🔄 זרימת עבודה

### צבירת נקודות (רכישה)

```
1. משתמש קונה ב-₪100
2. Shopify שולח webhook: orders/create
3. Handler מחשב: 100 * 0.10 = 10₪ = 100 נקודות
4. עדכון DB:
   - loyalty_points.total_points += 100
   - loyalty_points.lifetime_points += 100
   - יצירת רשומה ב-loyalty_transactions (type: 'earned')
```

### שימוש בנקודות (checkout)

```
1. משתמש ב-checkout עם 500 נקודות זמינות
2. בוחר להשתמש ב-200 נקודות (= 20₪ הנחה)
3. קריאה ל-POST /api/loyalty/create-discount
   - יצירת קוד ייחודי: LOYALTY-{userId}-{timestamp}-{random}
   - יצירת discount ב-Shopify דרך Admin API
   - תפוגה: 2 שעות
   - שמירה ב-DB (status: 'active')
4. החזרת קוד ל-frontend
5. החלת קוד על cart (UPDATE_CART_DISCOUNT_CODES_MUTATION)
6. אחרי רכישה מוצלחת (webhook):
   - עדכון נקודות: total_points -= 200
   - רשומה ב-transactions (type: 'redeemed')
   - עדכון סטטוס קוד ל-'used'
```

### ניקוי קודים

```
1. Background Job (כל שעה):
   - מוצא קודים עם status='active' ו-expires_at < NOW()
   - מבטל אותם ב-Shopify (אם אפשר)
   - מעדכן סטטוס ל-'expired'

2. לפני unload (checkout):
   - אם יש קוד פעיל, ביטול דרך API

3. Webhook (הזמנה בוטלה):
   - מצא קוד ששימש
   - עדכן סטטוס ל-'cancelled'
```

## 📁 קבצים חדשים

### Backend
- `app/api/loyalty/points/route.ts` - קבלת נקודות
- `app/api/loyalty/history/route.ts` - היסטוריית עסקאות
- `app/api/loyalty/create-discount/route.ts` - יצירת קוד הנחה
- `app/api/loyalty/cancel-discount/route.ts` - ביטול קוד
- `app/api/cron/cleanup-discounts/route.ts` - ניקוי תקופתי
- `lib/loyalty.ts` - פונקציות עזר לנקודות

### Database
- `supabase/migrations/create_loyalty_tables.sql` - יצירת טבלאות

## 📝 קבצים לשינוי

### Backend
- `app/api/shopify/webhook/orders/route.ts` - הוספת לוגיקת צבירת נקודות
- `lib/shopify-admin.ts` - הוספת mutation ליצירת discount

### Frontend
- `app/checkout/page.tsx` - הוספת UI לשימוש בנקודות
- `app/account/AccountClient.tsx` - הוספת הצגת נקודות

## 🧪 בדיקות

### Unit Tests
- [ ] חישוב נקודות נכון (10% = 10 נקודות לכל ₪)
- [ ] המרת נקודות להנחה (10 נקודות = 1₪)
- [ ] יצירת קוד ייחודי
- [ ] בדיקת תפוגה

### Integration Tests
- [ ] צבירת נקודות אחרי רכישה
- [ ] יצירת קוד הנחה
- [ ] החלת קוד על cart
- [ ] עדכון נקודות אחרי שימוש
- [ ] ניקוי קודים שפג תוקפם

### E2E Tests
- [ ] משתמש קונה → מקבל נקודות
- [ ] משתמש משתמש בנקודות → קוד נוצר → הנחה מוחלת
- [ ] משתמש עוזב checkout → קוד מתבטל

## 🚀 שלבי ביצוע

### שלב 1: Database Setup
1. ✅ יצירת טבלאות ב-Supabase
2. ✅ יצירת indexes
3. ✅ הגדרת RLS policies

### שלב 2: Backend - נקודות
1. ✅ יצירת `lib/loyalty.ts` עם פונקציות עזר
2. ✅ `GET /api/loyalty/points`
3. ✅ `GET /api/loyalty/history`
4. ✅ עדכון webhook orders - צבירת נקודות

### שלב 3: Backend - קודי הנחה
1. ✅ GraphQL mutation ליצירת discount (ב-`lib/shopify-admin.ts`)
2. ✅ `POST /api/loyalty/create-discount`
3. ✅ `POST /api/loyalty/cancel-discount`
4. ✅ `GET /api/cron/cleanup-discounts`

### שלב 4: Frontend - Checkout
1. ✅ טעינת נקודות זמינות
2. ✅ UI לבחירת נקודות לשימוש
3. ✅ יצירת קוד הנחה
4. ✅ החלת קוד על cart
5. ✅ ביטול קוד ב-unload

### שלב 5: Frontend - Account
1. ✅ הצגת נקודות בחשבון
2. ✅ היסטוריית עסקאות
3. ✅ עיצוב כרטיס נקודות

### שלב 6: ניקוי ותחזוקה
1. ✅ הגדרת Vercel Cron
2. ✅ בדיקות
3. ✅ תיעוד

## 🔐 אבטחה

### RLS Policies (Supabase)
```sql
-- loyalty_points
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
  ON loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

-- loyalty_transactions
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- loyalty_discount_codes
ALTER TABLE loyalty_discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discount codes"
  ON loyalty_discount_codes FOR SELECT
  USING (auth.uid() = user_id);
```

### API Security
- ✅ כל endpoints דורשים authentication
- ✅ בדיקת user_id בכל קריאה
- ✅ Rate limiting על יצירת קודי הנחה
- ✅ Validation של inputs

## 📊 חישוב נקודות

### צבירה
```
נקודות = סכום_רכישה * 0.10 * 10
דוגמה: 100₪ * 0.10 * 10 = 100 נקודות
```

### שימוש
```
הנחה = נקודות / 10
דוגמה: 200 נקודות / 10 = 20₪ הנחה
```

## ⚙️ הגדרות

### Environment Variables
```bash
# כבר קיים
SHOPIFY_ADMIN_API_TOKEN=shpat_xxxxx

# חדש (אופציונלי)
LOYALTY_POINTS_RATE=0.10  # 10%
LOYALTY_POINTS_MULTIPLIER=10  # 10 נקודות לכל ₪
DISCOUNT_EXPIRY_HOURS=2
```

### Vercel Cron
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup-discounts",
    "schedule": "0 * * * *"
  }]
}
```

## 🐛 Edge Cases

1. **משתמש לא מחובר** - לא יכול להשתמש בנקודות
2. **אין נקודות** - הסתרת אופציה לשימוש
3. **יותר נקודות מסכום העגלה** - הגבלה למקסימום 50% מהעגלה
4. **קוד לא תקין** - הודעת שגיאה, אפשרות לנסות שוב
5. **רכישה בוטלה** - עדכון נקודות חזרה (אופציונלי)
6. **קוד פג תוקף** - הודעת שגיאה, יצירת קוד חדש

## 📈 מדדים

### Analytics Events
- `loyalty_points_earned` - נקודות שנצברו
- `loyalty_points_redeemed` - נקודות שנממשו
- `loyalty_discount_created` - קוד הנחה נוצר
- `loyalty_discount_applied` - קוד הנחה הוחל

## ✅ Definition of Done

- [ ] כל הטבלאות נוצרו ב-Supabase
- [ ] כל ה-API endpoints עובדים
- [ ] UI ב-checkout עובד
- [ ] UI בחשבון עובד
- [ ] Webhook מעדכן נקודות
- [ ] Cron job מנקה קודים
- [ ] RLS policies מוגדרים
- [ ] בדיקות עברו
- [ ] תיעוד מעודכן

## 📚 הערות נוספות

### Shopify Discount API
- נדרש Admin API token עם הרשאה `write_discounts`
- קוד נוצר כ-`DiscountCodeBasic` עם:
  - `appliesOncePerCustomer: true`
  - `customerSelection: all`
  - `startsAt: now`
  - `endsAt: now + 2 hours`

### Performance
- Caching של נקודות ב-client (5 דקות)
- Batch cleanup של קודים ישנים
- Indexes על כל השדות הנפוצים

### Future Enhancements
- רמות חברות (VIP, Gold, Silver)
- הנחות מיוחדות ל-VIP
- תאריך תפוגה לנקודות
- הנחות על מוצרים ספציפיים
- תוכנית הפניות
