-- טבלה לסנכרון בין Supabase Users ל-Shopify Customers
CREATE TABLE IF NOT EXISTS user_shopify_sync (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  shopify_customer_id TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- אינדקס לחיפוש מהיר
CREATE INDEX IF NOT EXISTS idx_user_shopify_sync_user_id ON user_shopify_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shopify_sync_shopify_id ON user_shopify_sync(shopify_customer_id);

-- RLS (Row Level Security) - רק המשתמש יכול לראות את הנתונים שלו
ALTER TABLE user_shopify_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync data"
  ON user_shopify_sync
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync data"
  ON user_shopify_sync
  FOR UPDATE
  USING (auth.uid() = user_id);

-- פונקציה לעדכון updated_at אוטומטית
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_shopify_sync_updated_at
  BEFORE UPDATE ON user_shopify_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();




