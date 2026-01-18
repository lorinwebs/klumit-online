-- ============================================
-- טבלת ביקורות לקוחות
-- ============================================

CREATE TABLE IF NOT EXISTS customer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  product_handle TEXT,
  product_name TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_reviews_user_id ON customer_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON customer_reviews(status);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_created_at ON customer_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_product_handle ON customer_reviews(product_handle);

-- RLS Policies
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- כל אחד יכול לראות ביקורות מאושרות
CREATE POLICY "Anyone can view approved reviews"
  ON customer_reviews FOR SELECT
  USING (status = 'approved');

-- משתמשים מחוברים יכולים להוסיף ביקורות
CREATE POLICY "Authenticated users can insert reviews"
  ON customer_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- משתמשים יכולים לעדכן את הביקורות שלהם
CREATE POLICY "Users can update own reviews"
  ON customer_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger לעדכון updated_at
CREATE TRIGGER update_customer_reviews_updated_at
  BEFORE UPDATE ON customer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE customer_reviews IS 'ביקורות לקוחות על מוצרים';
COMMENT ON COLUMN customer_reviews.status IS 'סטטוס: pending (ממתין לאישור), approved (מאושר), rejected (נדחה)';
COMMENT ON COLUMN customer_reviews.rating IS 'דירוג 1-5 כוכבים';
