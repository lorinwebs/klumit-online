-- ============================================
-- תכנית נאמנות - יצירת טבלאות
-- ============================================

-- טבלה: נקודות נאמנות
CREATE TABLE IF NOT EXISTS loyalty_points (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  shopify_customer_id TEXT,
  total_points INTEGER DEFAULT 0 NOT NULL CHECK (total_points >= 0),
  lifetime_points INTEGER DEFAULT 0 NOT NULL CHECK (lifetime_points >= 0),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_shopify_customer 
  ON loyalty_points(shopify_customer_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_updated_at 
  ON loyalty_points(updated_at DESC);

-- RLS Policies
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points"
  ON loyalty_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own points"
  ON loyalty_points FOR UPDATE
  USING (auth.uid() = user_id);

-- טבלה: היסטוריית עסקאות נקודות
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  order_id TEXT,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id 
  ON loyalty_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_order_id 
  ON loyalty_transactions(order_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at 
  ON loyalty_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type 
  ON loyalty_transactions(transaction_type);

-- RLS Policies
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON loyalty_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON loyalty_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- טבלה: קודי הנחה ייחודיים
CREATE TABLE IF NOT EXISTS loyalty_discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_code TEXT NOT NULL UNIQUE,
  points_used INTEGER NOT NULL CHECK (points_used > 0),
  discount_amount DECIMAL(10, 2) NOT NULL CHECK (discount_amount > 0),
  shopify_discount_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_discount_codes_user_id 
  ON loyalty_discount_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_discount_codes_status 
  ON loyalty_discount_codes(status);

CREATE INDEX IF NOT EXISTS idx_loyalty_discount_codes_expires_at 
  ON loyalty_discount_codes(expires_at);

CREATE INDEX IF NOT EXISTS idx_loyalty_discount_codes_code 
  ON loyalty_discount_codes(discount_code);

CREATE INDEX IF NOT EXISTS idx_loyalty_discount_codes_active_expired 
  ON loyalty_discount_codes(status, expires_at) 
  WHERE status IN ('active', 'expired');

-- RLS Policies
ALTER TABLE loyalty_discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own discount codes"
  ON loyalty_discount_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discount codes"
  ON loyalty_discount_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discount codes"
  ON loyalty_discount_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- Functions
-- ============================================

-- Function: עדכון נקודות
CREATE OR REPLACE FUNCTION update_loyalty_points(
  p_user_id UUID,
  p_points INTEGER,
  p_transaction_type TEXT,
  p_order_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS void AS $$
BEGIN
  -- עדכון/יצירת נקודות
  INSERT INTO loyalty_points (user_id, total_points, lifetime_points, updated_at)
  VALUES (
    p_user_id,
    GREATEST(0, p_points), -- לא שלילי
    GREATEST(0, p_points),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = GREATEST(0, loyalty_points.total_points + p_points),
    lifetime_points = CASE 
      WHEN p_transaction_type = 'earned' THEN loyalty_points.lifetime_points + ABS(p_points)
      ELSE loyalty_points.lifetime_points
    END,
    updated_at = NOW();

  -- יצירת רשומת transaction
  INSERT INTO loyalty_transactions (
    user_id,
    points,
    order_id,
    transaction_type,
    description
  ) VALUES (
    p_user_id,
    p_points,
    p_order_id,
    p_transaction_type,
    p_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: ניקוי קודי הנחה שפג תוקפם
CREATE OR REPLACE FUNCTION cleanup_expired_discount_codes()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE loyalty_discount_codes
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Triggers
-- ============================================

-- Trigger: עדכון updated_at אוטומטית
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE loyalty_points IS 'נקודות נאמנות של משתמשים';
COMMENT ON TABLE loyalty_transactions IS 'היסטוריית עסקאות נקודות';
COMMENT ON TABLE loyalty_discount_codes IS 'קודי הנחה ייחודיים שנוצרו מנקודות';

COMMENT ON COLUMN loyalty_points.total_points IS 'סך הנקודות הנוכחי (זמין לשימוש)';
COMMENT ON COLUMN loyalty_points.lifetime_points IS 'סך נקודות שנצברו אי פעם (כולל שנממשו)';
COMMENT ON COLUMN loyalty_transactions.transaction_type IS 'סוג עסקה: earned, redeemed, expired, adjusted';
COMMENT ON COLUMN loyalty_discount_codes.status IS 'סטטוס: active, used, expired, cancelled';
