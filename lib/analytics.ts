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

// Initialize GA4 script
export function initGA4(): void {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID) return;
  
  // Don't initialize twice
  if ((window as any).gtag) return;

  // Add gtag script
  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).gtag = function gtag() {
    (window as any).dataLayer.push(arguments);
  };
  
  (window as any).gtag('js', new Date());
  (window as any).gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll send manually for SPA
  });
}

// Helper to send events
function sendEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  (window as any).gtag('event', eventName, params);
}

// ============ Standard Analytics Events ============

/**
 * Page View - קרא בכל מעבר דף
 */
export function trackPageView(path?: string, title?: string): void {
  sendEvent('page_view', {
    page_path: path || window.location.pathname,
    page_title: title || document.title,
  });
}

/**
 * Product Viewed - כשמישהו צופה בדף מוצר
 */
export function trackProductViewed(product: ProductData): void {
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
}

/**
 * Product List Viewed - כשמישהו צופה ברשימת מוצרים
 */
export function trackProductListViewed(products: ProductData[], listName?: string): void {
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
}

/**
 * Add to Cart - כשמוסיפים מוצר לסל
 */
export function trackAddToCart(product: ProductData): void {
  sendEvent('add_to_cart', {
    currency: product.currency || 'ILS',
    value: product.price * (product.quantity || 1),
    items: [{
      item_id: product.id,
      item_name: product.name,
      price: product.price,
      item_category: product.category,
      item_variant: product.variant,
      quantity: product.quantity || 1,
    }],
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
}

/**
 * Begin Checkout - כשמתחילים checkout (לפני המעבר ל-Shopify)
 */
export function trackBeginCheckout(cart: CartData): void {
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
