import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET - קבלת הודעות בשיחה
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> | { conversationId: string } }
) {
  try {
    // Next.js 15+ uses async params
    const resolvedParams = await Promise.resolve(params);
    const conversationId = resolvedParams.conversationId;
    
    if (!conversationId || conversationId === 'undefined') {
      return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    // אם משתמש מחובר - נבדוק שהשיחה שייכת לו
    if (user) {
      const supabaseAdmin = createSupabaseAdminClient();
      
      // נבדוק אם השיחה שייכת למשתמש (עם Service Role כדי לעקוף RLS)
      const { data: conversation, error: convError } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .select('id, user_id, session_id')
        .eq('id', conversationId)
        .single();

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // בדיקה שהשיחה שייכת למשתמש (user_id) או עדיין משויכת ל-session_id (אם עדיין לא מוזגה)
      const isUserConversation = conversation.user_id === user.id;
      // אם יש session_id, נבדוק גם אם השיחה עדיין משויכת ל-session_id (גם אם יש user_id - יכול להיות שהמיזוג קרה אבל השיחה עדיין משויכת לשניהם)
      const isSessionConversation = sessionId && conversation.session_id === sessionId;

      if (!isUserConversation && !isSessionConversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      let messages;
      
      // אם השיחה שייכת למשתמש (user_id) - נטען את כל ההודעות מכל השיחות שלו
      if (isUserConversation && conversation.user_id) {
        // מציאת כל השיחות של המשתמש
        const { data: allConversations, error: conversationsError } = await supabaseAdmin
          .from('klumit_chat_conversations')
          .select('id')
          .eq('user_id', conversation.user_id);

        if (conversationsError) {
          return NextResponse.json({ error: conversationsError.message }, { status: 500 });
        }

        const conversationIds = (allConversations || []).map(c => c.id);
        
        // טעינת כל ההודעות מכל השיחות
        const { data: allMessages, error } = await supabaseAdmin
          .from('klumit_chat_messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: true });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        messages = allMessages || [];
      } else {
        // אם השיחה עדיין לא מוזגה (session_id) - נטען רק מהשיחה הספציפית
        const { data, error } = await supabaseAdmin
          .from('klumit_chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        messages = data || [];
      }

      return NextResponse.json({ messages });
    }

    // אם משתמש אנונימי - נשתמש ב-Service Role
    if (sessionId) {
      const supabaseAdmin = createSupabaseAdminClient();
      
      // בדיקה שהשיחה קיימת (ללא session_id check קודם)
      const { data: anyConv, error: anyConvError } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .select('id, session_id')
        .eq('id', conversationId)
        .single();

      if (!anyConv) {
        return NextResponse.json({ 
          error: 'Conversation not found',
          debug: { conversationId }
        }, { status: 404 });
      }

      const conversation = anyConv;

      const { data: messages, error } = await supabaseAdmin
        .from('klumit_chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ messages: messages || [] });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
