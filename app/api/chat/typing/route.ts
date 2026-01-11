import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendChatAction } from '@/lib/telegram-chat';

// POST - שליחת אינדיקטור "מקליד..." ל-Telegram
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversation_id } = body;

    if (!conversation_id) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // session_id יכול להיות ב-body או ב-query params
    const searchParams = request.nextUrl.searchParams;
    const sessionId = body.session_id || searchParams.get('session_id');

    const supabaseAdmin = createSupabaseAdminClient();

    // אימות שהשיחה שייכת למשתמש
    if (user) {
      const { data } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .select('id')
        .eq('id', conversation_id)
        .eq('user_id', user.id)
        .single();

      if (!data) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else if (sessionId) {
      const { data } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .select('id')
        .eq('id', conversation_id)
        .eq('session_id', sessionId)
        .single();

      if (!data) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // שליחת אינדיקטור "מקליד..."
    const result = await sendChatAction('typing');

    return NextResponse.json({ success: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
