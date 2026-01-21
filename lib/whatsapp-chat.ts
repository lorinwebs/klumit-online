// WhatsApp Business API for Klumit chat system

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_RECIPIENT_PHONE = process.env.WHATSAPP_RECIPIENT_PHONE; // מספר טלפון של היעד (בפורמט 972XXXXXXXXX)
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
    preview_url?: boolean;
  };
  context?: {
    message_id: string;
  };
}

/**
 * שליחת הודעת צ'אט ל-WhatsApp Business
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
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || !WHATSAPP_RECIPIENT_PHONE) {
    return { success: false };
  }

  try {
    // עיבוד pageUrl - הצגת domain + path (ללא protocol ו-port)
    let pageUrlDisplay = 'לא צוין';
    if (data.pageUrl) {
      try {
        const url = new URL(data.pageUrl);
        let hostname = url.hostname;
        if (hostname.startsWith('www.')) {
          hostname = hostname.replace(/^www\./, '');
        }
        if (url.port) {
          hostname = `${hostname}:${url.port}`;
        }
        const pathname = url.pathname;
        if (pathname && pathname !== '/') {
          pageUrlDisplay = `${hostname}${pathname}`;
        } else {
          pageUrlDisplay = hostname;
        }
      } catch {
        const urlWithoutProtocol = data.pageUrl.replace(/^https?:\/\//, '');
        const parts = urlWithoutProtocol.split('/');
        if (parts.length > 0) {
          let domain = parts[0].replace(/^www\./, '');
          if (parts.length > 1) {
            const path = '/' + parts.slice(1).join('/');
            pageUrlDisplay = `${domain}${path}`;
          } else {
            pageUrlDisplay = domain;
          }
        }
      }
    }

    const messageText = `💬 *הודעה חדשה משיחה #${data.conversationId.slice(0, 8)}*

👤 משתמש: ${data.userName || 'לא צוין'}
📱 טלפון: ${data.userPhone || 'לא צוין'}
📧 אימייל: ${data.userEmail || 'לא צוין'}
🔗 עמוד: ${pageUrlDisplay}

${data.message}`;

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: WHATSAPP_RECIPIENT_PHONE,
      type: 'text',
      text: {
        body: messageText,
        preview_url: false,
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('WhatsApp API error:', responseData);
      return { success: false };
    }

    if (responseData.messages && responseData.messages.length > 0) {
      const messageIds = responseData.messages.map((msg: any) => msg.id);
      return { success: true, messageIds };
    }

    return { success: false };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return { success: false };
  }
}

/**
 * שליחת תגובה ל-WhatsApp (כשמישהו ענה)
 */
export async function sendChatReply(data: {
  conversationId: string;
  message: string;
  repliedByChatId: string;
  repliedByName: string;
  originalMessage?: string;
  originalMessageId?: string;
}): Promise<boolean> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || !WHATSAPP_RECIPIENT_PHONE) {
    return false;
  }

  try {
    const messageText = `✅ *נענה על ידי ${data.repliedByName}*

💬 שיחה #${data.conversationId.slice(0, 8)}

${data.message}`;

    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    const payload: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to: WHATSAPP_RECIPIENT_PHONE,
      type: 'text',
      text: {
        body: messageText,
        preview_url: false,
      },
    };

    // אם יש originalMessageId, נוסיף context ל-reply
    if (data.originalMessageId) {
      payload.context = {
        message_id: data.originalMessageId,
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('WhatsApp reply error:', error);
    return false;
  }
}

/**
 * שליחת אינדיקטור "מקליד..." ל-WhatsApp
 * הערה: WhatsApp לא תומך ב-typing indicator דרך API
 */
export async function sendChatAction(
  action: 'typing' | 'upload_photo' | 'record_video' | 'upload_video' | 'record_voice' | 'upload_voice' | 'upload_document' | 'find_location' | 'record_video_note' | 'upload_video_note'
): Promise<boolean> {
  // WhatsApp Business API לא תומך ב-typing indicator
  // נחזיר true כדי לא לשבור את הקוד הקיים
  return true;
}

/**
 * קבלת שם של chat מ-WhatsApp
 * הערה: WhatsApp API לא מספק מידע על שם המשתמש דרך webhook
 */
export async function getWhatsAppChatName(phoneNumber: string): Promise<string | null> {
  // WhatsApp API לא מספק מידע על שם המשתמש
  // נחזיר את המספר או null
  return phoneNumber || null;
}
