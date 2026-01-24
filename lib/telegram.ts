// Telegram Bot for Klumit store notifications
// Bot: @Klumitonline_bot

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_KLUMIT;
// Multiple chat IDs separated by comma
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_ID_KLUMIT?.split(',').map(id => id.trim()) || [];

// Bot for tracking user visits
// Bot: @Klumit_enteres_bot
const TELEGRAM_BOT_TOKEN_VISITS = process.env.TELEGRAM_BOT_TOKEN_VISITS || '8540786111:AAFP3pR0PW30KHz8YLAX97a0agQwm0K3nrM';

// Get chat ID from bot updates (first message sent to bot)
async function getChatIdFromBot(): Promise<string | null> {
  if (!TELEGRAM_BOT_TOKEN_VISITS) return null;
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_VISITS}/getUpdates`,
      { method: 'GET' }
    );
    
    if (!response.ok) return null;
    
    const result = await response.json();
    if (result.ok && result.result && result.result.length > 0) {
      // Get the chat ID from the last update
      const lastUpdate = result.result[result.result.length - 1];
      const chatId = lastUpdate.message?.chat?.id || lastUpdate.channel_post?.chat?.id;
      return chatId ? String(chatId) : null;
    }
    return null;
  } catch (error) {
    console.error('Failed to get chat ID from bot:', error);
    return null;
  }
}

// Cache chat ID to avoid repeated API calls
let cachedChatId: string | null = null;

async function getTelegramChatIdVisits(): Promise<string | null> {
  // First try environment variable
  if (process.env.TELEGRAM_CHAT_ID_VISITS) {
    return process.env.TELEGRAM_CHAT_ID_VISITS;
  }
  
  // Then try cached value
  if (cachedChatId) {
    return cachedChatId;
  }
  
  // Finally, try to get from bot
  cachedChatId = await getChatIdFromBot();
  return cachedChatId;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
    console.warn('Telegram: Missing bot token or chat IDs');
    return false;
  }

  try {
    
    // Send to all chat IDs
    const results = await Promise.all(
      TELEGRAM_CHAT_IDS.map(async (chatId) => {
        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: 'HTML',
            } as TelegramMessage),
          }
        );
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Telegram API error:', response.status, errorText);
          return false;
        }
        return true;
      })
    );

    const allSent = results.every(r => r);
    if (!allSent) {
      console.warn('Telegram: Some messages failed to send');
    }
    return allSent;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

// Helper to escape HTML special characters
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Notification for new user registration
export async function notifyNewUser(phone: string, userId: string): Promise<boolean> {
  const message = `🆕 <b>משתמש חדש נרשם!</b>

📱 טלפון: <code>${escapeHtml(phone)}</code>
🆔 User ID: <code>${escapeHtml(userId)}</code>
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

  return sendTelegramMessage(message);
}

// Notification for new order
export async function notifyNewOrder(orderData: {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  totalPrice: string;
  currency: string;
  itemsCount: number;
}): Promise<boolean> {
  const message = `🛍️ <b>הזמנה חדשה!</b>

📦 מספר הזמנה: <b>${escapeHtml(orderData.orderNumber)}</b>
👤 לקוח: ${escapeHtml(orderData.customerName)}
📱 טלפון: ${orderData.customerPhone ? `<code>${escapeHtml(orderData.customerPhone)}</code>` : 'לא צוין'}
📧 אימייל: ${orderData.customerEmail ? escapeHtml(orderData.customerEmail) : 'לא צוין'}
💰 סכום: <b>${escapeHtml(orderData.totalPrice)} ${escapeHtml(orderData.currency)}</b>
📝 מוצרים: ${orderData.itemsCount}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

  return sendTelegramMessage(message);
}

// Notification for checkout page visit
export async function notifyCheckoutVisit(data?: {
  userEmail?: string;
  userPhone?: string;
  itemsCount?: number;
  totalValue?: number;
}): Promise<boolean> {
  const userInfo = data?.userEmail || data?.userPhone 
    ? `👤 ${data.userEmail ? escapeHtml(data.userEmail) : ''}${data.userPhone ? ` (${escapeHtml(data.userPhone)})` : ''}`
    : '👤 אורח';
  
  const itemsInfo = data?.itemsCount ? `\n📝 מוצרים בעגלה: ${data.itemsCount}` : '';
  const totalInfo = data?.totalValue ? `\n💰 סכום: <b>₪${data.totalValue.toLocaleString('he-IL')}</b>` : '';
  
  const message = `🛒 <b>משתמש הגיע לדף תשלום</b>

${userInfo}${itemsInfo}${totalInfo}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

  return sendTelegramMessage(message);
}

// Track user visits - send or update message in Telegram
export async function trackUserVisit(data: {
  sessionId: string;
  pagePath: string;
  pageTitle: string;
  previousPages?: string[];
  messageId?: number;
}): Promise<{ success: boolean; messageId?: number }> {
  if (!TELEGRAM_BOT_TOKEN_VISITS) {
    console.warn('Telegram Visits: Missing bot token');
    return { success: false };
  }

  const chatId = await getTelegramChatIdVisits();
  if (!chatId) {
    console.warn('Telegram Visits: Could not get chat ID. Send a message to @Klumit_enteres_bot first.');
    return { success: false };
  }

  try {
    const pagesList = data.previousPages && data.previousPages.length > 0
      ? data.previousPages.map((page, idx) => `${idx + 1}. ${escapeHtml(page)}`).join('\n')
      : '1. ' + escapeHtml(data.pagePath);

    const currentPage = escapeHtml(data.pagePath);
    const currentTitle = escapeHtml(data.pageTitle);
    const time = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

    const message = `👤 <b>משתמש באתר</b>

📍 <b>דף נוכחי:</b> ${currentTitle}
🔗 ${currentPage}

📋 <b>היסטוריית דפים:</b>
${pagesList}

🕐 ${time}
🆔 Session: <code>${data.sessionId.substring(0, 8)}...</code>`;

    // If we have a messageId, update the existing message
    if (data.messageId) {
      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_VISITS}/editMessageText`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: data.messageId,
            text: message,
            parse_mode: 'HTML',
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Telegram edit error:', response.status, errorText);
        return { success: false };
      }

      const result = await response.json();
      return { success: true, messageId: result.result?.message_id };
    }

    // Otherwise, send a new message
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_VISITS}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error('Telegram send error:', response.status, errorText);
      return { success: false };
    }

    const result = await response.json();
    return { success: true, messageId: result.result?.message_id };
  } catch (error) {
    console.error('Telegram track visit error:', error);
    return { success: false };
  }
}

