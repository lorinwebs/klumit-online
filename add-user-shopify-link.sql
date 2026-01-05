-- SQL Query להוספת חיבור בין Supabase User ל-Shopify Customer
-- הפעל את זה ב-Supabase SQL Editor

-- שלב 1: מצא את ה-user_id של lorintotah@gmail.com
-- (החלף את ה-email אם צריך)
SELECT id, email 
FROM auth.users 
WHERE email = 'lorintotah@gmail.com';

-- שלב 2: הוסף את החיבור ב-user_shopify_sync
-- (החלף את ה-user_id עם התוצאה מהשאילתה למעלה)
-- Shopify Customer ID: 8841170452723
-- אבל צריך את הפורמט המלא: gid://shopify/Customer/8841170452723

INSERT INTO user_shopify_sync (user_id, shopify_customer_id, phone, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'lorintotah@gmail.com' LIMIT 1),
  'gid://shopify/Customer/8841170452723',
  '+972524893329', -- או הטלפון הנכון
  NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  shopify_customer_id = EXCLUDED.shopify_customer_id,
  phone = EXCLUDED.phone,
  updated_at = NOW();

-- או אם אתה יודע את ה-user_id ישירות:
-- INSERT INTO user_shopify_sync (user_id, shopify_customer_id, phone, updated_at)
-- VALUES (
--   'YOUR_USER_ID_HERE', -- החלף עם ה-user_id האמיתי
--   'gid://shopify/Customer/8841170452723',
--   '+972524893329',
--   NOW()
-- )
-- ON CONFLICT (user_id) 
-- DO UPDATE SET 
--   shopify_customer_id = EXCLUDED.shopify_customer_id,
--   phone = EXCLUDED.phone,
--   updated_at = NOW();





