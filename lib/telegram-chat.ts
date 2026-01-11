// Telegram Bot for Chat System
// Bot מיוחד להודעות צ'אט
// Token: 8562898707:AAGUimoO2VTbdvjgHr2nKOVFAY1WtbCRGhI

import { escapeHtml } from './telegram';

const TELEGRAM_CHAT_BOT_TOKEN = process.env.TELEGRAM_CHAT_BOT_TOKEN_KLUMIT || '8562898707:AAGUimoO2VTbdvjgHr2nKOVFAY1WtbCRGhI';
const TELEGRAM_CHAT_IDS_RAW = process.env.TELEGRAM_CHAT_ID_KLUMIT || '';
const TELEGRAM_CHAT_IDS = TELEGRAM_CHAT_IDS_RAW
  .split(',')
  .map(id => id.trim())
  .filter(id => id.length > 0);

// Debug log removed for production

interface TelegramChatMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_to_message_id?: number;
  disable_web_page_preview?: boolean;
  reply_markup?: {
    inline_keyboard: Array<Array<{
      text: string;
      callback_data: string;
    }>>;
  };
}

interface TelegramChatAction {
  chat_id: string;
  action: 'typing' | 'upload_photo' | 'record_video' | 'upload_video' | 'record_voice' | 'upload_voice' | 'upload_document' | 'find_location' | 'record_video_note' | 'upload_video_note';
}

/**
 * שליחת הודעת צ'אט ל-Telegram
 * מחזיר את messageIds מהתגובות
 */
export async function sendChatMessage(data: {
  conversationId: string;
  message: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  pageUrl?: string;
}): Promise<{ success: boolean; messageIds?: string[] }> {
  if (!TELEGRAM_CHAT_BOT_TOKEN) {
    // TELEGRAM_CHAT_BOT_TOKEN is missing
    return { success: false };
  }
  
  if (TELEGRAM_CHAT_IDS.length === 0) {
    return { success: false };
  }

  try {
    // עיבוד pageUrl - הצגת domain + path (ללא protocol ו-port)
    let pageUrlDisplay = 'לא צוין';
    if (data.pageUrl) {
      try {
        const url = new URL(data.pageUrl);
        // נציג את ה-hostname (domain) + pathname (path)
        let hostname = url.hostname;
        // נסיר את ה-www אם קיים
        if (hostname.startsWith('www.')) {
          hostname = hostname.replace(/^www\./, '');
        }
        // נשאיר את ה-port אם קיים (למשל :3000)
        if (url.port) {
          hostname = `${hostname}:${url.port}`;
        }
        
        // נצרף את ה-pathname אם קיים
        const pathname = url.pathname;
        if (pathname && pathname !== '/') {
          pageUrlDisplay = `${hostname}${pathname}`;
        } else {
          pageUrlDisplay = hostname;
        }
      } catch {
        // אם זה לא URL תקין, ננסה לחלץ את ה-domain + path ידנית
        const urlWithoutProtocol = data.pageUrl.replace(/^https?:\/\//, '');
        const parts = urlWithoutProtocol.split('/');
        if (parts.length > 0) {
          let domain = parts[0];
          // נשאיר את ה-port אם קיים (למשל :3000)
          // נסיר את ה-www אם קיים
          domain = domain.replace(/^www\./, '');
          
          if (parts.length > 1) {
            // יש path
            const path = '/' + parts.slice(1).join('/');
            pageUrlDisplay = `${domain}${path}`;
          } else {
            pageUrlDisplay = domain;
          }
        }
      }
    }

    const messageText = `💬 <b>הודעה חדשה משיחה #${escapeHtml(data.conversationId.slice(0, 8))}</b>

👤 משתמש: ${data.userName ? escapeHtml(data.userName) : 'לא צוין'}
📱 טלפון: ${data.userPhone ? `<code>${escapeHtml(data.userPhone)}</code>` : 'לא צוין'}
📧 אימייל: ${data.userEmail ? escapeHtml(data.userEmail) : 'לא צוין'}
🔗 עמוד: ${escapeHtml(pageUrlDisplay)}

${escapeHtml(data.message)}`;

    const messageIds: string[] = [];
    
    // קיצורים לתגובה מהירה
    const quickReplies = [
      { text: 'היי! איך אפשר לעזור לך היום?', reply: 'היי! איך אפשר לעזור לך היום?' }
    ];
    
    // יצירת inline keyboard
    const inlineKeyboard = quickReplies.map(reply => ({
      text: reply.text,
      callback_data: `quick_reply:${data.conversationId}:${encodeURIComponent(reply.reply)}`
    }));
    
    // Send to all chat IDs
    const results = await Promise.all(
      TELEGRAM_CHAT_IDS.map(async (chatId) => {
        try {
          const url = `https://api.telegram.org/bot${TELEGRAM_CHAT_BOT_TOKEN}/sendMessage`;
          const payload = {
            chat_id: chatId,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: true, // מונע תצוגה מקדימה של האתר
            reply_markup: {
              inline_keyboard: [inlineKeyboard]
            }
          } as TelegramChatMessage;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          
          if (!response.ok) {
            return false;
          }
          
          const result = await response.json();
          
          if (result.ok && result.result?.message_id) {
            messageIds.push(result.result.message_id.toString());
            return true;
          }
          
          return false;
        } catch (error: any) {
          // Telegram fetch error
          return false;
        }
      })
    );

    const allSent = results.some(r => r); // לפחות אחד הצליח
    return { success: allSent, messageIds };
  } catch (error) {
    return { success: false };
  }
}

/**
 * שליחת תגובה ל-Telegram (כשמישהו ענה)
 */
export async function sendChatReply(data: {
  conversationId: string;
  message: string;
  repliedByChatId: string;
  repliedByName: string;
  originalMessage?: string;
}): Promise<boolean> {
  console.log('sendChatReply called:', {
    conversationId: data.conversationId,
    messageLength: data.message.length,
    repliedByChatId: data.repliedByChatId,
    repliedByName: data.repliedByName,
    hasToken: !!TELEGRAM_CHAT_BOT_TOKEN,
    chatIdsCount: TELEGRAM_CHAT_IDS.length,
    chatIds: TELEGRAM_CHAT_IDS,
  });

  if (!TELEGRAM_CHAT_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
    console.error('sendChatReply: Missing token or chat IDs', {
      hasToken: !!TELEGRAM_CHAT_BOT_TOKEN,
      chatIdsCount: TELEGRAM_CHAT_IDS.length,
    });
    return false;
  }

  try {
    const messageText = `✅ <b>נענה על ידי ${escapeHtml(data.repliedByName)}</b>

💬 שיחה #${escapeHtml(data.conversationId.slice(0, 8))}

${escapeHtml(data.message)}`;

    // Send to all chat IDs (כולל מי שענה - כדי שיראה שהתגובה נשלחה)
    const results = await Promise.all(
      TELEGRAM_CHAT_IDS.map(async (chatId) => {
        try {
          console.log('Sending reply to Telegram chat ID:', chatId);
          const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_CHAT_BOT_TOKEN}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                text: messageText,
                parse_mode: 'HTML',
              } as TelegramChatMessage),
            }
          );
          
          const responseData = await response.json().catch(() => ({}));
          console.log('Telegram API response:', {
            ok: response.ok,
            status: response.status,
            data: responseData,
          });
          
          return response.ok;
        } catch (error) {
          console.error('Error sending to Telegram chat ID:', chatId, error);
          return false;
        }
      })
    );

    const success = results.some(r => r);
    console.log('sendChatReply result:', { success, results });
    return success; // לפחות אחד הצליח
  } catch (error) {
    console.error('sendChatReply error:', error);
    return false;
  }
}

/**
 * שליחת אינדיקטור "מקליד..." ל-Telegram
 */
export async function sendChatAction(
  action: 'typing' | 'upload_photo' | 'record_video' | 'upload_video' | 'record_voice' | 'upload_voice' | 'upload_document' | 'find_location' | 'record_video_note' | 'upload_video_note'
): Promise<boolean> {
  if (!TELEGRAM_CHAT_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
    return false;
  }

  try {
    const results = await Promise.all(
      TELEGRAM_CHAT_IDS.map(async (chatId) => {
        try {
          const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_CHAT_BOT_TOKEN}/sendChatAction`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                action,
              } as TelegramChatAction),
            }
          );
          
          return response.ok;
        } catch (error) {
          return false;
        }
      })
    );

    return results.some(r => r);
  } catch (error) {
    return false;
  }
}

/**
 * קבלת שם של chat_id מ-Telegram
 */
export async function getTelegramChatName(chatId: string): Promise<string | null> {
  if (!TELEGRAM_CHAT_BOT_TOKEN) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_CHAT_BOT_TOKEN}/getChat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId }),
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (result.ok && result.result) {
      return result.result.first_name || result.result.title || chatId;
    }
    return null;
  } catch (error) {
    return null;
  }
}
