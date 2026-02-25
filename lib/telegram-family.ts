// Telegram Bot for Family Schedule notifications
// Bot: @hayat_schedule_bot

const BOT_TOKEN = process.env.TELEGRAM_CHAT_BOT_HAYAT_SCHEDULE;
// Use dedicated family schedule chat IDs if available, fallback to Klumit IDs
const CHAT_IDS = (process.env.TELEGRAM_CHAT_ID_FAMILY || process.env.TELEGRAM_CHAT_ID_KLUMIT)?.split(',').map(id => id.trim()) || [];

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const PERSON_EMOJI: Record<string, string> = {
  'לורין': '👩',
  'מור': '👨',
  'רון': '👧',
  'שי': '👧',
  'שחר': '👧',
  'כולם': '👨‍👩‍👧‍👧',
};

const CATEGORY_EMOJI: Record<string, string> = {
  'אימון': '🏋️',
  'חוג': '🎨',
  'עבודה': '💼',
  'משפחה': '👨‍👩‍👧‍👧',
  'אחר': '📌',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem' });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getTargetChatIds(excludeChatId?: string): string[] {
  return excludeChatId ? CHAT_IDS.filter(id => id !== excludeChatId) : CHAT_IDS;
}

async function sendMessageToTargets(text: string, targetChatIds: string[], source: string): Promise<boolean> {
  if (!BOT_TOKEN || CHAT_IDS.length === 0) {
    console.error(`${source}: Missing BOT_TOKEN or CHAT_IDS`, { hasToken: !!BOT_TOKEN, chatCount: CHAT_IDS.length });
    return false;
  }

  if (targetChatIds.length === 0) {
    console.log(`${source}: No recipients after filtering`);
    return true;
  }

  try {
    const results = await Promise.all(
      targetChatIds.map(async (chatId) => {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error(`Failed to send to ${chatId}:`, err);
        }
        return res.ok;
      })
    );
    const success = results.every(r => r);
    console.log(`${source}: Sent to ${targetChatIds.length} chats, success: ${success}`);
    return success;
  } catch (error) {
    console.error(`${source} error:`, error);
    return false;
  }
}

async function sendMessage(text: string): Promise<boolean> {
  if (!BOT_TOKEN || CHAT_IDS.length === 0) {
    console.error('sendMessage: Missing BOT_TOKEN or CHAT_IDS', { hasToken: !!BOT_TOKEN, chatCount: CHAT_IDS.length });
    return false;
  }

  try {
    const results = await Promise.all(
      CHAT_IDS.map(async (chatId) => {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
        });
        if (!res.ok) {
          const err = await res.text();
          console.error(`Failed to send to ${chatId}:`, err);
        }
        return res.ok;
      })
    );
    const success = results.every(r => r);
    console.log(`sendMessage: Sent to ${CHAT_IDS.length} chats, success: ${success}`);
    return success;
  } catch (error) {
    console.error('sendMessage error:', error);
    return false;
  }
}

// Notify when a new event is added
export async function notifyNewEvent(event: {
  title: string;
  person: string;
  category: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
  reminder_minutes?: number | null;
}, excludeChatId?: string): Promise<boolean> {
  console.log('notifyNewEvent called:', event.title, excludeChatId ? `(excluding ${excludeChatId})` : '');

  const personEmoji = PERSON_EMOJI[event.person] || '👤';
  const catEmoji = CATEGORY_EMOJI[event.category] || '📌';
  const startDate = new Date(event.start_time);
  const dayName = DAYS_HE[startDate.getDay()];

  let message = `📅 <b>אירוע חדש ביומן!</b>

${catEmoji} <b>${escapeHtml(event.title)}</b>
${personEmoji} ${escapeHtml(event.person)}
🗓 יום ${dayName}, ${formatDate(event.start_time)}
🕐 ${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;

  if (event.reminder_minutes) {
    let reminderText = '';
    if (event.reminder_minutes >= 1440) {
      reminderText = 'יום לפני';
    } else if (event.reminder_minutes >= 120) {
      reminderText = `${event.reminder_minutes / 60} שעות לפני`;
    } else if (event.reminder_minutes >= 60) {
      reminderText = 'שעה לפני';
    } else {
      reminderText = `${event.reminder_minutes} דקות לפני`;
    }
    message += `\n⏰ תזכורת: ${reminderText}`;
  }
  
  if (event.notes) {
    message += `\n📝 ${escapeHtml(event.notes)}`;
  }

  const targetChatIds = getTargetChatIds(excludeChatId);
  return sendMessageToTargets(message, targetChatIds, 'notifyNewEvent');
}

type ConflictEvent = {
  title: string;
  person: string;
  category: string;
  start_time: string;
  end_time: string;
};

function formatConflictEventLine(event: ConflictEvent): string {
  const personEmoji = PERSON_EMOJI[event.person] || '👤';
  const catEmoji = CATEGORY_EMOJI[event.category] || '📌';
  const startDate = new Date(event.start_time);
  const dayName = DAYS_HE[startDate.getDay()];

  return `${catEmoji} <b>${escapeHtml(event.title)}</b> ${personEmoji} ${escapeHtml(event.person)}\n🗓 יום ${dayName}, ${formatDate(event.start_time)}\n🕐 ${formatTime(event.start_time)} - ${formatTime(event.end_time)}`;
}

// Notify when a newly created event overlaps with existing events
export async function notifyEventConflict(newEvent: ConflictEvent, overlappingEvents: ConflictEvent[], excludeChatId?: string): Promise<boolean> {
  if (!overlappingEvents.length) return true;

  const overlapLines = overlappingEvents
    .slice(0, 5)
    .map((event, index) => `${index + 1}. ${formatConflictEventLine(event)}`)
    .join('\n\n');
  const extraCount = Math.max(0, overlappingEvents.length - 5);

  let message = `⚠️ <b>נוצר קונפליקט ביומן המשפחתי</b>\n\n<b>אירוע חדש:</b>\n${formatConflictEventLine(newEvent)}\n\n<b>מתנגש עם:</b>\n${overlapLines}`;
  if (extraCount > 0) {
    message += `\n\nועוד ${extraCount} אירועים נוספים.`;
  }

  const targetChatIds = getTargetChatIds(excludeChatId);
  return sendMessageToTargets(message, targetChatIds, 'notifyEventConflict');
}

export async function notifyEventUpdated(previousEvent: ConflictEvent, updatedEvent: ConflictEvent, excludeChatId?: string): Promise<boolean> {
  const message = `✏️ <b>אירוע עודכן ביומן המשפחתי</b>\n\n<b>לפני:</b>\n${formatConflictEventLine(previousEvent)}\n\n<b>אחרי:</b>\n${formatConflictEventLine(updatedEvent)}`;
  const targetChatIds = getTargetChatIds(excludeChatId);
  return sendMessageToTargets(message, targetChatIds, 'notifyEventUpdated');
}

export async function notifyEventDeleted(event: ConflictEvent, excludeChatId?: string): Promise<boolean> {
  const message = `🗑 <b>אירוע נמחק מהיומן המשפחתי</b>\n\n${formatConflictEventLine(event)}`;
  const targetChatIds = getTargetChatIds(excludeChatId);
  return sendMessageToTargets(message, targetChatIds, 'notifyEventDeleted');
}

// Build a daily schedule message for a given date
export function buildDailyScheduleMessage(events: Array<{
  title: string;
  person: string;
  category: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
  reminder_minutes?: number | null;
}>, date: Date): string {
  const dayName = DAYS_HE[date.getDay()];
  const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  if (events.length === 0) {
    return `📋 <b>לוז יומי - יום ${dayName} ${dateStr}</b>\n\n✨ אין אירועים מתוכננים להיום! יום חופשי 🎉`;
  }

  // Sort by start time
  const sorted = [...events].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const lines = sorted.map(e => {
    const personEmoji = PERSON_EMOJI[e.person] || '👤';
    const catEmoji = CATEGORY_EMOJI[e.category] || '📌';
    const reminderIcon = e.reminder_minutes ? ' ⏰' : '';
    return `${formatTime(e.start_time)}-${formatTime(e.end_time)} ${catEmoji} <b>${escapeHtml(e.title)}</b> ${personEmoji} ${escapeHtml(e.person)}${reminderIcon}`;
  });

  // Group by person for summary
  const personCounts: Record<string, number> = {};
  events.forEach(e => {
    personCounts[e.person] = (personCounts[e.person] || 0) + 1;
  });
  const summary = Object.entries(personCounts).map(([person, count]) => {
    const emoji = PERSON_EMOJI[person] || '👤';
    return `${emoji} ${person}: ${count}`;
  }).join(' | ');

  return `📋 <b>לוז יומי - יום ${dayName} ${dateStr}</b>

${lines.join('\n')}

📊 סה"כ ${events.length} אירועים
${summary}`;
}

// Send daily schedule
export async function sendDailySchedule(events: Array<{
  title: string;
  person: string;
  category: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
}>, date: Date): Promise<boolean> {
  const message = buildDailyScheduleMessage(events, date);
  return sendMessage(message);
}

export async function sendToChat(chatId: string, text: string, inlineKeyboard?: Array<Array<{ text: string; callback_data: string }>>): Promise<boolean> {
  if (!BOT_TOKEN) return false;

  try {
    const payload: Record<string, unknown> = { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true };
    if (inlineKeyboard) payload.reply_markup = { inline_keyboard: inlineKeyboard };
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Send to all family chat IDs
export async function sendToAllChats(text: string): Promise<boolean> {
  return sendMessage(text);
}

export async function editMessage(chatId: string, messageId: number, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
