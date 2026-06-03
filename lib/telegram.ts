// Website Telegram — @Klumitbot (primary: TELEGRAM_BOT_TOKEN_KLUMIT_EVENTS)
// Sends only for production host klumit-online.co.il / www (not localhost, not *.vercel.app, not מקיף ח paths).

const TELEGRAM_CHAT_IDS = process.env.TELEGRAM_CHAT_ID_KLUMIT?.split(',').map((id) => id.trim()) || [];

const MEKIF_PATH_PREFIXES = ['/mekif-chet-2007-reunion', '/mekif-chet-availability-check'] as const;

const ALLOWED_HOSTNAMES = new Set(['klumit-online.co.il', 'www.klumit-online.co.il']);

function resolveWebsiteMessageBotToken(): string | undefined {
  return (
    process.env.TELEGRAM_BOT_TOKEN_KLUMIT_EVENTS?.trim() ||
    process.env.TELEGRAM_BOT_TOKEN_KLUMIT?.trim() ||
    undefined
  );
}

function resolveWebsiteVisitsBotToken(): string | undefined {
  return (
    process.env.TELEGRAM_BOT_TOKEN_KLUMIT_EVENTS?.trim() ||
    process.env.TELEGRAM_BOT_TOKEN_VISITS?.trim() ||
    process.env.TELEGRAM_BOT_TOKEN_KLUMIT?.trim() ||
    undefined
  );
}

export function normalizeTelegramWebsiteHostname(host: string): string {
  return host.split(':')[0].trim().toLowerCase();
}

export function isAllowedKlumitOnlineWebsiteTelegramHost(hostname: string): boolean {
  const h = normalizeTelegramWebsiteHostname(hostname);
  return ALLOWED_HOSTNAMES.has(h);
}

/**
 * Same-origin browser POSTs often omit Origin/Referer. Use Host / X-Forwarded-Host
 * to build an allowed gate URL for server routes (e.g. newsletter).
 */
export function gatePageUrlFromAllowedRequestHost(request: Request): string | null {
  const raw =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.trim() ||
    '';
  if (!raw) return null;
  const hostname = normalizeTelegramWebsiteHostname(raw);
  if (!isAllowedKlumitOnlineWebsiteTelegramHost(hostname)) return null;
  return `https://${hostname}/`;
}

/** Safe booleans for debugging (no secrets). */
export function getWebsiteTelegramStatus() {
  const messageToken = resolveWebsiteMessageBotToken();
  const visitsToken = resolveWebsiteVisitsBotToken();
  const shopConfigured =
    Boolean(process.env.SHOPIFY_TELEGRAM_NOTIFY_SHOP_DOMAIN?.trim()) ||
    Boolean(process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim());

  let hint: string | undefined;
  if (!messageToken) {
    hint =
      'Set TELEGRAM_BOT_TOKEN_KLUMIT_EVENTS (or TELEGRAM_BOT_TOKEN_KLUMIT) in Vercel/server env.';
  } else if (TELEGRAM_CHAT_IDS.length === 0) {
    hint = 'Set TELEGRAM_CHAT_ID_KLUMIT to your Telegram chat or group id.';
  }

  return {
    messageBotTokenSet: Boolean(messageToken),
    visitsBotTokenSet: Boolean(visitsToken),
    chatIdsConfigured: TELEGRAM_CHAT_IDS.length > 0,
    chatIdsCount: TELEGRAM_CHAT_IDS.length,
    shopifyOrderGateConfigured: shopConfigured,
    sendsOnlyForHosts: [...ALLOWED_HOSTNAMES],
    hint,
    orderWebhookNote: shopConfigured
      ? undefined
      : 'Order webhooks need NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN or SHOPIFY_TELEGRAM_NOTIFY_SHOP_DOMAIN.',
  };
}

function isMekifBlockedPath(pathname: string): boolean {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return MEKIF_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function isKlumitWebsiteTelegramBlockedPagePath(pagePath: string): boolean {
  if (!pagePath) return false;
  return isMekifBlockedPath(pagePath);
}

/** Full page URL (with or without protocol). Used for client-reported origins. */
export function isAllowedKlumitOnlineWebsiteTelegramPage(pageUrl: string): boolean {
  if (!pageUrl || typeof pageUrl !== 'string') return false;
  const trimmed = pageUrl.trim();
  let url: URL;
  try {
    url = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`);
  } catch {
    return false;
  }
  const hostname = normalizeTelegramWebsiteHostname(url.hostname);
  if (hostname === 'localhost' || hostname === '127.0.0.1') return false;
  if (hostname.endsWith('.vercel.app')) return false;
  if (!ALLOWED_HOSTNAMES.has(hostname)) return false;
  return !isMekifBlockedPath(url.pathname || '/');
}

function isShopifyOrderTelegramAllowed(shopDomain: string): boolean {
  const normalized = shopDomain.toLowerCase().trim();
  const explicit = process.env.SHOPIFY_TELEGRAM_NOTIFY_SHOP_DOMAIN?.toLowerCase().trim();
  if (explicit) return normalized === explicit;
  const store = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.toLowerCase().trim();
  if (!store) return false;
  return normalized === `${store}.myshopify.com`;
}

export type TelegramWebsiteSendGate =
  | { kind: 'pageUrl'; pageUrl: string }
  | { kind: 'requestHost'; host: string }
  | { kind: 'shopifyOrder'; shopDomain: string };

function isSendGateAllowed(gate: TelegramWebsiteSendGate): boolean {
  switch (gate.kind) {
    case 'pageUrl':
      return isAllowedKlumitOnlineWebsiteTelegramPage(gate.pageUrl);
    case 'requestHost':
      return isAllowedKlumitOnlineWebsiteTelegramHost(normalizeTelegramWebsiteHostname(gate.host));
    case 'shopifyOrder':
      return isShopifyOrderTelegramAllowed(gate.shopDomain);
  }
}

// TELEGRAM_CHAT_ID_VISITS is optional - if set, uses it; otherwise uses TELEGRAM_CHAT_ID_KLUMIT
function getTelegramChatIdsVisits(): string[] {
  if (process.env.TELEGRAM_CHAT_ID_VISITS) {
    return process.env.TELEGRAM_CHAT_ID_VISITS.split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }
  return TELEGRAM_CHAT_IDS;
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  disable_web_page_preview?: boolean;
}

export async function sendTelegramMessage(text: string, gate: TelegramWebsiteSendGate): Promise<boolean> {
  if (!isSendGateAllowed(gate)) {
    if (process.env.TELEGRAM_WEBSITE_DEBUG === '1') {
      console.warn('Telegram: send blocked by gate', gate.kind);
    }
    return false;
  }

  const token = resolveWebsiteMessageBotToken();
  if (!token || TELEGRAM_CHAT_IDS.length === 0) {
    console.warn(
      'Telegram: Missing bot token or chat IDs',
      JSON.stringify({ hasToken: Boolean(token), chatIds: TELEGRAM_CHAT_IDS.length })
    );
    return false;
  }

  try {
    const results = await Promise.all(
      TELEGRAM_CHAT_IDS.map(async (chatId) => {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          } as TelegramMessage),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Telegram API error:', response.status, errorText);
          return false;
        }
        return true;
      })
    );

    const allSent = results.every((r) => r);
    if (!allSent) {
      console.warn('Telegram: Some messages failed to send');
    }
    return allSent;
  } catch (error) {
    console.error('Telegram send error:', error);
    return false;
  }
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function breakUrlForTelegram(url: string): string {
  let urlWithoutProtocol = url.replace(/^https?:\/\//, '');

  urlWithoutProtocol = urlWithoutProtocol
    .replace(/klumit-online\.co\.il/gi, 'klumit-online. co . il')
    .replace(/klumit-online\.vercel\.app/gi, 'klumit-online. vercel . app')
    .replace(/klumit\.vercel\.app/gi, 'klumit. vercel . app')
    .replace(/www\.klumit-online\.co\.il/gi, 'www. klumit-online. co . il');

  return urlWithoutProtocol;
}

export async function notifyNewUser(
  phone: string,
  userId: string,
  gate: { kind: 'requestHost'; host: string }
): Promise<boolean> {
  const message = `🆕 <b>משתמש חדש נרשם!</b>

📱 טלפון: <code>${escapeHtml(phone)}</code>
🆔 User ID: <code>${escapeHtml(userId)}</code>
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

  return sendTelegramMessage(message, gate);
}

export async function notifyNewOrder(
  orderData: {
    orderNumber: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    totalPrice: string;
    currency: string;
    itemsCount: number;
  },
  gate: { kind: 'shopifyOrder'; shopDomain: string }
): Promise<boolean> {
  const message = `🛍️ <b>הזמנה חדשה!</b>

📦 מספר הזמנה: <b>${escapeHtml(orderData.orderNumber)}</b>
👤 לקוח: ${escapeHtml(orderData.customerName)}
📱 טלפון: ${orderData.customerPhone ? `<code>${escapeHtml(orderData.customerPhone)}</code>` : 'לא צוין'}
📧 אימייל: ${orderData.customerEmail ? escapeHtml(orderData.customerEmail) : 'לא צוין'}
💰 סכום: <b>${escapeHtml(orderData.totalPrice)} ${escapeHtml(orderData.currency)}</b>
📝 מוצרים: ${orderData.itemsCount}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

  return sendTelegramMessage(message, gate);
}

export async function notifyCheckoutVisit(
  data: {
    userEmail?: string;
    userPhone?: string;
    itemsCount?: number;
    totalValue?: number;
  },
  gate: { kind: 'pageUrl'; pageUrl: string }
): Promise<boolean> {
  const userInfo =
    data?.userEmail || data?.userPhone
      ? `👤 ${data.userEmail ? escapeHtml(data.userEmail) : ''}${data.userPhone ? ` (${escapeHtml(data.userPhone)})` : ''}`
      : '👤 אורח';

  const itemsInfo = data?.itemsCount ? `\n📝 מוצרים בעגלה: ${data.itemsCount}` : '';
  const totalInfo = data?.totalValue ? `\n💰 סכום: <b>₪${data.totalValue.toLocaleString('he-IL')}</b>` : '';

  const message = `🛒 <b>משתמש הגיע לדף תשלום</b>

${userInfo}${itemsInfo}${totalInfo}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

  return sendTelegramMessage(message, gate);
}

export async function notifyWhatsAppShare(
  data: {
    productTitle: string;
    productUrl: string;
    productPrice?: string;
  },
  gate: { kind: 'pageUrl'; pageUrl: string }
): Promise<boolean> {
  const urlBroken = breakUrlForTelegram(data.productUrl);

  const priceInfo = data.productPrice ? `\n💰 מחיר: <b>${escapeHtml(data.productPrice)}</b>` : '';

  const message = `📱 <b>משתמש שיתף מוצר בוואטסאפ</b>

📦 מוצר: ${escapeHtml(data.productTitle)}${priceInfo}
🔗 ${escapeHtml(urlBroken)}
📅 תאריך: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}`;

  return sendTelegramMessage(message, gate);
}

export type TrackUserVisitResult = { success: boolean; messageId?: number; skipped?: boolean };

export async function trackUserVisit(data: {
  sessionId: string;
  pagePath: string;
  pageTitle: string;
  pageUrl?: string;
  previousPages?: string[];
}): Promise<TrackUserVisitResult> {
  if (isKlumitWebsiteTelegramBlockedPagePath(data.pagePath)) {
    return { success: true, skipped: true };
  }

  const pageUrlForGate = data.pageUrl?.trim()
    ? data.pageUrl.includes('://')
      ? data.pageUrl
      : `https://${data.pageUrl}`
    : '';

  if (!pageUrlForGate || !isAllowedKlumitOnlineWebsiteTelegramPage(pageUrlForGate)) {
    return { success: true, skipped: true };
  }

  const token = resolveWebsiteVisitsBotToken();
  if (!token) {
    console.warn('Telegram Visits: Missing bot token');
    return { success: false };
  }

  const chatIds = getTelegramChatIdsVisits();
  if (chatIds.length === 0) {
    console.warn('Telegram Visits: Could not get chat IDs. Make sure TELEGRAM_CHAT_ID_KLUMIT is set in .env.local');
    return { success: false };
  }

  try {
    const pagesList =
      data.previousPages && data.previousPages.length > 0
        ? data.previousPages.map((page, idx) => `${idx + 1}. ${escapeHtml(page)}`).join('\n')
        : '1. ' + escapeHtml(data.pagePath);

    const currentPage = escapeHtml(data.pagePath);
    const currentTitle = escapeHtml(data.pageTitle);
    const currentUrl = data.pageUrl
      ? escapeHtml(breakUrlForTelegram(data.pageUrl.includes('://') ? data.pageUrl : `https://${data.pageUrl}`))
      : currentPage;
    const time = new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' });

    const message = `👤 <b>משתמש באתר</b>

📍 <b>דף נוכחי:</b> ${currentTitle}
🔗 ${currentUrl}

📋 <b>היסטוריית דפים:</b>
${pagesList}

🕐 ${time}
🆔 Session: <code>${data.sessionId}</code>`;

    const results = await Promise.all(
      chatIds.map(async (chatId) => {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`Telegram send error for ${chatId}:`, response.status, errorText);
          return null;
        }

        const result = await response.json();
        return result.result?.message_id;
      })
    );

    const firstMessageId = results.find((id) => id !== null);
    return { success: firstMessageId !== null, messageId: firstMessageId };
  } catch (error) {
    console.error('Telegram track visit error:', error);
    return { success: false };
  }
}
