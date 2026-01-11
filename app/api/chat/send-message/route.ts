import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendChatMessage } from '@/lib/telegram-chat';

// POST - שליחת הודעה מהאתר
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { conversation_id, message, session_id } = body;

    if (!conversation_id || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const supabaseAdmin = createSupabaseAdminClient();

    // אימות שהשיחה שייכת למשתמש
    let conversation;
    let shouldCreateNew = false;
    
    if (user) {
      // נבדוק קודם לפי user_id
      let { data, error } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .select('*')
        .eq('id', conversation_id)
        .eq('user_id', user.id)
        .single();

      // אם לא נמצא לפי user_id, ננסה לפי session_id ונעדכן
      if ((error || !data) && session_id) {
        const { data: sessionConv } = await supabaseAdmin
          .from('klumit_chat_conversations')
          .select('*')
          .eq('id', conversation_id)
          .eq('session_id', session_id)
          .is('user_id', null)
          .single();

        if (sessionConv) {
          // בדיקה אם השיחה מחוקה
          if (sessionConv.deleted_at) {
            shouldCreateNew = true;
          } else {
            // מיזוג השיחה - עדכון user_id
            const { data: updatedConv, error: updateError } = await supabaseAdmin
              .from('klumit_chat_conversations')
              .update({ user_id: user.id })
              .eq('id', conversation_id)
              .select()
              .single();

            if (updateError || !updatedConv) {
              return NextResponse.json({ error: 'Failed to merge conversation' }, { status: 500 });
            }
            conversation = updatedConv;
          }
        } else {
          shouldCreateNew = true;
        }
      } else if (error || !data) {
        shouldCreateNew = true;
      } else {
        // בדיקה אם השיחה מחוקה
        if (data.deleted_at) {
          shouldCreateNew = true;
        } else {
          conversation = data;
        }
      }
    } else if (session_id) {
      const { data, error } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .select('*')
        .eq('id', conversation_id)
        .eq('session_id', session_id)
        .single();

      if (error || !data) {
        shouldCreateNew = true;
      } else if (data.deleted_at) {
        // השיחה מחוקה - צריך ליצור חדשה
        shouldCreateNew = true;
      } else {
        conversation = data;
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // אם השיחה מחוקה או לא קיימת - יצירת שיחה חדשה
    if (shouldCreateNew) {
      const userEmail = user?.email || user?.user_metadata?.email;
      const userName = user?.user_metadata?.first_name && user?.user_metadata?.last_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : user?.user_metadata?.first_name || user?.user_metadata?.name || null;
      const userPhone = user?.phone || user?.user_metadata?.phone;

      const insertData: any = {
        session_id: session_id || crypto.randomUUID(),
        user_name: userName || null,
        user_phone: userPhone || null,
        user_email: userEmail || null,
        status: 'open',
      };

      if (user) {
        insertData.user_id = user.id;
      }

      const { data: newConversation, error: createError } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .insert(insertData)
        .select()
        .single();

      if (createError || !newConversation) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
      }

      conversation = newConversation;
      conversation_id = newConversation.id; // עדכון conversation_id לשיחה החדשה
    }

    // עדכון פרטי משתמש בשיחה אם משתמש מחובר
    const updateData: {
      status?: string;
      user_name?: string | null;
      user_phone?: string | null;
      user_email?: string | null;
    } = {};
    
    if (conversation.status === 'closed') {
      updateData.status = 'open';
    }
    
    if (user) {
      // עדכון פרטי משתמש אם יש מידע חדש
      const userEmail = user.email || user.user_metadata?.email;
      const userName = user.user_metadata?.first_name && user.user_metadata?.last_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        : user.user_metadata?.first_name || user.user_metadata?.name || null;
      const userPhone = user.phone || user.user_metadata?.phone;
      
      if (userEmail && (!conversation.user_email || conversation.user_email !== userEmail)) {
        updateData.user_email = userEmail;
      }
      if (userName && (!conversation.user_name || conversation.user_name !== userName)) {
        updateData.user_name = userName;
      }
      if (userPhone && (!conversation.user_phone || conversation.user_phone !== userPhone)) {
        updateData.user_phone = userPhone;
      }
    }
    
    // עדכון השיחה אם יש מה לעדכן
    if (Object.keys(updateData).length > 0) {
      const { data: updatedConversation } = await supabaseAdmin
        .from('klumit_chat_conversations')
        .update(updateData)
        .eq('id', conversation_id)
        .select()
        .single();
      
      if (updatedConversation) {
        conversation = updatedConversation;
      }
    }

    // עדכון deleted_at ל-null אם השיחה נמחקה - כדי שתצוף שוב
    // (רק אם לא יצרנו שיחה חדשה)
    if (!shouldCreateNew) {
      await supabaseAdmin
        .from('klumit_chat_conversations')
        .update({ deleted_at: null })
        .eq('id', conversation_id);
    }

    // שמירת הודעה ב-DB
    const { data: savedMessage, error: insertError } = await supabaseAdmin
      .from('klumit_chat_messages')
      .insert({
        conversation_id,
        message,
        from_user: true,
        status: 'sent_to_server',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // שליחה ל-Telegram
    const telegramResult = await sendChatMessage({
      conversationId: conversation_id,
      message,
      userName: conversation.user_name || undefined,
      userPhone: conversation.user_phone || undefined,
      userEmail: conversation.user_email || undefined,
      pageUrl: body.page_url || undefined,
    });

    // עדכון סטטוס ההודעה
    if (telegramResult.success && telegramResult.messageIds && telegramResult.messageIds.length > 0) {
      await supabaseAdmin
        .from('klumit_chat_messages')
        .update({
          status: 'delivered_to_telegram',
          telegram_message_id: telegramResult.messageIds[0], // שמירת הראשון
        })
        .eq('id', savedMessage.id);
    } else {
      await supabaseAdmin
        .from('klumit_chat_messages')
        .update({ status: 'failed' })
        .eq('id', savedMessage.id);
    }

    return NextResponse.json({
      success: telegramResult.success,
      message_id: savedMessage.id,
      conversation_id: conversation_id, // אם נוצרה שיחה חדשה, זה ה-ID החדש
      status: telegramResult.success ? 'delivered_to_telegram' : 'failed',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
