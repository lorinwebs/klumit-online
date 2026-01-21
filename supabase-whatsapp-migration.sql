-- ============================================
-- Migration: הוספת תמיכה ב-WhatsApp Business
-- ============================================

-- הוספת שדות WhatsApp לטבלת klumit_chat_messages
ALTER TABLE klumit_chat_messages 
  ADD COLUMN IF NOT EXISTS whatsapp_message_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT;

-- יצירת index ל-whatsapp_message_id (כמו שיש ל-telegram_message_id)
CREATE INDEX IF NOT EXISTS idx_klumit_chat_messages_whatsapp_message_id 
  ON klumit_chat_messages(whatsapp_message_id) 
  WHERE whatsapp_message_id IS NOT NULL;

-- עדכון ה-CHECK constraint של status כדי לכלול גם WhatsApp
ALTER TABLE klumit_chat_messages 
  DROP CONSTRAINT IF EXISTS klumit_chat_messages_status_check;

ALTER TABLE klumit_chat_messages 
  ADD CONSTRAINT klumit_chat_messages_status_check 
  CHECK (status IN (
    'sent_to_server', 
    'delivered_to_telegram', 
    'delivered_to_whatsapp',
    'failed'
  ));

-- הערה: whatsapp_phone משמש במקום telegram_chat_id עבור WhatsApp
-- (שניהם מאותו סוג - מזהה של מי שלח את ההודעה)
