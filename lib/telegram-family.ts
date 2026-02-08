// Telegram Bot for Family Schedule notifications
// Bot: @hayat_schedule_bot

const BOT_TOKEN = process.env.TELEGRAM_CHAT_BOT_HAYAT_SCHEDULE;
const CHAT_IDS = process.env.TELEGRAM_CHAT_ID_KLUMIT?.split(',').map(id => id.trim()) || [];

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

async function sendMessage(text: string): Promise<boolean> {
  if (!BOT_TOKEN || CHAT_IDS.length === 0) return false;

  try {
    const results = await Promise.all(
      CHAT_IDS.map(async (chatId) => {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
        });
        return res.ok;
      })
    );
    return results.every(r => r);
  } catch {
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
}): Promise<boolean> {
  const personEmoji = PERSON_EMOJI[event.person] || '👤';
  const catEmoji = CATEGORY_EMOJI[event.category] || '📌';
  const startDate = new Date(event.start_time);
  const dayName = DAYS_HE[startDate.getDay()];

  const message = `📅 <b>אירוע חדש ביומן!</b>

${catEmoji} <b>${escapeHtml(event.title)}</b>
${personEmoji} ${escapeHtml(event.person)}
🗓 יום ${dayName}, ${formatDate(event.start_time)}
🕐 ${formatTime(event.start_time)} - ${formatTime(event.end_time)}${event.notes ? `\n📝 ${escapeHtml(event.notes)}` : ''}`;

  return sendMessage(message);
}

// Build a daily schedule message for a given date
export function buildDailyScheduleMessage(events: Array<{
  title: string;
  person: string;
  category: string;
  start_time: string;
  end_time: string;
  notes?: string | null;
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
    return `${formatTime(e.start_time)}-${formatTime(e.end_time)} ${catEmoji} <b>${escapeHtml(e.title)}</b> ${personEmoji} ${escapeHtml(e.person)}`;
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

export async function sendToChat(chatId: string, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
