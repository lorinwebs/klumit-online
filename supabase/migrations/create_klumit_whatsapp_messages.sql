-- ============================================
-- הודעות וואטסאפ של הטלפון העסקי (נכתב ע"י whatsapp-bridge)
-- ============================================

CREATE TABLE IF NOT EXISTS klumit_whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_message_id TEXT NOT NULL UNIQUE,
  chat_jid TEXT NOT NULL,
  is_group BOOLEAN NOT NULL DEFAULT FALSE,
  from_me BOOLEAN NOT NULL DEFAULT FALSE,
  sender_jid TEXT,
  sender_phone TEXT,
  sender_name TEXT,
  message_type TEXT NOT NULL,
  body TEXT,
  media_path TEXT,
  media_mime TEXT,
  wa_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  forwarded_at TIMESTAMP WITH TIME ZONE,
  forward_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_klumit_whatsapp_messages_ts ON klumit_whatsapp_messages(wa_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_klumit_whatsapp_messages_chat ON klumit_whatsapp_messages(chat_jid, wa_timestamp DESC);

-- גישה רק דרך service role (ללא policies = חסום ל-anon/authenticated)
ALTER TABLE klumit_whatsapp_messages ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE klumit_whatsapp_messages IS 'כל הודעות הוואטסאפ של הטלפון העסקי של קלומית';

-- מדיה (תמונות, קול, מסמכים) – bucket פרטי
INSERT INTO storage.buckets (id, name, public)
VALUES ('klumit-whatsapp-media', 'klumit-whatsapp-media', FALSE)
ON CONFLICT (id) DO NOTHING;
