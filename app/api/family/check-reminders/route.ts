import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendToAllChats } from '@/lib/telegram-family';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Get current time in Israel timezone
    const nowIL = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });
    const now = new Date(nowIL);
    
    // Query events that:
    // 1. Have a reminder_minutes set
    // 2. Start time is in the future
    // 3. Reminder time is now or in the past (start_time - reminder_minutes <= now)
    
    const { data: events, error } = await supabase
      .from('family_events')
      .select('*')
      .not('reminder_minutes', 'is', null)
      .gte('start_time', now.toISOString());
    
    if (error) {
      console.error('Error fetching events for reminders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    const remindersToSend: any[] = [];
    
    for (const event of events || []) {
      const startTime = new Date(event.start_time);
      const reminderTime = new Date(startTime.getTime() - (event.reminder_minutes * 60 * 1000));
      
      // Check if reminder should be sent (within the last 5 minutes to avoid duplicates)
      const timeDiff = now.getTime() - reminderTime.getTime();
      if (timeDiff >= 0 && timeDiff < 5 * 60 * 1000) { // 0-5 minutes ago
        remindersToSend.push(event);
      }
    }
    
    // Send reminders
    const results = await Promise.all(
      remindersToSend.map(async (event) => {
        try {
          const startDate = new Date(event.start_time);
          const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
          const dayName = DAYS_HE[startDate.getDay()];
          const dateStr = `${startDate.getDate()}/${startDate.getMonth() + 1}`;
          const timeStr = startDate.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem' });
          
          const CATEGORY_EMOJI: Record<string, string> = {
            'אימון': '🏋️',
            'חוג': '🎨',
            'עבודה': '💼',
            'משפחה': '👨‍👩‍👧‍👧',
            'טיסה': '✈️',
            'אחר': '📌',
          };
          
          const catEmoji = CATEGORY_EMOJI[event.category] || '📌';
          
          let reminderText = '';
          if (event.reminder_minutes >= 1440) {
            reminderText = `יום לפני`;
          } else if (event.reminder_minutes >= 120) {
            reminderText = `${event.reminder_minutes / 60} שעות לפני`;
          } else if (event.reminder_minutes >= 60) {
            reminderText = `שעה לפני`;
          } else {
            reminderText = `${event.reminder_minutes} דקות לפני`;
          }
          
          const message = `⏰ <b>תזכורת!</b>

${catEmoji} <b>${event.title}</b>
👤 ${event.person}
🗓 יום ${dayName}, ${dateStr}
🕐 <b>${timeStr}</b>

📌 ${reminderText}`;
          
          // Send to all family members
          const success = await sendToAllChats(message);
          return { eventId: event.id, success };
        } catch (err) {
          console.error(`Failed to send reminder for event ${event.id}:`, err);
          return { eventId: event.id, success: false, error: err };
        }
      })
    );
    
    return NextResponse.json({ 
      success: true, 
      remindersChecked: events?.length || 0,
      remindersSent: remindersToSend.length,
      results 
    });
  } catch (error: any) {
    console.error('Error in check-reminders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
