-- ============================================
-- מערכת צ'אט - Schema לטבלאות
-- ============================================

-- טבלה: klumit_chat_conversations
CREATE TABLE IF NOT EXISTS klumit_chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL, -- מזהה ייחודי למשתמש לא מחובר
  user_name TEXT, -- שם משתמש (אם לא מחובר)
  user_phone TEXT,
  user_email TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'closed')),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- תאריך הודעה אחרונה (למיון)
  viewed_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- מי צופה בשיחה עכשיו (concurrency)
  viewed_by_admin_at TIMESTAMP WITH TIME ZONE, -- מתי התחיל לצפות
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_klumit_chat_conversations_user_id ON klumit_chat_conversations(user_id);
CREATE INDEX idx_klumit_chat_conversations_session_id ON klumit_chat_conversations(session_id);
CREATE INDEX idx_klumit_chat_conversations_status ON klumit_chat_conversations(status);
CREATE INDEX idx_klumit_chat_conversations_last_message_at ON klumit_chat_conversations(last_message_at DESC);

-- RLS Policies
ALTER TABLE klumit_chat_conversations ENABLE ROW LEVEL SECURITY;

-- רק משתמשים מחוברים יכולים לראות את השיחות שלהם
CREATE POLICY "Users can view their own conversations"
  ON klumit_chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON klumit_chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy לאפשר ל-Service Role לגשת (עוקף RLS)
-- Service Role Key עוקף RLS אוטומטית, אבל זה רק ליתר ביטחון

-- Trigger לעדכון updated_at
CREATE TRIGGER update_klumit_chat_conversations_updated_at
  BEFORE UPDATE ON klumit_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- טבלה: klumit_chat_messages
CREATE TABLE IF NOT EXISTS klumit_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES klumit_chat_conversations(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  from_user BOOLEAN NOT NULL, -- true=מהאתר, false=מ-Telegram/Admin
  telegram_chat_id TEXT, -- מי הגיב ב-Telegram (אם from_user=false)
  replied_by_name TEXT, -- שם של מי ענה (אם from_user=false)
  telegram_message_id TEXT, -- מזהה ההודעה ב-Telegram (לקישור Reply)
  status TEXT DEFAULT 'sent_to_server' CHECK (status IN ('sent_to_server', 'delivered_to_telegram', 'failed')), -- סטטוס שליחת ההודעה
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_klumit_chat_messages_conversation_id ON klumit_chat_messages(conversation_id);
CREATE INDEX idx_klumit_chat_messages_created_at ON klumit_chat_messages(created_at DESC);
CREATE INDEX idx_klumit_chat_messages_telegram_message_id ON klumit_chat_messages(telegram_message_id) WHERE telegram_message_id IS NOT NULL;
CREATE INDEX idx_klumit_chat_messages_status ON klumit_chat_messages(status);

-- RLS Policies
ALTER TABLE klumit_chat_messages ENABLE ROW LEVEL SECURITY;

-- רק משתמשים מחוברים יכולים לראות את ההודעות שלהם
CREATE POLICY "Users can view messages in their conversations"
  ON klumit_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM klumit_chat_conversations
      WHERE klumit_chat_conversations.id = klumit_chat_messages.conversation_id
      AND klumit_chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert messages"
  ON klumit_chat_messages FOR INSERT
  WITH CHECK (true); -- Server-side only

-- Policy לניהול (Admin) - רק משתמשים מסוימים
CREATE POLICY "Admins can view all messages"
  ON klumit_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email IN (
        SELECT unnest(string_to_array(current_setting('app.admin_emails', true), ','))
      )
    )
  );

-- ============================================
-- Triggers נוספים (לאחר יצירת הטבלאות)
-- ============================================

-- Trigger לעדכון last_message_at כשנוספת הודעה חדשה
CREATE OR REPLACE FUNCTION update_conversation_last_message_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE klumit_chat_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_klumit_chat_conversations_last_message
  AFTER INSERT ON klumit_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message_at();
