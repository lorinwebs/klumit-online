-- טבלה לשמירת הודעות מערכת (למניעת שליחות כפולות)
CREATE TABLE IF NOT EXISTS klumit_system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  viewer_count INTEGER,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- אינדקס לחיפוש מהיר של ההודעה האחרונה לפי סוג
CREATE INDEX IF NOT EXISTS idx_klumit_system_notifications_type_sent_at 
ON klumit_system_notifications(notification_type, sent_at DESC);

-- RLS - רק admin יכול לקרוא/לכתוב
ALTER TABLE klumit_system_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admin can access klumit_system_notifications"
ON klumit_system_notifications
FOR ALL
USING (false); -- ב-production, אפשר להגדיר policy מתאימה
