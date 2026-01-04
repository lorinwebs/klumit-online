-- SQL לתיקון מהיר - רק מוסיף את ה-policy החסר ל-INSERT
-- הפעל את זה אם הטבלה כבר קיימת אבל חסר policy ל-INSERT

-- הוסף policy ל-INSERT ל-user_shopify_sync (אם לא קיים)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_shopify_sync' 
    AND policyname = 'Users can insert their own sync data'
  ) THEN
    CREATE POLICY "Users can insert their own sync data"
      ON user_shopify_sync
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;




