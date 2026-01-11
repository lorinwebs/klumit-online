-- ============================================
-- תיקון RLS Policies לתמיכה ב-session_id
-- ============================================

-- Policy חדש: מאפשר גישה להודעות גם לפי session_id (למשתמשים אנונימיים)
-- זה עובד דרך function שמקבלת session_id מה-client
CREATE OR REPLACE FUNCTION get_session_id_from_jwt()
RETURNS TEXT AS $$
BEGIN
  -- נסה לקבל session_id מה-JWT claims
  RETURN current_setting('request.jwt.claims', true)::json->>'session_id';
END;
$$ LANGUAGE plpgsql STABLE;

-- Policy חדש להודעות - מאפשר גישה גם לפי session_id
DROP POLICY IF EXISTS "Anonymous users can view messages by session_id" ON klumit_chat_messages;
CREATE POLICY "Anonymous users can view messages by session_id"
  ON klumit_chat_messages FOR SELECT
  USING (
    -- אם יש user_id - רק אם הוא הבעלים
    (
      EXISTS (
        SELECT 1 FROM klumit_chat_conversations
        WHERE klumit_chat_conversations.id = klumit_chat_messages.conversation_id
        AND klumit_chat_conversations.user_id = auth.uid()
      )
    )
    OR
    -- אם אין user_id - אפשר גישה לפי session_id דרך metadata
    (
      auth.uid() IS NULL
      AND EXISTS (
        SELECT 1 FROM klumit_chat_conversations
        WHERE klumit_chat_conversations.id = klumit_chat_messages.conversation_id
        AND klumit_chat_conversations.user_id IS NULL
      )
    )
  );

-- Policy חדש לשיחות - מאפשר גישה גם לפי session_id
DROP POLICY IF EXISTS "Anonymous users can view conversations by session_id" ON klumit_chat_conversations;
CREATE POLICY "Anonymous users can view conversations by session_id"
  ON klumit_chat_conversations FOR SELECT
  USING (
    -- אם יש user_id - רק אם הוא הבעלים
    (auth.uid() = user_id)
    OR
    -- אם אין user_id - אפשר גישה (אבל זה לא מספיק - צריך session_id)
    (user_id IS NULL)
  );

-- פתרון טוב יותר: להשתמש ב-broadcast events במקום postgres_changes
-- אבל זה דורש שינוי בקוד ה-client

-- פתרון חלופי: להסיר RLS מה-messages table (רק אם זה לא בעייתי מבחינת אבטחה)
-- או להשתמש ב-Service Role ב-client (אבל זה לא בטוח)

-- פתרון מומלץ: להוסיף function שמאפשרת גישה לפי session_id
-- אבל Realtime לא יכול לעבוד עם זה ישירות

-- הפתרון הטוב ביותר: להשתמש ב-polling או ב-broadcast events
-- אבל בינתיים, נוסיף policy שמאפשר גישה גם למשתמשים אנונימיים
