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
    const messageText = `💬 <b>הודעה חדשה משיחה #${escapeHtml(data.conversationId.slice(0, 8))}</b>

👤 משתמש: ${data.userName ? escapeHtml(data.userName) : 'לא צוין'}
📱 טלפון: ${data.userPhone ? `<code>${escapeHtml(data.userPhone)}</code>` : 'לא צוין'}
📧 אימייל: ${data.userEmail ? escapeHtml(data.userEmail) : 'לא צוין'}
🔗 עמוד: ${data.pageUrl ? escapeHtml(data.pageUrl) : 'לא צוין'}
───────────────────────
${escapeHtml(data.message)}`;

    const messageIds: string[] = [];
    
    // Send to all chat IDs
    const results = await Promise.all(
      TELEGRAM_CHAT_IDS.map(async (chatId) => {
        try {
          const url = `https://api.telegram.org/bot${TELEGRAM_CHAT_BOT_TOKEN}/sendMessage`;
          const payload = {
            chat_id: chatId,
            text: messageText,
            parse_mode: 'HTML',
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
  if (!TELEGRAM_CHAT_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
    return false;
  }

  try {
    const messageText = `✅ <b>נענה על ידי ${escapeHtml(data.repliedByName)}</b>

💬 שיחה #${escapeHtml(data.conversationId.slice(0, 8))}
───────────────────────
${escapeHtml(data.message)}`;

    // Send to all chat IDs (כולל מי שענה - כדי שיראה שהתגובה נשלחה)
    const results = await Promise.all(
      TELEGRAM_CHAT_IDS.map(async (chatId) => {
        try {
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
          
          return response.ok;
        } catch (error) {
          return false;
        }
      })
    );

    return results.some(r => r); // לפחות אחד הצליח
  } catch (error) {
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
