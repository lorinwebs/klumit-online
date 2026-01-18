import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendChatReply, getTelegramChatName } from '@/lib/telegram-chat';

// POST - Webhook מ-Telegram
export async function POST(request: NextRequest) {
  try {
    // אימות webhook (secret token) - רק אם מוגדר
    const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    
    if (expectedToken) {
      if (!secretToken || secretToken !== expectedToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const update = await request.json();
    
    const supabaseAdmin = createSupabaseAdminClient();

    if (update.callback_query) {
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.message?.chat?.id?.toString();
      
      if (callbackData?.startsWith('qr:')) {
        const botToken = process.env.TELEGRAM_CHAT_BOT_TOKEN_KLUMIT;
        if (!botToken) {
          return NextResponse.json({ ok: true });
        }
        
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: update.callback_query.id,
            }),
          });
        } catch (answerError) {
          // Silent fail
        }
        
        const parts = callbackData.split(':');
        
        if (parts.length >= 3) {
          const conversationId = parts[1];
          const replyId = parts[2];
          
          const quickRepliesMap: Record<string, string> = {
            'hi': 'היי! איך אפשר לעזור לך היום?'
          };
          
          const replyMessage = quickRepliesMap[replyId];
          
          if (!replyMessage) {
            return NextResponse.json({ ok: true });
          }
          
          const { data: conversation, error: findError } = await supabaseAdmin
            .from('klumit_chat_conversations')
            .select('id')
            .eq('id', conversationId)
            .single();
          
          if (findError || !conversation) {
            return NextResponse.json({ ok: true });
          }
          
          const { data: savedMessage, error: insertError } = await supabaseAdmin
            .from('klumit_chat_messages')
            .insert({
              conversation_id: conversationId,
              message: replyMessage,
              from_user: false,
              telegram_chat_id: chatId,
              replied_by_name: 'קלומית',
              status: 'delivered_to_telegram',
            })
            .select()
            .single();

          if (!insertError && savedMessage) {
            await supabaseAdmin
              .from('klumit_chat_conversations')
              .update({ 
                needs_response: false,
                status: 'open',
                deleted_at: null,
              })
              .eq('id', conversationId);
            
            try {
              await sendChatReply({
                conversationId,
                message: replyMessage,
                repliedByChatId: chatId || 'quick-reply',
                repliedByName: 'קלומית',
              });
            } catch (sendError) {
              // Silent fail
            }
          }
        }
        
        return NextResponse.json({ ok: true });
      }
      
      if (callbackData?.startsWith('quick_reply:')) {
        const botToken = process.env.TELEGRAM_CHAT_BOT_TOKEN_KLUMIT;
        if (!botToken) {
          return NextResponse.json({ ok: true });
        }
        
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: update.callback_query.id,
            }),
          });
        } catch (answerError) {
          // Silent fail
        }
        
        const parts = callbackData.split(':');
        if (parts.length >= 3) {
          const conversationId = parts[1];
          const replyMessage = decodeURIComponent(parts.slice(2).join(':'));
          
          const { data: savedMessage, error: insertError } = await supabaseAdmin
            .from('klumit_chat_messages')
            .insert({
              conversation_id: conversationId,
              message: replyMessage,
              from_user: false,
              telegram_chat_id: chatId,
              replied_by_name: 'קלומית',
              status: 'delivered_to_telegram',
            })
            .select()
            .single();

          if (!insertError && savedMessage) {
            await supabaseAdmin
              .from('klumit_chat_conversations')
              .update({ 
                needs_response: false,
                status: 'open',
                deleted_at: null,
              })
              .eq('id', conversationId);
            
            try {
              await sendChatReply({
                conversationId,
                message: replyMessage,
                repliedByChatId: chatId || 'quick-reply',
                repliedByName: 'קלומית',
              });
            } catch (sendError) {
              // Silent fail
            }
          }
        }
        
        return NextResponse.json({ ok: true });
      }
    }

    // רק הודעות טקסט
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const messageText = update.message.text;
    const chatId = update.message.chat.id.toString();
    const messageId = update.message.message_id;

    if (update.message.reply_to_message) {
      const originalMsgId = update.message.reply_to_message.message_id.toString();
      
      const { data: originalDbMsg, error: findError } = await supabaseAdmin
        .from('klumit_chat_messages')
        .select('conversation_id, id, message')
        .eq('telegram_message_id', originalMsgId)
        .maybeSingle();

      if (originalDbMsg && originalDbMsg.conversation_id) {
        const conversationId = originalDbMsg.conversation_id;
        const repliedByName = 'קלומית';

        const { data: savedMessage, error: insertError } = await supabaseAdmin
          .from('klumit_chat_messages')
          .insert({
            conversation_id: conversationId,
            message: messageText,
            from_user: false,
            telegram_chat_id: chatId,
            replied_by_name: repliedByName,
            status: 'delivered_to_telegram',
          })
          .select()
          .single();

        if (insertError) {
          return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
        }
        
        if (savedMessage) {
          await supabaseAdmin
            .from('klumit_chat_conversations')
            .update({ 
              needs_response: false,
              status: 'open',
              deleted_at: null,
            })
            .eq('id', conversationId);
          
          try {
            await sendChatReply({
              conversationId,
              message: messageText,
              repliedByChatId: chatId,
              repliedByName,
            });
          } catch (sendError) {
            // Silent fail
          }
        }
      } else if (update.message.reply_to_message?.text) {
        const originalText = update.message.reply_to_message.text;
        const { data: textSearch } = await supabaseAdmin
          .from('klumit_chat_messages')
          .select('conversation_id, id, message, telegram_message_id')
          .eq('from_user', true)
          .ilike('message', `%${originalText.slice(0, 50)}%`)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (textSearch && textSearch.length > 0) {
          const foundConversation = textSearch[0];
          if (foundConversation.conversation_id) {
            const conversationId = foundConversation.conversation_id;
            const repliedByName = 'קלומית';

            const { data: savedMessage, error: insertError } = await supabaseAdmin
              .from('klumit_chat_messages')
              .insert({
                conversation_id: conversationId,
                message: messageText,
                from_user: false,
                telegram_chat_id: chatId,
                replied_by_name: repliedByName,
                status: 'delivered_to_telegram',
              })
              .select()
              .single();

            if (!insertError && savedMessage) {
              await supabaseAdmin
                .from('klumit_chat_conversations')
                .update({ 
                  needs_response: false,
                  status: 'open',
                  deleted_at: null,
                })
                .eq('id', conversationId);
              
              try {
                await sendChatReply({
                  conversationId,
                  message: messageText,
                  repliedByChatId: chatId,
                  repliedByName,
                });
              } catch (sendError) {
                // Silent fail
              }
            }
          }
        }
      }
    } else if (messageText.startsWith('/reply ')) {
      // פקודה ישירה: /reply [uuid] [text]
      const parts = messageText.split(' ');
      if (parts.length >= 3) {
        const conversationId = parts[1];
        const replyText = parts.slice(2).join(' ');

        // תמיד נציג "קלומית" כשעונים מטלגרם
        const repliedByName = 'קלומית';

        // שמירת התגובה ב-DB
        await supabaseAdmin
          .from('klumit_chat_messages')
          .insert({
            conversation_id: conversationId,
            message: replyText,
            from_user: false,
            telegram_chat_id: chatId,
            replied_by_name: repliedByName,
            status: 'delivered_to_telegram',
          });

        // שליחה ל-CHAT_ID השני
        await sendChatReply({
          conversationId,
          message: replyText,
          repliedByChatId: chatId,
          repliedByName,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: true }); // תמיד להחזיר 200 כדי ש-Telegram לא ינסה שוב
  }
}
