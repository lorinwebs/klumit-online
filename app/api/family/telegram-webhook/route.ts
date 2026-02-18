import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildDailyScheduleMessage, sendToChat, editMessage, notifyNewEvent } from '@/lib/telegram-family';

// Store editing state: chatId -> { eventId, originalEvent }
const editingState = new Map<string, { eventId: string; originalEvent: any }>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle inline button callbacks (e.g. delete event, edit event)
    const callback = body.callback_query;
    if (callback) {
      const cbChatId = String(callback.message.chat.id);
      const cbMsgId = callback.message.message_id;
      const cbData = callback.data as string;

      if (cbData.startsWith('delete_event:')) {
        const eventId = cbData.replace('delete_event:', '');
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase.from('family_events').delete().eq('id', eventId);
        if (error) {
          await editMessage(cbChatId, cbMsgId, '❌ שגיאה במחיקה');
        } else {
          await editMessage(cbChatId, cbMsgId, '🗑 האירוע נמחק מהיומן');
        }
      } else if (cbData.startsWith('edit_event:')) {
        const eventId = cbData.replace('edit_event:', '');
        const supabase = createSupabaseAdminClient();
        const { data: event } = await supabase.from('family_events').select('*').eq('id', eventId).single();
        if (event) {
          // Store the event being edited
          editingState.set(cbChatId, { eventId, originalEvent: event });
          
          const eventDate = new Date(event.start_time).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
          const startTime = new Date(event.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem' });
          const endTime = new Date(event.end_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem' });
          
          await editMessage(cbChatId, cbMsgId, callback.message.text + '\n\n✏️ מצב עריכה - כתבו את האירוע המעודכן');
          await sendToChat(cbChatId, `✏️ <b>עריכת אירוע</b>\n\nכתבו את הפרטים המעודכנים (או שלחו הודעה קולית/תמונה):\n\n<b>האירוע הנוכחי:</b>\n📌 ${event.title}\n👤 ${event.person}\n🗓 ${eventDate}\n🕐 ${startTime} - ${endTime}\n\n💡 האירוע הישן יימחק אוטומטית אחרי הוספת האירוע החדש.\n\nלביטול - שלחו /cancel`, [[
            { text: '❌ ביטול עריכה', callback_data: `cancel_edit:${eventId}` }
          ]]);
        }
      } else if (cbData.startsWith('cancel_edit:')) {
        const eventId = cbData.replace('cancel_edit:', '');
        editingState.delete(cbChatId);
        await editMessage(cbChatId, cbMsgId, 'ביטול עריכה - האירוע נשמר כמו שהיה');
      }
      return NextResponse.json({ ok: true });
    }

    const message = body.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);

    // Handle voice messages
    if (message.voice) {
      await handleVoiceMessage(chatId, message.voice.file_id);
      return NextResponse.json({ ok: true });
    }

    // Handle photo messages
    if (message.photo && message.photo.length > 0) {
      // Get the largest photo
      const photo = message.photo[message.photo.length - 1];
      await handlePhotoMessage(chatId, photo.file_id, message.caption);
      return NextResponse.json({ ok: true });
    }

    // Handle text messages
    if (!message.text) {
      return NextResponse.json({ ok: true });
    }

    const text = message.text.trim();

    if (text === '/today' || text === '/today@hayat_schedule_bot') {
      await handleToday(chatId);
    } else if (text === '/tomorrow' || text === '/tomorrow@hayat_schedule_bot') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await handleDaySchedule(chatId, tomorrow);
    } else if (text === '/week' || text === '/week@hayat_schedule_bot') {
      await handleWeek(chatId);
    } else if (text === '/site' || text === '/site@hayat_schedule_bot') {
      await sendToChat(chatId, `🌐 <b>היומן המשפחתי באתר</b>\n\n📅 כניסה ליומן:\nhttps://klumit-online.co.il/family-schedule\n\n💡 באתר תוכלו לראות את כל האירועים, להוסיף ולערוך בקלות`);
    } else if (text === '/cancel' || text === '/cancel@hayat_schedule_bot') {
      if (editingState.has(chatId)) {
        editingState.delete(chatId);
        await sendToChat(chatId, '❌ ביטול עריכה - האירוע נשמר כמו שהיה');
      } else {
        await sendToChat(chatId, 'אין עריכה פעילה לביטול');
      }
    } else if (text === '/help' || text === '/help@hayat_schedule_bot' || text === '/start' || text === '/start@hayat_schedule_bot') {
      await sendToChat(chatId, `🤖 <b>בוט היומן המשפחתי</b>\n\n📝 <b>להוספת אירוע:</b>\n• כתבו בשפה חופשית\n• שלחו הודעה קולית 🎤\n• שלחו תמונה של לוז/הזמנה 📸\nלדוגמה: "אימון של לורין מחר ב-18:00"\n\n🔍 <b>לשאילתות:</b>\n• "מה יש לי ב-1.3?"\n• "מה יש לי ביום שלישי?"\n• "מה יש לי מחר?"\n\n✏️ <b>לעריכה:</b>\n• "תזיז את הפיאלטיס מרביעי לחמישי באותה שעה"\n• "שנה את האימון של לורין למחר ב-17:00"\n• או השתמשו בכפתורים אחרי הוספת אירוע\n\n📋 <b>פקודות:</b>\n/today - לוז היום\n/tomorrow - לוז מחר\n/week - לוז שבועי\n/site - לינק ליומן באתר\n/cancel - ביטול עריכה\n/help - עזרה`);
    } else if (!text.startsWith('/')) {
      await handleFreeText(chatId, text);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

async function handleToday(chatId: string) {
  const today = new Date();
  await handleDaySchedule(chatId, today);
}

async function handleDaySchedule(chatId: string, date: Date) {
  const supabase = createSupabaseAdminClient();

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: events } = await supabase
    .from('family_events')
    .select('*')
    .gte('start_time', startOfDay.toISOString())
    .lte('start_time', endOfDay.toISOString())
    .order('start_time', { ascending: true });

  const message = buildDailyScheduleMessage(events || [], date);
  await sendToChat(chatId, message);
}

async function handleWeek(chatId: string) {
  const supabase = createSupabaseAdminClient();

  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  sunday.setHours(0, 0, 0, 0);
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  const { data: events } = await supabase
    .from('family_events')
    .select('*')
    .gte('start_time', sunday.toISOString())
    .lte('start_time', saturday.toISOString())
    .order('start_time', { ascending: true });

  const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  if (!events || events.length === 0) {
    await sendToChat(chatId, '📋 <b>לוז שבועי</b>\n\n✨ אין אירועים השבוע!');
    return;
  }

  const byDay: Record<number, typeof events> = {};
  events.forEach(e => {
    const day = new Date(e.start_time).getDay();
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(e);
  });

  let message = `📋 <b>לוז שבועי</b>\n${sunday.getDate()}/${sunday.getMonth() + 1} - ${saturday.getDate()}/${saturday.getMonth() + 1}\n`;

  for (let i = 0; i < 7; i++) {
    const dayEvents = byDay[i];
    if (dayEvents && dayEvents.length > 0) {
      message += `\n<b>📅 יום ${DAYS_HE[i]}:</b>\n`;
      dayEvents.forEach(e => {
        const time = new Date(e.start_time).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem' });
        message += `  ${time} - ${e.title} (${e.person})\n`;
      });
    }
  }

  message += `\n📊 סה"כ ${events.length} אירועים השבוע`;

  await sendToChat(chatId, message);
}

const AI_SYSTEM_PROMPT = `אתה עוזר לפענח טקסט חופשי לאירוע ביומן משפחתי.

האנשים במשפחה: לורין, מור, רון, שי, שחר, כולם
קטגוריות: אימון, חוג, עבודה, משפחה, טיסה, אחר

כללים:
- אם לא צוין שם, ברירת מחדל: כולם
- אם לא צוינה קטגוריה, נסה להסיק. ברירת מחדל: אחר
- אם לא צוין תאריך, השתמש בהיום (שים לב לאזור זמן ישראל)
- אם לא צוינה שעת סיום, הוסף שעה לשעת ההתחלה
- אם צוין יום בשבוע (למשל "יום שני"), חשב את התאריך הקרוב ביותר קדימה
- זהה בקשות תזכורת: "תזכיר לי", "הזכר לי", "שלח תזכורת" וכו'
  * 5 דקות לפני = 5
  * 10 דקות לפני = 10
  * 15 דקות לפני = 15
  * 30 דקות לפני = 30
  * שעה לפני = 60
  * שעתיים לפני = 120
  * יום לפני / 24 שעות לפני = 1440
- החזר JSON בלבד

פורמט תשובה (JSON בלבד):
{
  "title": "שם האירוע",
  "person": "שם האדם",
  "category": "קטגוריה",
  "date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "start_time": "HH:MM",
  "end_time": "HH:MM",
  "recurring": false,
  "reminder_minutes": null או מספר,
  "notes": ""
}`;

async function handleAddEvent(chatId: string, text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await sendToChat(chatId, '❌ שגיאה: חסר מפתח OpenAI');
    return;
  }

  const now = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  const dayName = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][new Date().getDay()];

  try {
    await sendToChat(chatId, '🔄 מעבד...');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT + `\n\nהיום: ${now} (יום ${dayName})` },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) { await sendToChat(chatId, '❌ לא הצלחתי להבין את ההודעה'); return; }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { await sendToChat(chatId, '❌ לא הצלחתי לפענח את האירוע'); return; }

    const parsed = JSON.parse(jsonMatch[0]);
    const endDate = parsed.end_date || parsed.date;
    // Calculate Israel timezone offset (handles DST automatically)
    const ilOffset = (dt: string) => {
      const d = new Date(dt);
      const utc = d.toLocaleString('en-US', { timeZone: 'UTC' });
      const il = d.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });
      return (new Date(il).getTime() - new Date(utc).getTime()) / 3600000;
    };
    const offsetH = ilOffset(new Date().toISOString());
    const pad = (n: number) => `${n >= 0 ? '+' : '-'}${String(Math.abs(n)).padStart(2, '0')}:00`;
    const tz = pad(offsetH);
    const startTime = new Date(`${parsed.date}T${parsed.start_time}:00${tz}`).toISOString();
    const endTime = new Date(`${endDate}T${parsed.end_time}:00${tz}`).toISOString();

    const supabase = createSupabaseAdminClient();
    
    // Check if we're editing an existing event
    const editingInfo = editingState.get(chatId);
    
    const { data: inserted, error } = await supabase.from('family_events').insert({
      title: parsed.title,
      person: parsed.person,
      category: parsed.category,
      start_time: startTime,
      end_time: endTime,
      recurring: parsed.recurring || false,
      reminder_minutes: parsed.reminder_minutes || null,
      notes: parsed.notes || null,
    }).select('id').single();

    if (error) {
      await sendToChat(chatId, `❌ שגיאה בשמירה: ${error.message}`);
      return;
    }

    // If we were editing an event, delete the old one now
    if (editingInfo) {
      await supabase.from('family_events').delete().eq('id', editingInfo.eventId);
      editingState.delete(chatId);
    }

    const DAYS_HE_L = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    const evDay = DAYS_HE_L[new Date(parsed.date).getDay()];
    const multiDay = parsed.end_date && parsed.end_date !== parsed.date;

    let msg = editingInfo 
      ? `✅ <b>אירוע עודכן ביומן!</b>\n\n📌 <b>${parsed.title}</b>\n👤 ${parsed.person}\n🗓 יום ${evDay}, ${parsed.date}`
      : `✅ <b>אירוע נוסף ליומן!</b>\n\n📌 <b>${parsed.title}</b>\n👤 ${parsed.person}\n🗓 יום ${evDay}, ${parsed.date}`;
    if (multiDay) msg += ` עד ${parsed.end_date}`;
    msg += `\n🕐 ${parsed.start_time} - ${parsed.end_time}`;
    if (parsed.reminder_minutes) {
      let reminderText = '';
      if (parsed.reminder_minutes >= 1440) {
        reminderText = 'יום לפני';
      } else if (parsed.reminder_minutes >= 120) {
        reminderText = `${parsed.reminder_minutes / 60} שעות לפני`;
      } else if (parsed.reminder_minutes >= 60) {
        reminderText = 'שעה לפני';
      } else {
        reminderText = `${parsed.reminder_minutes} דקות לפני`;
      }
      msg += `\n⏰ תזכורת: ${reminderText}`;
    }
    if (parsed.notes) msg += `\n📝 ${parsed.notes}`;

    await sendToChat(chatId, msg, [
      [
        { text: '✏️ ערוך אירוע', callback_data: `edit_event:${inserted.id}` },
        { text: '🗑 מחק אירוע', callback_data: `delete_event:${inserted.id}` }
      ]
    ]);

    // Notify all family chat members (except the sender)
    notifyNewEvent({ title: parsed.title, person: parsed.person, category: parsed.category, start_time: startTime, end_time: endTime, notes: parsed.notes || null, reminder_minutes: parsed.reminder_minutes || null }, chatId).catch((err) => {
      console.error('Failed to send notification:', err);
    });
  } catch {
    await sendToChat(chatId, '❌ שגיאה בעיבוד ההודעה');
  }
}

async function handleVoiceMessage(chatId: string, fileId: string) {
  const botToken = process.env.TELEGRAM_CHAT_BOT_HAYAT_SCHEDULE;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!botToken || !apiKey) {
    await sendToChat(chatId, '❌ שגיאה: חסרים מפתחות API');
    return;
  }

  try {
    await sendToChat(chatId, '🎤 מעבד הודעה קולית...');

    // Get file path from Telegram
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result.file_path) {
      await sendToChat(chatId, '❌ לא הצלחתי להוריד את ההודעה הקולית');
      return;
    }

    // Download the voice file
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
    const audioRes = await fetch(fileUrl);
    const audioBuffer = await audioRes.arrayBuffer();

    // Transcribe with OpenAI Whisper
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/ogg' }), 'voice.ogg');
    formData.append('model', 'whisper-1');
    formData.append('language', 'he');

    const transcribeRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData,
    });

    const transcription = await transcribeRes.json();
    if (!transcription.text) {
      await sendToChat(chatId, '❌ לא הצלחתי לתמלל את ההודעה הקולית');
      return;
    }

    await sendToChat(chatId, `📝 תמלול: "${transcription.text}"`);

    // Process the transcribed text as an event
    await handleAddEvent(chatId, transcription.text);
  } catch {
    await sendToChat(chatId, '❌ שגיאה בעיבוד הודעה קולית');
  }
}

async function handlePhotoMessage(chatId: string, fileId: string, caption?: string) {
  const botToken = process.env.TELEGRAM_CHAT_BOT_HAYAT_SCHEDULE;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!botToken || !apiKey) {
    await sendToChat(chatId, '❌ שגיאה: חסרים מפתחות API');
    return;
  }

  try {
    await sendToChat(chatId, '📸 מעבד תמונה...');

    // Get file path from Telegram
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result.file_path) {
      await sendToChat(chatId, '❌ לא הצלחתי להוריד את התמונה');
      return;
    }

    // Get the photo URL
    const photoUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;

    // Use OpenAI Vision API to extract text/info from the image
    const visionRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'אתה עוזר שמפענח תמונות ומחלץ מהן מידע על אירועים. תחלץ תאריכים, שעות, שמות, מקומות וכל מידע רלוונטי. החזר את המידע בעברית בצורה ברורה.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: caption || 'מה כתוב בתמונה? חלץ מידע על אירועים, תאריכים, שעות ופרטים רלוונטיים.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: photoUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    const visionData = await visionRes.json();
    const extractedText = visionData.choices?.[0]?.message?.content;
    
    if (!extractedText) {
      await sendToChat(chatId, '❌ לא הצלחתי לפענח את התמונה');
      return;
    }

    await sendToChat(chatId, `📝 מה מצאתי בתמונה:\n${extractedText}`);

    // Process the extracted text as an event
    await handleAddEvent(chatId, extractedText);
  } catch (error) {
    console.error('Photo processing error:', error);
    await sendToChat(chatId, '❌ שגיאה בעיבוד התמונה');
  }
}

// Handle free text - determine if it's a query, edit, or add event
async function handleFreeText(chatId: string, text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await sendToChat(chatId, '❌ שגיאה: חסר מפתח OpenAI');
    return;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `קבע מה סוג הפעולה שהמשתמש מבקש. החזר רק אחד מהערכים הבאים:
- "query" - אם המשתמש שואל על אירועים (מה יש ב..., מה יש לי ב..., תראה לי מה יש ב...)
- "edit" - אם המשתמש מבקש לערוך/להזיז/לשנות אירוע קיים (תזיז את..., שנה את..., העבר את..., תעדכן את...)
- "add" - בכל מקרה אחר (הוספת אירוע חדש)

החזר JSON בלבד: {"action": "query|edit|add"}` 
          },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 50,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) { 
      await handleAddEvent(chatId, text);
      return; 
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { 
      await handleAddEvent(chatId, text);
      return; 
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (parsed.action === 'query') {
      await handleQuery(chatId, text);
    } else if (parsed.action === 'edit') {
      await handleEditCommand(chatId, text);
    } else {
      await handleAddEvent(chatId, text);
    }
  } catch (error) {
    console.error('Free text classification error:', error);
    await handleAddEvent(chatId, text);
  }
}

// Handle query - "מה יש לי ב-1.3?"
async function handleQuery(chatId: string, text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await sendToChat(chatId, '❌ שגיאה: חסר מפתח OpenAI');
    return;
  }

  const now = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  const dayName = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][new Date().getDay()];

  try {
    await sendToChat(chatId, '🔍 מחפש...');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `חלץ את התאריך שהמשתמש שואל עליו. החזר JSON בלבד:
{"date": "YYYY-MM-DD"}

היום: ${now} (יום ${dayName})
אם צוין יום בשבוע (למשל "יום שני"), חשב את התאריך הקרוב ביותר קדימה.` 
          },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) { 
      await sendToChat(chatId, '❌ לא הצלחתי להבין איזה תאריך');
      return; 
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { 
      await sendToChat(chatId, '❌ לא הצלחתי להבין איזה תאריך');
      return; 
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const queryDate = new Date(parsed.date);
    
    await handleDaySchedule(chatId, queryDate);
  } catch (error) {
    console.error('Query handling error:', error);
    await sendToChat(chatId, '❌ שגיאה בחיפוש');
  }
}

// Handle edit command - "תזיז את הפיאלטיס מרביעי לחמישי"
async function handleEditCommand(chatId: string, text: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    await sendToChat(chatId, '❌ שגיאה: חסר מפתח OpenAI');
    return;
  }

  const now = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
  const dayName = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][new Date().getDay()];

  try {
    await sendToChat(chatId, '🔄 מעבד בקשת עריכה...');

    // First, extract what event to find and what to change
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `חלץ את פרטי העריכה מהבקשה. החזר JSON בלבד:
{
  "search_title": "שם האירוע לחפש (למשל: פיאלטיס, אימון, וכו')",
  "from_day": "יום מקור (שם היום או תאריך YYYY-MM-DD או null)",
  "to_day": "יום יעד (שם היום או תאריך YYYY-MM-DD או null)",
  "new_time": "שעה חדשה HH:MM או null",
  "new_person": "שם חדש או null"
}

היום: ${now} (יום ${dayName})
אם צוין יום בשבוע, החזר את שם היום בעברית (ראשון, שני, שלישי, רביעי, חמישי, שישי, שבת).` 
          },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) { 
      await sendToChat(chatId, '❌ לא הצלחתי להבין את בקשת העריכה');
      return; 
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { 
      await sendToChat(chatId, '❌ לא הצלחתי להבין את בקשת העריכה');
      return; 
    }

    const editRequest = JSON.parse(jsonMatch[0]);
    
    // Find the event
    const supabase = createSupabaseAdminClient();
    
    // Calculate date range to search
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Search last 7 days
    let endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Search next 30 days
    
    // If from_day is specified, narrow the search
    if (editRequest.from_day) {
      const dayMap: Record<string, number> = {
        'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6
      };
      
      if (dayMap[editRequest.from_day] !== undefined) {
        // Find next occurrence of this day
        const today = new Date();
        const targetDay = dayMap[editRequest.from_day];
        const daysUntil = (targetDay - today.getDay() + 7) % 7;
        startDate = new Date(today);
        startDate.setDate(today.getDate() + daysUntil);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    const { data: events } = await supabase
      .from('family_events')
      .select('*')
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .ilike('title', `%${editRequest.search_title}%`)
      .order('start_time', { ascending: true })
      .limit(1);

    if (!events || events.length === 0) {
      await sendToChat(chatId, `❌ לא מצאתי אירוע "${editRequest.search_title}"`);
      return;
    }

    const event = events[0];
    
    // Calculate new date/time
    let newStartTime = new Date(event.start_time);
    let newEndTime = new Date(event.end_time);
    
    // Change day if requested
    if (editRequest.to_day) {
      const dayMap: Record<string, number> = {
        'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6
      };
      
      if (dayMap[editRequest.to_day] !== undefined) {
        const currentDay = newStartTime.getDay();
        const targetDay = dayMap[editRequest.to_day];
        const dayDiff = (targetDay - currentDay + 7) % 7 || 7; // If same day, move to next week
        newStartTime.setDate(newStartTime.getDate() + dayDiff);
        newEndTime.setDate(newEndTime.getDate() + dayDiff);
      }
    }
    
    // Change time if requested
    if (editRequest.new_time) {
      const [hours, minutes] = editRequest.new_time.split(':').map(Number);
      const duration = newEndTime.getTime() - new Date(event.start_time).getTime();
      newStartTime.setHours(hours, minutes, 0, 0);
      newEndTime = new Date(newStartTime.getTime() + duration);
    }
    
    // Update the event
    const { error } = await supabase
      .from('family_events')
      .update({
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        person: editRequest.new_person || event.person,
      })
      .eq('id', event.id);

    if (error) {
      await sendToChat(chatId, `❌ שגיאה בעדכון: ${error.message}`);
      return;
    }

    const DAYS_HE = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    const newDay = DAYS_HE[newStartTime.getDay()];
    const newTime = newStartTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem' });
    const newDate = newStartTime.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
    
    await sendToChat(chatId, `✅ <b>אירוע עודכן!</b>\n\n📌 ${event.title}\n👤 ${editRequest.new_person || event.person}\n🗓 יום ${newDay}, ${newDate}\n🕐 ${newTime}`);
  } catch (error) {
    console.error('Edit command error:', error);
    await sendToChat(chatId, '❌ שגיאה בעריכה');
  }
}
