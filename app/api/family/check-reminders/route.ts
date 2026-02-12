import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendToAllChats } from '@/lib/telegram-family';

// Support both GET and POST for manual testing
export async function GET(request: NextRequest) {
  return handleCheckReminders();
}

export async function POST(request: NextRequest) {
  return handleCheckReminders();
}

async function handleCheckReminders() {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Get current time (UTC)
    const now = new Date();
    console.log('[check-reminders] Current time (UTC):', now.toISOString());
    
    // Query events that:
    // 1. Have a reminder_minutes set
    // 2. Start time is in the future (or recently passed - within 1 hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const { data: events, error } = await supabase
      .from('family_events')
      .select('*')
      .not('reminder_minutes', 'is', null)
      .gte('start_time', oneHourAgo.toISOString());
    
    if (error) {
      console.error('Error fetching events for reminders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log(`[check-reminders] Found ${events?.length || 0} events with reminders`);
    
    const remindersToSend: any[] = [];
    const nowMs = now.getTime();
    
    for (const event of events || []) {
      const startTime = new Date(event.start_time);
      const reminderTime = new Date(startTime.getTime() - (event.reminder_minutes * 60 * 1000));
      
      // Check if reminder should be sent (within the last 6 minutes to have buffer)
      const timeDiff = nowMs - reminderTime.getTime();
      const timeDiffMinutes = timeDiff / (60 * 1000);
      
      console.log(`[check-reminders] Event: ${event.title}, Start: ${startTime.toISOString()}, Reminder: ${reminderTime.toISOString()}, Diff: ${timeDiffMinutes.toFixed(2)} minutes`);
      
      if (timeDiff >= 0 && timeDiff < 6 * 60 * 1000) { // 0-6 minutes ago
        console.log(`[check-reminders] ✅ Sending reminder for: ${event.title}`);
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
