# תכנון טכני - מערכת צ'אט עם אינטגרציה ל-Telegram

## סקירה כללית

מערכת צ'אט דו-כיוונית המאפשרת למשתמשים באתר לשלוח הודעות דרך ChatWidget, לקבל תגובות מ-Telegram, ולנהל שיחות מרובות בו-זמנית.

### תכונות עיקריות:
- ✅ ChatWidget צף באתר (פתיחה/סגירה)
- ✅ שליחת הודעות מהאתר ל-Telegram
- ✅ תגובות מ-Telegram מוצגות באתר בזמן אמת
- ✅ **דף ניהול צ'אט ב-web** (`/admin/chat-messages`) - אפשרות לנהל ולהגיב גם דרך הדפדפן
- ✅ ניהול שיחות מרובות (5+ משתמשים בו-זמנית)
- ✅ תאום בין 2 משתמשי Telegram (מניעת תשובות כפולות)
- ✅ זיהוי משתמשים (מחוברים/לא מחוברים)

---

## 1. מבנה מסד הנתונים (Supabase)

### טבלה: `klumit_chat_conversations`
שיחות/תיקים - כל שיחה נפרדת

```sql
CREATE TABLE IF NOT EXISTS klumit_chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL, -- מזהה ייחודי למשתמש לא מחובר
  user_name TEXT, -- שם משתמש (אם לא מחובר)
  user_phone TEXT,
  user_email TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'waiting', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_klumit_chat_conversations_user_id ON klumit_chat_conversations(user_id);
CREATE INDEX idx_klumit_chat_conversations_session_id ON klumit_chat_conversations(session_id);
CREATE INDEX idx_klumit_chat_conversations_status ON klumit_chat_conversations(status);

-- RLS Policies
ALTER TABLE klumit_chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON klumit_chat_conversations FOR SELECT
  USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can create their own conversations"
  ON klumit_chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

-- Trigger לעדכון updated_at
CREATE TRIGGER update_klumit_chat_conversations_updated_at
  BEFORE UPDATE ON klumit_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### טבלה: `klumit_chat_messages`
הודעות בתוך שיחות

```sql
CREATE TABLE IF NOT EXISTS klumit_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES klumit_chat_conversations(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  from_user BOOLEAN NOT NULL, -- true=מהאתר, false=מ-Telegram
  telegram_chat_id TEXT, -- מי הגיב ב-Telegram (אם from_user=false)
  replied_by_name TEXT, -- שם של מי ענה (אם from_user=false)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_klumit_chat_messages_conversation_id ON klumit_chat_messages(conversation_id);
CREATE INDEX idx_klumit_chat_messages_created_at ON klumit_chat_messages(created_at DESC);

-- RLS Policies
ALTER TABLE klumit_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON klumit_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM klumit_chat_conversations
      WHERE klumit_chat_conversations.id = klumit_chat_messages.conversation_id
      AND (
        klumit_chat_conversations.user_id = auth.uid()
        OR klumit_chat_conversations.session_id = current_setting('app.session_id', true)
      )
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
```

---

## 2. API Routes

### `/app/api/chat/conversations/route.ts`
**GET** - קבלת שיחות של המשתמש

```typescript
// Input: session_id (query param או cookie)
// Output: { conversations: Conversation[] }
```

**POST** - יצירת שיחה חדשה

```typescript
// Input: { user_name?, user_phone?, user_email? }
// Output: { conversation: Conversation, session_id: string }
```

### `/app/api/chat/messages/[conversationId]/route.ts`
**GET** - קבלת הודעות בשיחה

```typescript
// Input: conversationId (param)
// Output: { messages: Message[] }
```

### `/app/api/chat/send-message/route.ts`
**POST** - שליחת הודעה מהאתר

```typescript
// Input: {
//   conversation_id: string,
//   message: string,
//   session_id?: string
// }
// Output: { success: boolean, message_id: string }
```

**תהליך:**
1. אימות שיחה שייכת למשתמש
2. שמירת הודעה ב-DB
3. שליחה ל-Telegram דרך `sendChatMessage()`
4. החזרת תשובה

### `/app/api/telegram/webhook/route.ts`
**POST** - Webhook מ-Telegram

```typescript
// Input: Telegram Update object
// Output: { ok: boolean }
```

**תהליך:**
1. אימות webhook (אופציונלי - secret token)
2. זיהוי סוג update (message, callback_query)
3. אם הודעה חדשה:
   - חילוץ conversation_id מהודעה (אם יש)
   - שמירת תגובה ב-DB
   - שליחה למשתמש באתר (Realtime)
   - שליחה ל-CHAT_ID השני עם אינדיקטור "נענה"
4. החזרת 200 OK

### `/app/api/admin/chat/conversations/route.ts`
**GET** - קבלת כל השיחות (Admin)

```typescript
// Input: { status?, page?, limit? }
// Output: { conversations: Conversation[], total: number }
```

**תהליך:**
1. אימות משתמש Admin
2. שאילתה עם filters (status, pagination)
3. החזרת רשימת שיחות

**POST** - עדכון סטטוס שיחה

```typescript
// Input: { conversation_id: string, status: 'open' | 'waiting' | 'closed' }
// Output: { success: boolean }
```

### `/app/api/admin/chat/messages/[conversationId]/route.ts`
**GET** - קבלת הודעות בשיחה (Admin)

```typescript
// Input: conversationId (param)
// Output: { messages: Message[] }
```

**POST** - שליחת תגובה מ-Admin

```typescript
// Input: { conversation_id: string, message: string, admin_name: string }
// Output: { success: boolean, message_id: string }
```

**תהליך:**
1. אימות משתמש Admin
2. שמירת הודעה ב-DB (from_user=false, replied_by_name=admin_name)
3. שליחה למשתמש באתר (Realtime)
4. שליחה ל-Telegram (אופציונלי - אם רוצים גם שם)
5. החזרת תשובה

### `/app/api/admin/chat/stats/route.ts`
**GET** - סטטיסטיקות צ'אט (Admin)

```typescript
// Output: {
//   total_conversations: number,
//   open_conversations: number,
//   waiting_conversations: number,
//   closed_conversations: number,
//   messages_today: number,
//   avg_response_time: number (minutes)
// }
```

---

## 3. Components

### `/components/ChatWidget.tsx`
רכיב צ'אט צף

**Props:** אין (global component)

**State:**
- `isOpen: boolean` - מצב פתוח/סגור
- `conversationId: string | null` - ID השיחה הנוכחית
- `sessionId: string | null` - מזהה משתמש
- `messages: Message[]` - הודעות
- `inputValue: string` - ערך שדה הקלט
- `loading: boolean` - מצב טעינה

**Features:**
- פתיחה/סגירה עם אנימציה (framer-motion)
- שמירת מצב ב-localStorage
- Supabase Realtime subscription לעדכונים
- שליחת הודעות
- הצגת הודעות (משתמש + תגובות)
- אינדיקטור "נענה" אם יש תגובה
- עיצוב RTL לעברית

**Position:** Fixed bottom-left/right, z-index גבוה

### שינויים ב-`/app/layout.tsx`
הוספת ChatWidget:

```typescript
import ChatWidget from '@/components/ChatWidget';

// בתוך <body>:
<ChatWidget />
```

### `/app/admin/chat-messages/page.tsx`
דף ניהול צ'אט (Admin)

**תכונות:**
- רשימת שיחות (טבלה/כרטיסים)
- סינון לפי סטטוס (open/waiting/closed)
- חיפוש לפי שם/טלפון/אימייל
- סטטיסטיקות (sidebar או header)
- צפייה בהודעות בשיחה
- שליחת תגובה ישירות מהדף
- עדכון סטטוס שיחה
- Realtime updates (הודעות חדשות מופיעות אוטומטית)

**Layout:**
```
┌─────────────────────────────────────────┐
│  ניהול צ'אט                    [סטטיסטיקות] │
├─────────────────────────────────────────┤
│  [סינון: כל השיחות ▼] [חיפוש...]        │
├─────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐     │
│  │ שיחה #123   │  │ שיחה #124   │     │
│  │ 👤 יוסי כהן  │  │ 👤 שרה לוי   │     │
│  │ 📱 050-1234  │  │ 📱 052-5678  │     │
│  │ 🟢 פתוח     │  │ 🟡 ממתין     │     │
│  │ 2 הודעות    │  │ 5 הודעות     │     │
│  └─────────────┘  └─────────────┘     │
│                                         │
│  [לחץ על שיחה לפתיחה]                  │
└─────────────────────────────────────────┘

[כשפותחים שיחה:]
┌─────────────────────────────────────────┐
│  ← חזרה    שיחה #123 - יוסי כהן        │
├─────────────────────────────────────────┤
│  [הודעות...]                            │
│  ┌───────────────────────────────────┐  │
│  │ 👤 יוסי: שלום, יש תיקים?         │  │
│  └────────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ ✅ Admin: כן, יש לנו תיקים       │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [הקלד תגובה...] [שלח]                  │
│  [סטטוס: פתוח ▼] [סגור שיחה]          │
└─────────────────────────────────────────┘
```

**Components:**
- `ChatConversationsList` - רשימת שיחות
- `ChatConversationView` - צפייה בשיחה
- `ChatStats` - סטטיסטיקות
- `ChatMessageInput` - שדה קלט לתגובה

**Authentication:**
- בדיקת משתמש Admin (email whitelist או role)
- Redirect ל-login אם לא מחובר
- Server Component עם client components פנימיים

---

## 4. שינויים ב-`/lib/telegram.ts`

### פונקציה חדשה: `sendChatMessage()`

```typescript
export async function sendChatMessage(data: {
  conversationId: string;
  message: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  pageUrl?: string;
}): Promise<boolean>
```

**תהליך:**
1. בניית הודעה מפורמטת:
   ```
   💬 הודעה חדשה משיחה #${conversationId}
   
   👤 משתמש: ${userName || 'לא צוין'}
   📱 טלפון: ${userPhone || 'לא צוין'}
   📧 אימייל: ${userEmail || 'לא צוין'}
   🔗 עמוד: ${pageUrl || 'לא צוין'}
   ───────────────────────
   ${message}
   ```
2. שליחה לכל ה-CHAT_IDs
3. החזרת success/failure

### פונקציה חדשה: `sendChatReply()`

```typescript
export async function sendChatReply(data: {
  conversationId: string;
  message: string;
  repliedByChatId: string;
  repliedByName: string;
  originalMessage?: string;
}): Promise<boolean>
```

**תהליך:**
1. בניית הודעה:
   ```
   ✅ נענה על ידי ${repliedByName}
   
   💬 שיחה #${conversationId}
   ───────────────────────
   ${message}
   ```
2. שליחה לכל ה-CHAT_IDs (כולל מי שענה - כדי שיראה שהתגובה נשלחה)
3. החזרת success/failure

### פונקציה עזר: `getTelegramChatName()`

```typescript
export async function getTelegramChatName(chatId: string): Promise<string | null>
```

מחזיר שם של chat_id (אם אפשר לקבל מ-Telegram API)

---

## 5. זרימת עבודה מפורטת

### 5.1 משתמש פותח צ'אט

```
1. משתמש לוחץ על ChatWidget (עיגול)
2. ChatWidget בודק אם יש session_id ב-localStorage
3. אם אין:
   - יצירת session_id חדש (UUID)
   - POST /api/chat/conversations
   - יצירת conversation חדש
4. אם יש:
   - GET /api/chat/conversations?session_id=xxx
   - מציאת שיחה פתוחה או יצירת חדשה
5. טעינת הודעות: GET /api/chat/messages/[conversationId]
6. פתיחת Realtime subscription
7. הצגת ChatWidget פתוח
```

### 5.2 משתמש שולח הודעה

```
1. משתמש מקליד הודעה ולוחץ "שלח"
2. ChatWidget שולח: POST /api/chat/send-message
   {
     conversation_id: "...",
     message: "...",
     session_id: "..."
   }
3. API Route:
   a. אימות שיחה שייכת למשתמש
   b. שמירת הודעה ב-DB (from_user=true)
   c. קבלת פרטי משתמש (אם מחובר)
   d. קריאה ל-sendChatMessage() ב-telegram.ts
   e. החזרת { success: true, message_id }
4. ChatWidget מעדכן UI (מוסיף הודעה לרשימה)
5. Realtime מעדכן את כל הלקוחות המחוברים
```

### 5.3 תגובה מ-Telegram

```
1. משתמש ב-Telegram מגיב להודעה
2. Telegram שולח webhook ל: POST /api/telegram/webhook
3. Webhook Route:
   a. אימות webhook (secret token)
   b. חילוץ conversation_id מהודעה (אם יש)
      - אם יש Reply להודעה: חילוץ מה-message.reply_to_message
      - אם יש command: /reply [ID] [text]
   c. שמירת תגובה ב-DB (from_user=false)
   d. קבלת שם של מי ענה (getTelegramChatName)
   e. קריאה ל-sendChatReply() - שליחה ל-CHAT_ID השני
   f. Realtime broadcast למשתמש באתר
4. ChatWidget מקבל עדכון דרך Realtime
5. הצגת תגובה + אינדיקטור "נענה"
```

### 5.4 תגובה מ-Admin (דף ניהול)

```
1. Admin נכנס ל-/admin/chat-messages
2. Admin בוחר שיחה
3. Admin רואה את כל ההודעות
4. Admin מקליד תגובה ולוחץ "שלח"
5. POST /api/admin/chat/messages/[conversationId]
   {
     conversation_id: "...",
     message: "...",
     admin_name: "Admin Name"
   }
6. API Route:
   a. אימות Admin
   b. שמירת הודעה ב-DB (from_user=false, replied_by_name=admin_name)
   c. Realtime broadcast למשתמש באתר
   d. שליחה ל-Telegram (אופציונלי)
   e. החזרת { success: true }
7. דף ניהול מעדכן UI (Realtime)
8. משתמש באתר רואה תגובה (ChatWidget)
```

### 5.5 תאום בין 2 משתמשי Telegram

```
1. CHAT_ID_1 מקבל הודעה מהאתר
2. CHAT_ID_1 מגיב
3. Webhook שולח תגובה גם ל-CHAT_ID_2 עם:
   "✅ נענה על ידי [שם]"
4. CHAT_ID_2 רואה שהגיבו, לא צריך לענות
5. אם CHAT_ID_2 רוצה להוסיף משהו:
   - יכול להגיב גם הוא
   - ההודעה תישלח גם ל-CHAT_ID_1
```

### 5.6 תאום בין Admin ל-Telegram

```
1. Admin מגיב דרך דף הניהול
2. התגובה נשמרת ב-DB
3. התגובה נשלחת למשתמש באתר (Realtime)
4. התגובה נשלחת גם ל-Telegram (אם מופעל)
5. משתמשי Telegram רואים: "✅ נענה על ידי Admin"
6. אם מישהו ב-Telegram מגיב אחר כך:
   - התגובה נשלחת גם ל-Admin (Realtime בדף הניהול)
```

---

## 6. Supabase Realtime

### Channel Setup

```typescript
const channel = supabase
  .channel(`chat:${conversationId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'klumit_chat_messages',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      // הוספת הודעה חדשה ל-state
      setMessages((prev) => [...prev, payload.new as Message]);
    }
  )
  .subscribe();
```

### Cleanup

```typescript
useEffect(() => {
  return () => {
    channel.unsubscribe();
  };
}, [conversationId]);
```

---

## 7. הגדרות נדרשות

### Environment Variables

```env
# קיימים:
TELEGRAM_BOT_TOKEN_KLUMIT=...
TELEGRAM_CHAT_ID_KLUMIT=chat_id1,chat_id2

# חדשים (אופציונלי):
TELEGRAM_WEBHOOK_SECRET=... # Secret token לאימות webhook
NEXT_PUBLIC_SITE_URL=https://www.klumit-online.co.il
```

### הגדרת Webhook ב-Telegram

```bash
# הגדרת webhook URL
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.klumit-online.co.il/api/telegram/webhook",
    "secret_token": "${TELEGRAM_WEBHOOK_SECRET}"
  }'
```

### SQL Migrations

1. יצירת טבלאות (ראה סעיף 1)
2. הפעלת RLS Policies
3. יצירת Triggers

---

## 8. פורמט הודעות ב-Telegram

### הודעה מהאתר:

```
💬 הודעה חדשה משיחה #abc123

👤 משתמש: יוסי כהן
📱 טלפון: 050-1234567
📧 אימייל: yossi@example.com
🔗 עמוד: /products/bag-123
───────────────────────
שלום, יש לכם תיקים במלאי?
```

### תגובה מ-Telegram:

```
✅ נענה על ידי משתמש 1

💬 שיחה #abc123
───────────────────────
כן, יש לנו תיקים במלאי. איזה מודל אתה מחפש?
```

---

## 9. אבטחה

### 1. RLS Policies
- משתמשים יכולים לראות רק את השיחות שלהם
- Admins יכולים לראות את כל השיחות (policy נפרד)
- Server-side validation לכל API calls
- Admin authentication - whitelist של emails או role-based

### 2. Webhook Security
- Secret token לאימות webhook
- אימות IP (אופציונלי)

### 3. Rate Limiting
- הגבלת הודעות למשתמש (למניעת spam)
- הגבלת יצירת שיחות חדשות

---

## 10. UX/UI Considerations

### ChatWidget Design:
- עיצוב מינימליסטי ומותאם לעברית
- אנימציות חלקות (framer-motion)
- תמיכה במובייל (responsive)
- אינדיקטורים ויזואליים:
  - "נשלח" ✓
  - "נענה" ✓✓
  - "טוען..." ...

### Accessibility:
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support

---

## 11. Testing Checklist

- [ ] יצירת שיחה חדשה
- [ ] שליחת הודעה מהאתר
- [ ] קבלת הודעה ב-Telegram
- [ ] תגובה מ-Telegram
- [ ] הצגת תגובה באתר (Realtime)
- [ ] תאום בין 2 משתמשי Telegram
- [ ] ניהול שיחות מרובות
- [ ] משתמש מחובר vs לא מחובר
- [ ] שמירת מצב ב-localStorage
- [ ] Error handling

---

## 12. קבצים חדשים/משונים

### קבצים חדשים:
1. `/components/ChatWidget.tsx`
2. `/app/api/chat/conversations/route.ts`
3. `/app/api/chat/messages/[conversationId]/route.ts`
4. `/app/api/chat/send-message/route.ts`
5. `/app/api/telegram/webhook/route.ts`
6. `/app/api/admin/chat/conversations/route.ts`
7. `/app/api/admin/chat/messages/[conversationId]/route.ts`
8. `/app/api/admin/chat/stats/route.ts`
9. `/app/admin/chat-messages/page.tsx`
10. `/components/admin/ChatConversationsList.tsx`
11. `/components/admin/ChatConversationView.tsx`
12. `/components/admin/ChatStats.tsx`
13. `/components/admin/ChatMessageInput.tsx`
14. `/supabase-chat-schema.sql` (migration)

### קבצים משונים:
1. `/lib/telegram.ts` - הוספת פונקציות חדשות
2. `/app/layout.tsx` - הוספת ChatWidget

---

## 13. סדר יישום מומלץ

1. ✅ יצירת טבלאות ב-Supabase
2. ✅ הוספת פונקציות ב-telegram.ts
3. ✅ יצירת API Routes (conversations, messages, send-message)
4. ✅ יצירת ChatWidget בסיסי
5. ✅ אינטגרציה ב-layout.tsx
6. ✅ הוספת Realtime
7. ✅ יצירת Webhook Route
8. ✅ הגדרת Webhook ב-Telegram
9. ✅ **יצירת דף ניהול (`/admin/chat-messages`)**
10. ✅ **יצירת Admin API Routes**
11. ✅ **הוספת Admin RLS Policies**
12. ✅ Testing
13. ✅ Polish & UX improvements

---

## 14. הערות נוספות

- Session ID נשמר ב-localStorage (לא cookie) - עובד גם למשתמשים לא מחוברים
- Realtime subscription נפתח רק כשהצ'אט פתוח (חיסכון ב-resources)
- הודעות ישנות נטענות רק כשפותחים שיחה (lazy loading)
- אפשר להוסיף pagination להודעות ישנות
- אפשר להוסיף תמיכה בקבצים/תמונות (בעתיד)

## 15. דף ניהול צ'אט - פרטים נוספים

### Authentication & Authorization

**שיטה 1: Email Whitelist**
```typescript
// ב-API Route
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || [];
const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
```

**שיטה 2: Role-based (אם יש Supabase roles)**
```sql
-- יצירת role
CREATE ROLE admin;
GRANT ALL ON klumit_chat_conversations TO admin;
GRANT ALL ON klumit_chat_messages TO admin;
```

**שיטה 3: Metadata ב-Supabase User**
```typescript
// בדיקת user_metadata
const isAdmin = user?.user_metadata?.role === 'admin';
```

### UI Features

1. **רשימת שיחות:**
   - כרטיסים או טבלה
   - Badge לסטטוס (🟢 פתוח, 🟡 ממתין, ⚫ סגור)
   - Badge למספר הודעות שלא נקראו
   - תאריך/שעה של הודעה אחרונה
   - Sort: לפי תאריך, סטטוס, מספר הודעות

2. **צפייה בשיחה:**
   - Split view או modal
   - הודעות מסודרות לפי זמן
   - הבחנה ויזואלית בין הודעות משתמש ל-Admin
   - Timestamp לכל הודעה
   - אינדיקטור "נקרא" / "לא נקרא"

3. **שליחת תגובה:**
   - שדה קלט עם כפתור "שלח"
   - Enter לשליחה
   - Loading state
   - Success/Error feedback

4. **סטטיסטיקות:**
   - מספר שיחות פתוחות
   - מספר שיחות ממתינות
   - ממוצע זמן תגובה
   - הודעות היום/השבוע

5. **סינון וחיפוש:**
   - סינון לפי סטטוס
   - חיפוש לפי שם/טלפון/אימייל
   - חיפוש לפי תוכן הודעה
   - Sort options

### Realtime בדף הניהול

```typescript
// Subscription לכל השיחות (לעדכונים)
const channel = supabase
  .channel('admin-chat-updates')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'klumit_chat_messages',
    },
    (payload) => {
      // עדכון UI
      if (payload.new.conversation_id === selectedConversationId) {
        // הוספת הודעה חדשה
      }
      // עדכון badge של שיחות
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'klumit_chat_conversations',
    },
    (payload) => {
      // עדכון סטטוס שיחה
    }
  )
  .subscribe();
```

### שליחה ל-Telegram (אופציונלי)

כשמ-Admin מגיב, אפשר לשלוח גם ל-Telegram:
- אם `SEND_ADMIN_REPLIES_TO_TELEGRAM=true` ב-env
- שליחה דרך `sendChatReply()` עם `replied_by_name="Admin"`

### Navigation

- Link ב-Header/Footer (אם Admin)
- או דרך `/account` (אם Admin)
- או דף נפרד `/admin` עם menu
