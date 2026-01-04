// Cache ל-Shopify Customer ID כדי למנוע קריאות מיותרות
const customerIdCache = new Map<string, { id: string | null; timestamp: number }>();
const CACHE_TTL = 60000; // 60 שניות

/**
 * מקבל את ה-Shopify Customer ID של משתמש דרך API (עוקף בעיות RLS)
 */
export async function getShopifyCustomerId(userId: string, useCache: boolean = true): Promise<string | null> {
  // בדוק cache אם מופעל
  if (useCache) {
    const cached = customerIdCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.id;
    }
  }
  
  try {
    // קרא דרך API כדי לעקוף בעיות RLS
    const response = await fetch(`/api/user/shopify-customer-id?userId=${userId}`, {
      credentials: 'include',
      cache: 'no-store',
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const customerId = data?.shopifyCustomerId || null;
    
    
    if (customerId) {
      customerIdCache.set(userId, { id: customerId, timestamp: Date.now() });
    }
    
    return customerId;
  } catch (error: any) {
    return null;
  }
}

/**
 * מנקה את ה-cache של Shopify Customer ID
 */
export function clearCustomerIdCache(userId?: string): void {
  if (userId) {
    customerIdCache.delete(userId);
  } else {
    customerIdCache.clear();
  }
}
