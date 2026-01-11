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
    console.log('=== Telegram webhook received ===', {
      hasMessage: !!update.message,
      hasCallbackQuery: !!update.callback_query,
      callbackData: update.callback_query?.data,
      messageText: update.message?.text,
    });
    
    const supabaseAdmin = createSupabaseAdminClient();

    // טיפול בלחיצה על inline keyboard buttons (קיצורים לתגובה מהירה)
    if (update.callback_query) {
      console.log('=== Callback query received ===', {
        callbackData: update.callback_query.data,
        chatId: update.callback_query.message?.chat?.id,
        messageId: update.callback_query.message?.message_id,
      });
      
      const callbackData = update.callback_query.data;
      const chatId = update.callback_query.message?.chat?.id?.toString();
      
      // פורמט חדש: qr:shortConvId:replyId (קיצור ל-64 בתים)
      if (callbackData?.startsWith('qr:')) {
        // אישור לטלגרם שהלחיצה התקבלה - מיד (לפני כל העיבוד)
        // זה מונע את ה-loading state בכפתור
        const botToken = process.env.TELEGRAM_CHAT_BOT_TOKEN_KLUMIT;
        if (!botToken) {
          console.error('TELEGRAM_CHAT_BOT_TOKEN_KLUMIT is not set');
          return NextResponse.json({ ok: true });
        }
        
        try {
          const answerResponse = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: update.callback_query.id,
            }),
          });
          const answerData = await answerResponse.json();
          console.log('Callback query answered (qr:) - immediately:', answerData);
          if (!answerData.ok) {
            console.error('Failed to answer callback query:', answerData);
          }
        } catch (answerError) {
          console.error('Error answering callback query:', answerError);
        }
        
        const parts = callbackData.split(':');
        console.log('Parsing callback data:', { parts, length: parts.length });
        
        if (parts.length >= 3) {
          const conversationId = parts[1]; // UUID מלא (36 תווים)
          const replyId = parts[2]; // ID של התגובה המהירה
          
          console.log('Quick reply:', { conversationId, replyId });
          
          // מיפוי של quick replies
          const quickRepliesMap: Record<string, string> = {
            'hi': 'היי! איך אפשר לעזור לך היום?'
          };
          
          const replyMessage = quickRepliesMap[replyId];
          
          if (!replyMessage) {
            console.error('Unknown reply ID:', replyId, 'Available:', Object.keys(quickRepliesMap));
            return NextResponse.json({ ok: true });
          }
          
          // בדיקה שהשיחה קיימת (למקרה של UUID לא תקין)
          const { data: conversation, error: findError } = await supabaseAdmin
            .from('klumit_chat_conversations')
            .select('id')
            .eq('id', conversationId)
            .single();
          
          if (findError || !conversation) {
            console.error('Conversation not found for ID:', conversationId, 'Error:', findError?.message);
            return NextResponse.json({ ok: true });
          }
          
          console.log('Found conversation:', conversationId);
          
          // שמירת התגובה ב-DB
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

          if (insertError) {
            console.error('Error saving quick reply:', insertError);
          } else {
            console.log('Quick reply saved:', savedMessage?.id, 'for conversation:', conversationId);
            
            // עדכון השיחה - סגירת needs_response
            await supabaseAdmin
              .from('klumit_chat_conversations')
              .update({ 
                needs_response: false,
                status: 'open',
                deleted_at: null, // אם השיחה הייתה מחוקה, נשחזר אותה
              })
              .eq('id', conversationId);
            
            // שליחה ל-CHAT_ID השני (אינדיקטור)
            try {
              console.log('Sending chat reply to Telegram for conversation:', conversationId);
              const replyResult = await sendChatReply({
                conversationId,
                message: replyMessage,
                repliedByChatId: chatId || 'quick-reply',
                repliedByName: 'קלומית',
              });
              console.log('Chat reply result:', replyResult);
            } catch (sendError) {
              console.error('Error sending chat reply:', sendError);
            }
          }
        } else {
          console.error('Invalid callback data format - expected qr:shortConvId:replyId, got:', callbackData);
        }
        
        return NextResponse.json({ ok: true });
      }
      
      // תמיכה בפורמט הישן (לצורך תאימות לאחור)
      if (callbackData?.startsWith('quick_reply:')) {
          // אישור לטלגרם שהלחיצה התקבלה - מיד (לפני כל העיבוד)
          const botToken = process.env.TELEGRAM_CHAT_BOT_TOKEN_KLUMIT;
          if (!botToken) {
            console.error('TELEGRAM_CHAT_BOT_TOKEN_KLUMIT is not set');
            return NextResponse.json({ ok: true });
          }
          
          try {
            const answerResponse = await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: update.callback_query.id,
            }),
          });
          const answerData = await answerResponse.json();
          console.log('Callback query answered (quick_reply:) - immediately:', answerData);
          if (!answerData.ok) {
            console.error('Failed to answer callback query:', answerData);
          }
        } catch (answerError) {
          console.error('Error answering callback query:', answerError);
        }
        
        // פורמט: quick_reply:conversation_id:message
        const parts = callbackData.split(':');
        if (parts.length >= 3) {
          const conversationId = parts[1];
          const replyMessage = decodeURIComponent(parts.slice(2).join(':')); // במקרה שיש : בטקסט
          
          // שמירת התגובה ב-DB
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

          if (insertError) {
            console.error('Error saving quick reply:', insertError);
          } else {
            console.log('Quick reply saved:', savedMessage?.id, 'for conversation:', conversationId);
            
            // עדכון השיחה - סגירת needs_response
            await supabaseAdmin
              .from('klumit_chat_conversations')
              .update({ 
                needs_response: false,
                status: 'open',
                deleted_at: null, // אם השיחה הייתה מחוקה, נשחזר אותה
              })
              .eq('id', conversationId);
            
            // שליחה ל-CHAT_ID השני (אינדיקטור)
            try {
              console.log('Sending chat reply to Telegram for conversation:', conversationId);
              const replyResult = await sendChatReply({
                conversationId,
                message: replyMessage,
                repliedByChatId: chatId || 'quick-reply',
                repliedByName: 'קלומית',
              });
              console.log('Chat reply result:', replyResult);
            } catch (sendError) {
              console.error('Error sending chat reply:', sendError);
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
        
        // תמיד נציג "קלומית" כשעונים מטלגרם
        const repliedByName = 'קלומית';

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
          
          // עדכון השיחה - סגירת needs_response
          await supabaseAdmin
            .from('klumit_chat_conversations')
            .update({ 
              needs_response: false,
              status: 'open',
              deleted_at: null, // אם השיחה הייתה מחוקה, נשחזר אותה
            })
            .eq('id', conversationId);
          
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
              
              // תמיד נציג "קלומית" כשעונים מטלגרם
              const repliedByName = 'קלומית';

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
                
                // עדכון השיחה - סגירת needs_response
                await supabaseAdmin
                  .from('klumit_chat_conversations')
                  .update({ 
                    needs_response: false,
                    status: 'open',
                    deleted_at: null, // אם השיחה הייתה מחוקה, נשחזר אותה
                  })
                  .eq('id', conversationId);
                
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
