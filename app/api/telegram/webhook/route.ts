import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { sendChatReply, getTelegramChatName } from '@/lib/telegram-chat';

// POST - Webhook מ-Telegram
export async function POST(request: NextRequest) {
  try {
    // אימות webhook (secret token) - רק אם מוגדר
    const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
    const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    
    // אם יש secret token מוגדר - נדרוש אותו
    // אם אין - נמשיך בלי אימות (לצורך פיתוח/פרודקשן ללא secret)
    if (expectedToken) {
      if (!secretToken || secretToken !== expectedToken) {
        console.error('Webhook authentication failed - missing or invalid secret token');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const update = await request.json();

    // רק הודעות טקסט
    if (!update.message || !update.message.text) {
      return NextResponse.json({ ok: true });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const messageText = update.message.text;
    const chatId = update.message.chat.id.toString();
    const messageId = update.message.message_id;

    // זיהוי Reply
    if (update.message.reply_to_message) {
      const originalMsgId = update.message.reply_to_message.message_id.toString();
      
      console.log('Received reply to telegram message_id:', originalMsgId);
      
      // מציאת השיחה לפי ההודעה המקורית בטלגרם
      // נשתמש ב-maybeSingle() במקום single() כדי לא לזרוק שגיאה אם לא נמצא
      const { data: originalDbMsg, error: findError } = await supabaseAdmin
        .from('klumit_chat_messages')
        .select('conversation_id, id, message')
        .eq('telegram_message_id', originalMsgId)
        .maybeSingle();

      if (findError) {
        console.error('Error finding original message:', findError);
      }

      if (originalDbMsg && originalDbMsg.conversation_id) {
        // זו תשובה לשיחה קיימת!
        const conversationId = originalDbMsg.conversation_id;
        console.log('Found conversation:', conversationId, 'for telegram_message_id:', originalMsgId);
        
        // קבלת שם של מי ענה
        const repliedByName = await getTelegramChatName(chatId) || 
                              update.message.from?.first_name || 
                              update.message.from?.username ||
                              'Unknown';

        // שמירת התגובה ב-DB
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
          console.error('Error saving reply message:', insertError);
          return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
        } else {
          console.log('Reply message saved successfully:', savedMessage?.id, 'for conversation:', conversationId);
          
          // שליחה ל-CHAT_ID השני עם אינדיקטור "נענה"
          try {
            await sendChatReply({
              conversationId,
              message: messageText,
              repliedByChatId: chatId,
              repliedByName,
            });
          } catch (sendError) {
            console.error('Error sending chat reply:', sendError);
            // לא נזרוק שגיאה - ההודעה כבר נשמרה ב-DB
          }

          // Realtime broadcast (עדכון אוטומטי דרך Supabase Realtime)
          // זה יעבוד אוטומטית כי ההודעה נשמרה ב-DB
          // למשתמשים אנונימיים - ה-polling יטען את ההודעה
        }
      } else {
        console.log('Original message not found for telegram_message_id:', originalMsgId);
        
        // ננסה לחפש לפי ההודעה המקורית עצמה (reply_to_message.text)
        // כדי למצוא את ה-conversation_id
        if (update.message.reply_to_message?.text) {
          const originalText = update.message.reply_to_message.text;
          // נחפש הודעות מהמשתמש (from_user = true) עם הטקסט הזה
          // ונקח את האחרונה (הכי קרובה)
          const { data: textSearch } = await supabaseAdmin
            .from('klumit_chat_messages')
            .select('conversation_id, id, message, telegram_message_id')
            .eq('from_user', true)
            .ilike('message', `%${originalText.slice(0, 50)}%`) // חיפוש חלקי
            .order('created_at', { ascending: false })
            .limit(5);
          
          console.log('Text search result:', textSearch);
          
          if (textSearch && textSearch.length > 0) {
            // נקח את השיחה האחרונה (הכי קרובה)
            const foundConversation = textSearch[0];
            if (foundConversation.conversation_id) {
              const conversationId = foundConversation.conversation_id;
              console.log('Found conversation by text:', conversationId);
              
              // קבלת שם של מי ענה
              const repliedByName = await getTelegramChatName(chatId) || 
                                    update.message.from?.first_name || 
                                    update.message.from?.username ||
                                    'Unknown';

              // שמירת התגובה ב-DB
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
                console.error('Error saving reply message:', insertError);
                return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
              } else {
                console.log('Reply message saved successfully (by text search):', savedMessage?.id, 'for conversation:', conversationId);
                
                // שליחה ל-CHAT_ID השני עם אינדיקטור "נענה"
                try {
                  await sendChatReply({
                    conversationId,
                    message: messageText,
                    repliedByChatId: chatId,
                    repliedByName,
                  });
                } catch (sendError) {
                  console.error('Error sending chat reply:', sendError);
                }
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

        const repliedByName = await getTelegramChatName(chatId) || 
                              update.message.from?.first_name || 
                              'Unknown';

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
