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

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Users can view their own sync data" ON user_shopify_sync;
DROP POLICY IF EXISTS "Users can update their own sync data" ON user_shopify_sync;
DROP POLICY IF EXISTS "Users can insert their own sync data" ON user_shopify_sync;

CREATE POLICY "Users can view their own sync data"
  ON user_shopify_sync
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync data"
  ON user_shopify_sync
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync data"
  ON user_shopify_sync
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- פונקציה לעדכון updated_at אוטומטית
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_shopify_sync_updated_at ON user_shopify_sync;

CREATE TRIGGER update_user_shopify_sync_updated_at
  BEFORE UPDATE ON user_shopify_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- טבלה לשמירת כתובות משלוח לכל הזמנה
CREATE TABLE IF NOT EXISTS order_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_reference TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  apartment TEXT,
  floor TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- אינדקסים לחיפוש מהיר
CREATE INDEX IF NOT EXISTS idx_order_addresses_user_id ON order_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_order_addresses_order_reference ON order_addresses(order_reference);

-- RLS (Row Level Security)
ALTER TABLE order_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Users can view their own order addresses" ON order_addresses;
DROP POLICY IF EXISTS "Users can insert their own order addresses" ON order_addresses;
DROP POLICY IF EXISTS "Users can update their own order addresses" ON order_addresses;

CREATE POLICY "Users can view their own order addresses"
  ON order_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own order addresses"
  ON order_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own order addresses"
  ON order_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_order_addresses_updated_at ON order_addresses;

-- פונקציה לעדכון updated_at אוטומטית
CREATE TRIGGER update_order_addresses_updated_at
  BEFORE UPDATE ON order_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- טבלה לשמירת היסטוריית שינויים בפרופיל
CREATE TABLE IF NOT EXISTS user_profile_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- אינדקסים לחיפוש מהיר
CREATE INDEX IF NOT EXISTS idx_user_profile_changes_user_id ON user_profile_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_changes_field_name ON user_profile_changes(field_name);
CREATE INDEX IF NOT EXISTS idx_user_profile_changes_changed_at ON user_profile_changes(changed_at);

-- RLS (Row Level Security)
ALTER TABLE user_profile_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile changes"
  ON user_profile_changes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile changes"
  ON user_profile_changes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);




