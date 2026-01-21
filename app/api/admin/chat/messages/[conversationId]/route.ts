import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendChatReply } from '@/lib/telegram-chat';

// GET - קבלת הודעות בשיחה (למנהלים)
// אם יש user_id, נטען את כל ההודעות מכל השיחות של המשתמש
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> | { conversationId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const conversationId = resolvedParams.conversationId;

    const supabaseAdmin = createSupabaseAdminClient();
    
    // קבלת פרטי השיחה כדי לבדוק אם יש user_id
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('klumit_chat_conversations')
      .select('user_id, session_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    let messages;
    
    // אם יש user_id - נטען את כל ההודעות מכל השיחות של המשתמש
    if (conversation.user_id) {
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
      // אם אין user_id (אורח) - נטען רק מהשיחה הספציפית
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - שליחת תגובה ממנהל
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> | { conversationId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const conversationId = resolvedParams.conversationId;
    const body = await request.json();
    const { message, send_to_telegram = true } = body;

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // שמירת ההודעה ב-DB
    const { data: savedMessage, error: insertError } = await supabaseAdmin
      .from('klumit_chat_messages')
      .insert({
        conversation_id: conversationId,
        message,
        from_user: false,
        replied_by_name: 'קלומית',
        status: 'delivered_to_telegram',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // שליחה ל-Telegram (אם ביקשו)
    if (send_to_telegram) {
      await sendChatReply({
        conversationId,
        message,
        repliedByChatId: 'web-admin',
        repliedByName: 'Admin',
      });
    }

    return NextResponse.json({
      success: true,
      message: savedMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
