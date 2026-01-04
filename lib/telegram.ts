// Telegram Bot for Klumit store notifications
// Bot: @Klumitonline_bot

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN_KLUMIT;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID_KLUMIT; // Your personal/group chat ID

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  console.log('📤 sendTelegramMessage called');
  console.log('🔑 Token exists:', !!TELEGRAM_BOT_TOKEN);
  console.log('🆔 Chat ID exists:', !!TELEGRAM_CHAT_ID);
  
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('❌ Telegram not configured - missing TELEGRAM_BOT_TOKEN_KLUMIT or TELEGRAM_CHAT_ID_KLUMIT');
    return false;
  }

  try {
    console.log('📡 Calling Telegram API...');
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'HTML',
        } as TelegramMessage),
      }
    );

    console.log('📡 Telegram API response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Telegram API error:', error);
      return false;
    }

    console.log('✅ Telegram message sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error);
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

