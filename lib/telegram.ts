// Telegram Bot for Klumit store notifications
// Bot: @Klumitonline_bot

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_KLUMIT;
// Multiple chat IDs separated by comma
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_ID_KLUMIT?.split(',').map(id => id.trim()) || [];

// Bot for tracking user visits
// Bot: @Klumit_enteres_bot
const TELEGRAM_BOT_TOKEN_VISITS = process.env.TELEGRAM_BOT_TOKEN_VISITS || '8540786111:AAFP3pR0PW30KHz8YLAX97a0agQwm0K3nrM';

// Get chat IDs for visits tracking - uses existing TELEGRAM_CHAT_ID_KLUMIT
// TELEGRAM_CHAT_ID_VISITS is optional - if set, uses it; otherwise uses TELEGRAM_CHAT_ID_KLUMIT
function getTelegramChatIdsVisits(): string[] {
  // First try dedicated environment variable (can be comma-separated)
  if (process.env.TELEGRAM_CHAT_ID_VISITS) {
    return process.env.TELEGRAM_CHAT_ID_VISITS.split(',').map(id => id.trim()).filter(id => id.length > 0);
  }
  
  // Use all chat IDs from TELEGRAM_CHAT_ID_KLUMIT (same as other notifications)
  return TELEGRAM_CHAT_IDS;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
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
              disable_web_page_preview: true,
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

// Notification for WhatsApp share
export async function notifyWhatsAppShare(data: {
  productTitle: string;
  productUrl: string;
  productPrice?: string;
}): Promise<boolean> {
  // Get URL without protocol
  const urlWithoutProtocol = data.productUrl.replace(/^https?:\/\//, '');
  
  const priceInfo = data.productPrice ? `\n💰 מחיר: <b>${escapeHtml(data.productPrice)}</b>` : '';
  
  const message = `📱 <b>משתמש שיתף מוצר בוואטסאפ</b>

📦 מוצר: ${escapeHtml(data.productTitle)}${priceInfo}
🔗 ${escapeHtml(urlWithoutProtocol)}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

  return sendTelegramMessage(message);
}

// Track user visits - send new message in Telegram
// Sends to all chat IDs (like other notifications)
// Always creates a new message (doesn't update existing)
export async function trackUserVisit(data: {
  sessionId: string;
  pagePath: string;
  pageTitle: string;
  pageUrl?: string;
  previousPages?: string[];
}): Promise<{ success: boolean; messageId?: number }> {
  if (!TELEGRAM_BOT_TOKEN_VISITS) {
    console.warn('Telegram Visits: Missing bot token');
    return { success: false };
  }

  const chatIds = getTelegramChatIdsVisits();
  if (chatIds.length === 0) {
    console.warn('Telegram Visits: Could not get chat IDs. Make sure TELEGRAM_CHAT_ID_KLUMIT is set in .env.local');
    return { success: false };
  }

  try {
    const pagesList = data.previousPages && data.previousPages.length > 0
      ? data.previousPages.map((page, idx) => `${idx + 1}. ${escapeHtml(page)}`).join('\n')
      : '1. ' + escapeHtml(data.pagePath);

    const currentPage = escapeHtml(data.pagePath);
    const currentTitle = escapeHtml(data.pageTitle);
    const currentUrl = data.pageUrl ? escapeHtml(data.pageUrl) : currentPage;
    const time = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

    const message = `👤 <b>משתמש באתר</b>

📍 <b>דף נוכחי:</b> ${currentTitle}
🔗 ${currentUrl}

📋 <b>היסטוריית דפים:</b>
${pagesList}

🕐 ${time}
🆔 Session: <code>${data.sessionId}</code>`;

    // Always send new messages (don't update existing)
    // Send new messages to all chat IDs
    const results = await Promise.all(
      chatIds.map(async (chatId) => {
        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN_VISITS}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: 'HTML',
              disable_web_page_preview: true,
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`Telegram send error for ${chatId}:`, response.status, errorText);
          return null;
        }

        const result = await response.json();
        return result.result?.message_id;
      })
    );

    // Return the first messageId (for updating later)
    const firstMessageId = results.find(id => id !== null);
    return { success: firstMessageId !== null, messageId: firstMessageId };
  } catch (error) {
    console.error('Telegram track visit error:', error);
    return { success: false };
  }
}

