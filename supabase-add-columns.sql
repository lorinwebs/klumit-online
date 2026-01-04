-- הוסף עמודות חסרות לטבלת order_addresses
-- הפעל את זה ב-Supabase SQL Editor אם הטבלה כבר קיימת

-- הוסף עמודה apartment אם לא קיימת
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_addresses' AND column_name = 'apartment'
  ) THEN
    ALTER TABLE order_addresses ADD COLUMN apartment TEXT;
    RAISE NOTICE 'Added apartment column';
  ELSE
    RAISE NOTICE 'apartment column already exists';
  END IF;
END $$;

-- הוסף עמודה floor אם לא קיימת
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_addresses' AND column_name = 'floor'
  ) THEN
    ALTER TABLE order_addresses ADD COLUMN floor TEXT;
    RAISE NOTICE 'Added floor column';
  ELSE
    RAISE NOTICE 'floor column already exists';
  END IF;
END $$;

-- הוסף עמודה notes אם לא קיימת
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'order_addresses' AND column_name = 'notes'
  ) THEN
    ALTER TABLE order_addresses ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column';
  ELSE
    RAISE NOTICE 'notes column already exists';
  END IF;
END $$;



