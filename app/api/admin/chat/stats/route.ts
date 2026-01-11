import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET - סטטיסטיקות צ'אט
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    // ספירת שיחות לפי סטטוס
    const [open, waiting, closed, total] = await Promise.all([
      supabaseAdmin.from('klumit_chat_conversations').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabaseAdmin.from('klumit_chat_conversations').select('*', { count: 'exact', head: true }).eq('status', 'waiting'),
      supabaseAdmin.from('klumit_chat_conversations').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
      supabaseAdmin.from('klumit_chat_conversations').select('*', { count: 'exact', head: true }),
    ]);

    // הודעות היום
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: messagesToday } = await supabaseAdmin
      .from('klumit_chat_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    return NextResponse.json({
      conversations: {
        total: total.count || 0,
        open: open.count || 0,
        waiting: waiting.count || 0,
        closed: closed.count || 0,
      },
      messages_today: messagesToday || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
