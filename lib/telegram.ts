// Telegram Bot for Klumit store notifications
// Bot: @Klumitonline_bot

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_KLUMIT;
// Multiple chat IDs separated by comma
const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_ID_KLUMIT?.split(',').map(id => id.trim()) || [];

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) {
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
          return false;
        }
        return true;
      })
    );

    const allSent = results.every(r => r);
    return allSent;
  } catch (error) {
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

