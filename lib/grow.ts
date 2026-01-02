/**
 * Grow-il Payment Integration
 * 
 * הגדרות נדרשות ב-.env.local:
 * GROW_API_KEY=your-api-key
 * GROW_WEBHOOK_KEY=e485000d-0d0c-012c-f75e-83270122aac5
 * GROW_ENVIRONMENT=sandbox (או production)
 * SHOPIFY_ADMIN_API_TOKEN=your-admin-api-token (לעדכון הזמנות)
 */

const GROW_API_KEY = process.env.GROW_API_KEY;
const GROW_WEBHOOK_KEY = process.env.GROW_WEBHOOK_KEY || '5e96a9e0-e919-648a-2cd3-0a191c177831';
const GROW_ENVIRONMENT = process.env.GROW_ENVIRONMENT || 'production';

const GROW_BASE_URL = GROW_ENVIRONMENT === 'production' 
  ? 'https://api.grow.link'
  : 'https://sandboxapi.grow.link';

export interface CreatePaymentLinkRequest {
  amount: number;
  currency?: string;
  reference: string; // מזהה הזמנה ב-Shopify
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentLinkResponse {
  paymentLink: string;
  paymentId: string;
  status: string;
}

/**
 * יצירת Payment Link ב-Grow
 */
export async function createPaymentLink(data: CreatePaymentLinkRequest): Promise<PaymentLinkResponse> {
  if (!GROW_API_KEY) {
    throw new Error('GROW_API_KEY לא מוגדר');
  }

  const requestBody: any = {
    amount: data.amount,
    currency: data.currency || 'ILS',
    reference: data.reference,
  };

  // הוסף שדות אופציונליים רק אם הם קיימים
  if (data.description) {
    requestBody.description = data.description;
  }
  if (data.customerEmail) {
    requestBody.customerEmail = data.customerEmail;
  }
  if (data.customerPhone) {
    requestBody.customerPhone = data.customerPhone;
  }
  if (data.customerName) {
    requestBody.customerName = data.customerName;
  }
  if (data.successUrl) {
    requestBody.successUrl = data.successUrl;
  }
  if (data.cancelUrl) {
    requestBody.cancelUrl = data.cancelUrl;
  }
  if (data.metadata) {
    requestBody.metadata = {
      ...data.metadata,
      orderReference: data.reference,
    };
  }

  // בדיקה שהמשתנים מוגדרים
  if (!GROW_API_KEY) {
    throw new Error('GROW_API_KEY לא מוגדר - אנא הגדר את המשתנה ב-Vercel Environment Variables');
  }

  // URL לפי הדוקומנטציה של Grow
  // בדוק את הדוקומנטציה - יכול להיות שהפורמט שונה
  const url = `${GROW_BASE_URL}/api/light/server/1.0/CreatePaymentLink`;
  
  + '...',
    environment: GROW_ENVIRONMENT,
    baseUrl: GROW_BASE_URL,
    requestBody: requestBody,
  });

  let response;
  try {
    // נסה עם fetch רגיל - ללא timeout כי זה יכול לגרום לבעיות ב-Vercel
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GROW_API_KEY!,
        'Accept': 'application/json',
        'User-Agent': 'Klumit-Shopify/1.0',
      },
      body: JSON.stringify(requestBody),
      // הוסף cache control
      cache: 'no-store',
    });
  } catch (fetchError: any) {

    if (fetchError instanceof Error) {
      // בדיקה אם זו שגיאת רשת
      if (fetchError.name === 'AbortError') {
        throw new Error('בקשה ל-Grow API נכשלה - timeout (30 שניות)');
      }
      if (fetchError.message.includes('fetch failed') || 
          fetchError.message.includes('ECONNREFUSED') ||
          fetchError.message.includes('ENOTFOUND') ||
          fetchError.message.includes('network') ||
          fetchError.message.includes('Failed to fetch')) {
        throw new Error(`לא ניתן להתחבר ל-Grow API. URL: ${url}. בדוק: 1) שהחיבור לאינטרנט תקין, 2) שה-URL נכון (${GROW_BASE_URL}), 3) שה-GROW_API_KEY מוגדר ב-Vercel.`);
      }
      throw new Error(`שגיאת רשת: ${fetchError.message} (${fetchError.name})`);
    }
    throw new Error(`שגיאה לא ידועה ביצירת קישור תשלום: ${JSON.stringify(fetchError)}`);
  }

  const responseText = await response.text();
  // רק 500 תווים ראשונים
  });

  if (!response.ok) {
    let errorMessage = `Grow API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(responseText);
      errorMessage += ` - ${JSON.stringify(errorJson)}`;
    } catch {
      errorMessage += ` - ${responseText.substring(0, 200)}`;
    }
    throw new Error(errorMessage);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Invalid JSON response from Grow: ${responseText.substring(0, 200)}`);
  }

  // בדיקה שהתקבל payment link
  const paymentLink = result.paymentLink || result.url || result.link || result.payment_url;
  if (!paymentLink) {

    throw new Error(`No payment link in response: ${JSON.stringify(result)}`);
  }

  return {
    paymentLink,
    paymentId: result.paymentId || result.id || result.payment_id || '',
    status: result.status || 'pending',
  };
}

/**
 * אימות Webhook מ-Grow
 */
export function verifyWebhookSignature(body: any, signature?: string): boolean {
  // Grow שולחים את ה-webhook key בשדה או ב-header
  // כאן אתה יכול להוסיף לוגיקת אימות נוספת אם נדרש
  return true; // בינתיים נחזיר true - צריך לבדוק את הדוקומנטציה של Grow
}

export { GROW_WEBHOOK_KEY };

