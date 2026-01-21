import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendChatReply } from '@/lib/whatsapp-chat';

// GET - Webhook verification (נדרש על ידי WhatsApp)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// POST - Webhook מ-WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // WhatsApp שולח webhook עם מבנה שונה
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid object' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // עיבוד כל ה-entry entries
    for (const entry of body.entry || []) {
      const changes = entry.changes || [];
      
      for (const change of changes) {
        if (change.value?.messages) {
          // עיבוד כל ההודעות
          for (const message of change.value.messages) {
            // רק הודעות טקסט
            if (message.type !== 'text') {
              continue;
            }

            const messageText = message.text?.body;
            const messageId = message.id;
            const fromPhone = message.from; // מספר טלפון של השולח

            if (!messageText) {
              continue;
            }

            // בדיקה אם זו תגובה להודעה קיימת
            // WhatsApp שולח context.referred_product רק למוצרים, לא להודעות טקסט
            // עבור הודעות טקסט, context.id מכיל את ה-message_id של ההודעה המקורית
            
            // חיפוש שיחה לפי הודעה קודמת (אם יש context)
            let conversationId: string | null = null;
            
            if (message.context?.id) {
              // יש context - זו תגובה להודעה קודמת
              const originalMessageId = message.context.id;
              
              // חיפוש ב-DB לפי whatsapp_message_id
              const { data: originalDbMsg } = await supabaseAdmin
                .from('klumit_chat_messages')
                .select('conversation_id, id, message')
                .eq('whatsapp_message_id', originalMessageId)
                .maybeSingle();

              if (originalDbMsg && originalDbMsg.conversation_id) {
                conversationId = originalDbMsg.conversation_id;
              }
            }

            // אם לא מצאנו שיחה, נחפש לפי פקודה או ניצור חדשה
            if (!conversationId) {
              // פקודה ישירה: /reply [uuid] [text]
              if (messageText.startsWith('/reply ')) {
                const parts = messageText.split(' ');
                if (parts.length >= 3) {
                  conversationId = parts[1];
                  const replyText = parts.slice(2).join(' ');

                  const repliedByName = 'קלומית';

                  // שמירת התגובה ב-DB
                  const { data: savedMessage } = await supabaseAdmin
                    .from('klumit_chat_messages')
                    .insert({
                      conversation_id: conversationId,
                      message: replyText,
                      from_user: false,
                      whatsapp_phone: fromPhone,
                      replied_by_name: repliedByName,
                      status: 'delivered_to_whatsapp',
                      whatsapp_message_id: messageId,
                    })
                    .select()
                    .single();

                  if (savedMessage && conversationId && fromPhone) {
                    await supabaseAdmin
                      .from('klumit_chat_conversations')
                      .update({ 
                        needs_response: false,
                        status: 'open',
                        deleted_at: null,
                      })
                      .eq('id', conversationId);
                    
                    // שליחת תגובה ל-WhatsApp (אופציונלי - כדי לאשר שהתגובה נשמרה)
                    await sendChatReply({
                      conversationId,
                      message: replyText,
                      repliedByChatId: fromPhone,
                      repliedByName,
                      originalMessageId: messageId,
                    });
                  }
                }
                continue;
              }
              
              // אם אין שיחה ולא פקודה - נדלג
              continue;
            }

            // שמירת התגובה ב-DB
            const repliedByName = 'קלומית';

            const { data: savedMessage, error: insertError } = await supabaseAdmin
              .from('klumit_chat_messages')
              .insert({
                conversation_id: conversationId,
                message: messageText,
                from_user: false,
                whatsapp_phone: fromPhone,
                replied_by_name: repliedByName,
                status: 'delivered_to_whatsapp',
                whatsapp_message_id: messageId,
              })
              .select()
              .single();

            if (insertError) {
              console.error('Error saving WhatsApp message:', insertError);
              continue;
            }

            if (savedMessage && conversationId && fromPhone) {
              await supabaseAdmin
                .from('klumit_chat_conversations')
                .update({ 
                  needs_response: false,
                  status: 'open',
                  deleted_at: null,
                })
                .eq('id', conversationId);
              
              // שליחת תגובה ל-WhatsApp (אופציונלי)
              await sendChatReply({
                conversationId,
                message: messageText,
                repliedByChatId: fromPhone,
                repliedByName,
                originalMessageId: message.context?.id,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ success: true }); // תמיד להחזיר 200 כדי ש-WhatsApp לא ינסה שוב
  }
}
