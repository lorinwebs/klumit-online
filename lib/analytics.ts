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

// Helper to send events to Meta Pixel
function sendMetaPixelEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined' || !(window as any).fbq) return;
  (window as any).fbq('track', eventName, params);
}

// ============ Standard Analytics Events ============

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
    content_ids: [product.id],
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
    content_ids: [product.id],
    content_type: 'product',
    value: value,
    currency: product.currency || 'ILS',
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
  
  // Meta Pixel - ViewCart
  sendMetaPixelEvent('ViewCart', {
    content_ids: cart.items.map(item => item.id),
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
