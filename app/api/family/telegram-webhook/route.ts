import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildDailyScheduleMessage, sendToChat } from '@/lib/telegram-family';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Telegram sends updates with message object
    const message = body.message;
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    if (text === '/today' || text === '/today@hayat_schedule_bot') {
      await handleToday(chatId);
    } else if (text === '/tomorrow' || text === '/tomorrow@hayat_schedule_bot') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await handleDaySchedule(chatId, tomorrow);
    } else if (text === '/week' || text === '/week@hayat_schedule_bot') {
      await handleWeek(chatId);
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
