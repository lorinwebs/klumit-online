# פתרון שגיאת 406 מ-Supabase

אם אתה רואה שגיאת `406 (Not Acceptable)` כשמנסה לגשת ל-`user_shopify_sync`, זה אומר שהטבלה לא קיימת או שחסר policy.

## פתרון מהיר:

### 1. צור את הטבלה ב-Supabase

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך (`ddpdhsgnxmhvrcbphhcv`)
3. לך ל-**SQL Editor**
4. העתק והפעל את כל הקוד מ-`supabase-schema.sql`
5. לחץ **Run** (או F5)

### 2. ודא שהטבלה נוצרה

1. לך ל-**Table Editor**
2. בדוק אם הטבלה `user_shopify_sync` קיימת
3. אם לא, הפעל שוב את ה-SQL

### 3. בדוק את ה-RLS Policies

1. לך ל-**Authentication** > **Policies**
2. בחר את הטבלה `user_shopify_sync`
3. ודא שיש 3 policies:
   - ✅ "Users can view their own sync data" (SELECT)
   - ✅ "Users can update their own sync data" (UPDATE)
   - ✅ "Users can insert their own sync data" (INSERT) - **זה חשוב!**

### 4. אם עדיין לא עובד - בדוק את ה-API Key

1. לך ל-**Settings** > **API**
2. ודא ש-`NEXT_PUBLIC_SUPABASE_ANON_KEY` ב-`.env.local` תואם ל-**anon/public** key
3. ודא ש-`NEXT_PUBLIC_SUPABASE_URL` תואם ל-**Project URL**

## SQL מהיר לתיקון:

אם הטבלה כבר קיימת אבל חסר policy ל-INSERT, הפעל:

```sql
CREATE POLICY "Users can insert their own sync data"
  ON user_shopify_sync
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## בדיקה:

לאחר יצירת הטבלה, נסה להתחבר שוב - השגיאה אמורה להיעלם.




