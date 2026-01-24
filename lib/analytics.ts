/**
 * Analytics Module for Headless Shopify Store
 * 
 * שולח events ל-Google Analytics 4
 * ה-checkout יטופל ע"י Custom Pixel ב-Shopify
 */

// GA4 Measurement ID - הוסף ל-.env.local:
// NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Types
export interface ProductData {
  id: string;
  name: string;
  price: number;
  currency?: string;
  category?: string;
  variant?: string;
  quantity?: number;
}

export interface CartData {
  items: ProductData[];
  totalValue: number;
  currency?: string;
}

// Initialize GA4 script (already loaded in layout.tsx, this is a fallback)
export function initGA4(): void {
  if (typeof window === 'undefined') return;
  
  // Script is already loaded in layout.tsx
  // This function is kept for backwards compatibility
}

// Helper to send events to GA4
function sendEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  (window as any).gtag('event', eventName, params);
}

// Helper to send standard events to Meta Pixel
// Meta Pixel's fbq function has built-in queueing, so we can call it directly
function sendMetaPixelEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const fbq = (window as any).fbq;
    
    // Meta Pixel's fbq is created before the script loads and has built-in queueing
    if (fbq) {
      if (typeof fbq === 'function') {
        // Standard case: fbq is a function
        fbq('track', eventName, params);
      } else if (fbq.queue && Array.isArray(fbq.queue)) {
        // Fallback: if fbq is an object with queue array, push directly
        fbq.queue.push(['track', eventName, params]);
      } else if (fbq.callMethod) {
        // Another fallback: use callMethod if available
        fbq.callMethod.apply(fbq, ['track', eventName, params]);
      }
    } else {
      // If fbq doesn't exist yet, create a minimal queue
      // This shouldn't happen with proper Meta Pixel setup, but just in case
      (window as any)._fbq = (window as any)._fbq || [];
      (window as any)._fbq.push(['track', eventName, params]);
    }
  } catch (e) {
    // Log warning in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Meta Pixel event failed:', eventName, e);
    }
  }
}

// Helper to send custom events to Meta Pixel
function sendMetaPixelCustomEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const fbq = (window as any).fbq;
    
    if (fbq) {
      if (typeof fbq === 'function') {
        // Use trackCustom for non-standard events
        fbq('trackCustom', eventName, params);
      } else if (fbq.queue && Array.isArray(fbq.queue)) {
        fbq.queue.push(['trackCustom', eventName, params]);
      } else if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, ['trackCustom', eventName, params]);
      }
    } else {
      (window as any)._fbq = (window as any)._fbq || [];
      (window as any)._fbq.push(['trackCustom', eventName, params]);
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Meta Pixel custom event failed:', eventName, e);
    }
  }
}

// ============ Standard Analytics Events ============

/**
 * Get or create session ID for tracking visits
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const storageKey = 'telegram_visit_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    // Generate a unique session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

/**
 * Track page visit history
 */
function getPageHistory(): Array<{ path: string; title: string }> {
  if (typeof window === 'undefined') return [];
  
  const storageKey = 'telegram_visit_history';
  const historyStr = localStorage.getItem(storageKey);
  const history: Array<{ path: string; title: string }> = historyStr ? JSON.parse(historyStr) : [];
  
  // Keep only last 10 pages
  return history.slice(-10);
}

/**
 * Update page history
 */
function updatePageHistory(pagePath: string, pageTitle: string): void {
  if (typeof window === 'undefined') return;
  
  const storageKey = 'telegram_visit_history';
  const history = getPageHistory();
  
  // Add current page if it's different from the last one
  const lastPage = history[history.length - 1];
  if (!lastPage || lastPage.path !== pagePath) {
    history.push({ path: pagePath, title: pageTitle });
    // Keep only last 10 pages
    const trimmedHistory = history.slice(-10);
    localStorage.setItem(storageKey, JSON.stringify(trimmedHistory));
  }
}

/**
 * Send visit tracking to Telegram
 */
async function trackVisitToTelegram(pagePath: string, pageTitle: string): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionId = getSessionId();
    const history = getPageHistory();
    const previousPages = history.map((item) => 
      `${item.title} (${item.path})`
    );
    
    // Get stored message ID if exists
    const messageIdKey = 'telegram_visit_message_id';
    const storedMessageId = localStorage.getItem(messageIdKey);
    const messageId = storedMessageId ? parseInt(storedMessageId, 10) : undefined;
    
    const response = await fetch('/api/telegram/track-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        pagePath,
        pageTitle,
        previousPages,
        messageId,
      }),
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success && result.messageId) {
        // Store message ID for future updates
        localStorage.setItem(messageIdKey, result.messageId.toString());
      }
    }
  } catch (error) {
    // Silently fail - don't break the page if Telegram tracking fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('Telegram visit tracking failed:', error);
    }
  }
}

/**
 * Page View - קרא בכל מעבר דף
 */
export function trackPageView(path?: string, title?: string): void {
  if (typeof window === 'undefined') return;
  
  const pagePath = path || window.location.pathname;
  const pageTitle = title || document.title || pagePath;
  
  // Google Analytics
  sendEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
    page_location: window.location.href,
  });
  
  // Meta Pixel - PageView (already tracked in layout.tsx, but track again for SPA navigation)
  sendMetaPixelEvent('PageView');
  
  // Telegram visit tracking
  updatePageHistory(pagePath, pageTitle);
  trackVisitToTelegram(pagePath, pageTitle);
}

/**
 * Product Viewed - כשמישהו צופה בדף מוצר
 */
export function trackProductViewed(product: ProductData): void {
  // Google Analytics
  sendEvent('view_item', {
    currency: product.currency || 'ILS',
    value: product.price,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      item_category: product.category,
      item_variant: product.variant,
      quantity: 1,
    }],
  });
  
  // Meta Pixel - ViewContent
  sendMetaPixelEvent('ViewContent', {
    content_name: product.name,
    content_ids: [String(product.id)], // Ensure ID is a string
    content_type: 'product',
    value: product.price,
    currency: product.currency || 'ILS',
  });
}

/**
 * Product List Viewed - כשמישהו צופה ברשימת מוצרים
 */
export function trackProductListViewed(products: ProductData[], listName?: string): void {
  // Google Analytics
  sendEvent('view_item_list', {
    item_list_name: listName || 'Products',
    items: products.map((product, index) => ({
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      item_category: product.category,
      index: index,
    })),
  });
  
  // Meta Pixel - ViewCategory (for product lists)
  sendMetaPixelEvent('ViewCategory', {
    content_name: listName || 'Products',
    content_ids: products.map(p => p.id),
    content_type: 'product',
  });
}

/**
 * Add to Cart - כשמוסיפים מוצר לסל
 */
export function trackAddToCart(product: ProductData): void {
  const quantity = product.quantity || 1;
  const value = product.price * quantity;
  
  // Google Analytics
  sendEvent('add_to_cart', {
    currency: product.currency || 'ILS',
    value: value,
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      item_category: product.category,
      item_variant: product.variant,
      quantity: quantity,
    }],
  });
  
  // Meta Pixel - AddToCart
  sendMetaPixelEvent('AddToCart', {
    content_name: product.name,
    content_ids: [String(product.id)], // Ensure ID is a string
    content_type: 'product',
    value: value,
    currency: product.currency || 'ILS',
    quantity: quantity,
  });
}

/**
 * Remove from Cart - כשמסירים מוצר מהסל
 */
export function trackRemoveFromCart(product: ProductData): void {
  sendEvent('remove_from_cart', {
    currency: product.currency || 'ILS',
    value: product.price * (product.quantity || 1),
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      quantity: product.quantity || 1,
    }],
  });
}

/**
 * View Cart - כשצופים בדף העגלה
 */
export function trackViewCart(cart: CartData): void {
  // Google Analytics
  sendEvent('view_cart', {
    currency: cart.currency || 'ILS',
    value: cart.totalValue,
    items: cart.items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
  
  // Meta Pixel - ViewCart (custom event)
  sendMetaPixelCustomEvent('ViewCart', {
    content_ids: cart.items.map(item => String(item.id)),
    content_type: 'product',
    value: cart.totalValue,
    currency: cart.currency || 'ILS',
    num_items: cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
  });
}

/**
 * Begin Checkout - כשמתחילים checkout (לפני המעבר ל-Shopify)
 */
export function trackBeginCheckout(cart: CartData): void {
  // Google Analytics
  sendEvent('begin_checkout', {
    currency: cart.currency || 'ILS',
    value: cart.totalValue,
    items: cart.items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
  
  // Meta Pixel - InitiateCheckout
  sendMetaPixelEvent('InitiateCheckout', {
    content_ids: cart.items.map(item => item.id),
    content_type: 'product',
    value: cart.totalValue,
    currency: cart.currency || 'ILS',
    num_items: cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0),
  });
}

/**
 * Search - כשמחפשים באתר
 */
export function trackSearch(searchTerm: string): void {
  sendEvent('search', {
    search_term: searchTerm,
  });
}

/**
 * First Visit - כשמשתמש ייחודי נכנס לאתר בפעם הראשונה
 */
export function trackFirstVisit(): void {
  // בדוק אם זה ביקור ראשון
  const hasVisited = typeof window !== 'undefined' && localStorage.getItem('ga_has_visited');
  
  if (!hasVisited) {
    sendEvent('first_visit', {
      engagement_time_msec: 0,
    });
    
    // סמן שהמשתמש כבר ביקר
    if (typeof window !== 'undefined') {
      localStorage.setItem('ga_has_visited', 'true');
    }
  }
}

/**
 * User Engagement - מעקב אחר משתמש ייחודי
 */
export function trackUserEngagement(): void {
  sendEvent('user_engagement', {
    engagement_time_msec: 1000, // זמן בסיסי
  });
}

/**
 * Login / Sign Up
 */
export function trackLogin(method?: string): void {
  sendEvent('login', { method: method || 'email' });
}

export function trackSignUp(method?: string): void {
  sendEvent('sign_up', { method: method || 'email' });
}

// ============ Custom Events ============

/**
 * Custom Event - לאירועים מותאמים אישית
 */
export function trackCustomEvent(eventName: string, params?: Record<string, any>): void {
  sendEvent(eventName, params);
}
