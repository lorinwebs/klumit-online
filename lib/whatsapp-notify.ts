// Manager notifications on WhatsApp (Mor) — sent through the whatsapp-bridge service on Railway.
// Needs WHATSAPP_BRIDGE_URL and WHATSAPP_BRIDGE_KEY (= the bridge's ADMIN_KEY). Silent no-op when unset.

/** Telegram-style HTML (<b>, <code>, entities) → WhatsApp formatting. */
export function htmlToWhatsApp(html: string): string {
  return html
    .replace(/<\/?b>/gi, '*')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export async function sendWhatsAppNotification(htmlText: string): Promise<boolean> {
  const baseUrl = process.env.WHATSAPP_BRIDGE_URL?.trim().replace(/\/$/, '');
  const key = process.env.WHATSAPP_BRIDGE_KEY?.trim();
  if (!baseUrl || !key) return false;

  try {
    const response = await fetch(`${baseUrl}/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ text: htmlToWhatsApp(htmlText) }),
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    if (!response.ok) {
      console.warn('WhatsApp notify failed:', response.status, await response.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (error) {
    console.warn('WhatsApp notify error:', error);
    return false;
  }
}
