-- מזהי ההודעות שהבריג' שלח למור (לצורך "תגיב" – מיפוי חזרה ללקוח)
ALTER TABLE klumit_whatsapp_messages
  ADD COLUMN IF NOT EXISTS forward_message_ids TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_klumit_whatsapp_forward_ids
  ON klumit_whatsapp_messages USING GIN (forward_message_ids);
