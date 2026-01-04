import { supabase } from './supabase';
import { shopifyClient } from './shopify';
import { CREATE_CUSTOMER_MUTATION, updateCustomerAddress, shopifyAdminClient } from './shopify-admin';

/**
 * מסנכרן לקוח מ-Supabase ל-Shopify
 * אם הלקוח כבר קיים ב-Shopify, מחזיר את ה-ID שלו
 */
export async function syncCustomerToShopify(
  userId: string, 
  phone: string, 
  customerData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    zipCode?: string;
  }
) {
  console.log('🔄 syncCustomerToShopify: Starting', { userId, phone, customerData });
  
  // בדוק throttle - אם כבר נקרא לאחרונה, דלג
  const lastSync = syncThrottleCache.get(userId);
  if (lastSync && Date.now() - lastSync < SYNC_THROTTLE_MS) {
    console.log('⏸️ syncCustomerToShopify: Throttled, skipping', { 
      userId, 
      msSinceLastSync: Date.now() - lastSync 
    });
    return null;
  }
  
  // בדוק אם יש כישלון אחרון (throttle מ-Shopify)
  const lastFailed = failedSyncCache.get(userId);
  if (lastFailed && Date.now() - lastFailed < FAILED_SYNC_COOLDOWN) {
    console.log('⏸️ syncCustomerToShopify: In cooldown after throttle error', { 
      userId, 
      msSinceFailure: Date.now() - lastFailed,
      cooldownRemaining: FAILED_SYNC_COOLDOWN - (Date.now() - lastFailed)
    });
    return null;
  }
  
  // עדכן את ה-throttle cache
  syncThrottleCache.set(userId, Date.now());
  
  try {
    let shopifyCustomerId: string | null = null;

    // צור לקוח חדש ב-Shopify באמצעות Storefront API
    const phoneWithoutPlus = phone.replace(/^\+/, '');
    const formattedPhone = phoneWithoutPlus.startsWith('972') 
      ? `+${phoneWithoutPlus}` 
      : `+972${phoneWithoutPlus.replace(/^0/, '')}`;
    
    console.log('🔄 syncCustomerToShopify: Phone formatting', { 
      original: phone, 
      phoneWithoutPlus, 
      formattedPhone 
    });

    // בדוק אם יש כבר Shopify Customer ID ב-Supabase
    
    let existingSync;
    try {
      const dbCheckStart = Date.now();
      existingSync = await Promise.race([
        supabase
          .from('user_shopify_sync')
          .select('shopify_customer_id')
          .eq('user_id', userId)
          .maybeSingle(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DB check timeout after 10 seconds')), 10000)
        ),
      ]) as any;
      
    } catch (dbError: any) {
      // נמשיך גם אם יש שגיאה ב-DB - ננסה ליצור לקוח חדש
      existingSync = { data: null, error: dbError };
    }

    console.log('🔄 syncCustomerToShopify: DB check result', { 
      hasData: !!existingSync.data,
      shopifyCustomerId: existingSync.data?.shopify_customer_id,
      error: existingSync.error?.message,
    });

    if (existingSync.data?.shopify_customer_id) {
      // הלקוח כבר קיים - החזר את ה-ID
      shopifyCustomerId = existingSync.data.shopify_customer_id;
      console.log('✅ syncCustomerToShopify: Found existing in DB', { shopifyCustomerId });
      return shopifyCustomerId;
    }

    // נסה למצוא לקוח קיים ב-Shopify לפי טלפון (Admin API)
    console.log('🔍 syncCustomerToShopify: Searching in Shopify by phone', { hasAdminClient: !!shopifyAdminClient });
    if (shopifyAdminClient) {
      try {
        const FIND_CUSTOMER_BY_PHONE_QUERY = `
          query getCustomers($query: String!) {
            customers(first: 1, query: $query) {
              edges {
                node {
                  id
                  firstName
                  lastName
                  email
                  phone
                }
              }
            }
          }
        `;

        // חיפוש לפי טלפון - נסה כמה פורמטים
        const phoneVariations = [
          formattedPhone,
          formattedPhone.replace(/^\+/, ''),
          formattedPhone.replace(/^\+972/, '0'),
          phoneWithoutPlus,
        ];

        for (const phoneQuery of phoneVariations) {
          try {
            // נסה חיפוש עם ובלי מרכאות
            const searchQueries = [
              `phone:${phoneQuery}`,
              `phone:"${phoneQuery}"`,
              `phone:${phoneQuery.replace(/\D/g, '')}`, // רק ספרות
            ];

            for (const searchQuery of searchQueries) {
              try {
                const searchResult = await shopifyAdminClient.request<{
                  customers: {
                    edges: Array<{
                      node: {
                        id: string;
                        firstName: string | null;
                        lastName: string | null;
                        email: string | null;
                        phone: string | null;
                      };
                    }>;
                  };
                }>(FIND_CUSTOMER_BY_PHONE_QUERY, {
                  query: searchQuery,
                });

                const existingCustomer = searchResult.customers.edges[0]?.node;
                if (existingCustomer) {
                  shopifyCustomerId = existingCustomer.id;
                  break; // מצאנו לקוח, לא צריך להמשיך לחפש
                }
              } catch (innerSearchError: any) {
                // אם החיפוש נכשל, נמשיך לנסות פורמטים אחרים
              }
            }
            
            // אם מצאנו לקוח, לא צריך להמשיך לחפש פורמטים אחרים
            if (shopifyCustomerId) {
              break;
            }
          } catch (searchError: any) {
            // אם החיפוש נכשל, נמשיך לנסות פורמטים אחרים
          }
        }
      } catch (error: any) {
        // שגיאה בחיפוש - נמשיך ליצור לקוח חדש
      }
    }

    // אם לא מצאנו לקוח קיים, ננסה ליצור חדש
    console.log('🔄 syncCustomerToShopify: After phone search', { shopifyCustomerId });
    
    if (!shopifyCustomerId) {
      // השתמש בפרטים שהתקבלו, או צור email מ-phone אם אין
      const userEmail = customerData?.email || `phone-${phoneWithoutPlus.replace(/\D/g, '')}@klumit.local`;
      const firstName = customerData?.firstName || '';
      const lastName = customerData?.lastName || '';
      
      // סיסמה אקראית (לא נשתמש בה - אנחנו משתמשים ב-SMS auth)
      const randomPassword = Math.random().toString(36).slice(-12) + 'A1!';

      console.log('🆕 syncCustomerToShopify: Creating new customer', { 
        userEmail, 
        formattedPhone, 
        firstName, 
        lastName 
      });

      try {
        // נסה ליצור עם exponential backoff
        const result = await withRetry(async () => {
          const res = await shopifyClient.request<{
            customerCreate: {
              customer: { id: string } | null;
              customerUserErrors: Array<{ field: string[]; message: string; code?: string }>;
            };
          }>(CREATE_CUSTOMER_MUTATION, {
            input: {
              email: userEmail,
              phone: formattedPhone,
              password: randomPassword,
              firstName: firstName || undefined,
              lastName: lastName || undefined,
              acceptsMarketing: false,
            },
          });
          
          // אם יש שגיאת throttle, זרוק כדי לאפשר retry
          if (res.customerCreate.customerUserErrors?.some(e => 
            e.code === 'THROTTLED' || e.message?.includes('Limit exceeded')
          )) {
            throw new Error('THROTTLED: ' + res.customerCreate.customerUserErrors[0].message);
          }
          
          return res;
        }, 3, 1000); // 3 ניסיונות, מתחיל מ-1 שנייה

        console.log('📦 syncCustomerToShopify: Create customer result', { 
          customer: result.customerCreate.customer,
          errors: result.customerCreate.customerUserErrors,
        });

        if (result.customerCreate.customerUserErrors && result.customerCreate.customerUserErrors.length > 0) {
          const errorMessage = result.customerCreate.customerUserErrors[0].message;
          const errorCode = result.customerCreate.customerUserErrors[0].code;
          
          console.warn('⚠️ syncCustomerToShopify: Customer creation error', { errorCode, errorMessage });
          
          if (errorCode === 'TAKEN' || errorMessage.includes('already exists') || errorMessage.includes('taken')) {
            // הלקוח כבר קיים - נחפש אותו לפי email ב-Admin API
            console.log('🔍 syncCustomerToShopify: Customer exists, searching by email');
            if (shopifyAdminClient) {
              try {
                const searchResult = await shopifyAdminClient.request<{
                  customers: { edges: Array<{ node: { id: string } }> };
                }>(`
                  query getCustomers($query: String!) {
                    customers(first: 1, query: $query) {
                      edges { node { id } }
                    }
                  }
                `, { query: `email:"${userEmail}"` });
                
                console.log('🔍 syncCustomerToShopify: Email search result', { 
                  query: `email:"${userEmail}"`,
                  edges: searchResult.customers.edges,
                });
                if (searchResult.customers.edges[0]?.node.id) {
                  shopifyCustomerId = searchResult.customers.edges[0].node.id;
                  console.log('✅ syncCustomerToShopify: Found existing customer by email', { shopifyCustomerId });
                }
              } catch (searchErr) {
                console.error('❌ syncCustomerToShopify: Failed to search by email', searchErr);
              }
            }
            if (!shopifyCustomerId) return null;
          } else if (errorCode === 'THROTTLED' || errorMessage.includes('Limit exceeded')) {
            console.log('⚠️ syncCustomerToShopify: Throttled after retries, setting cooldown');
            failedSyncCache.set(userId, Date.now());
            return null;
          }
        } else if (result.customerCreate.customer) {
          shopifyCustomerId = result.customerCreate.customer.id;
          console.log('✅ syncCustomerToShopify: Customer created', { shopifyCustomerId });
        }
      } catch (error: any) {
        console.error('❌ syncCustomerToShopify: Error creating customer', { 
          error: error.message,
          stack: error.stack,
        });
        // בדוק אם זו שגיאת throttling (אחרי כל ה-retries)
        if (error.message?.includes('Limit exceeded') || error.message?.includes('THROTTLED')) {
          console.log('⚠️ syncCustomerToShopify: Throttle error after retries, setting cooldown');
          failedSyncCache.set(userId, Date.now());
          return null;
        }
      }
    }

    // שמור את ה-Shopify Customer ID ב-Supabase
    if (shopifyCustomerId) {

      try {
        const saveStart = Date.now();
        const { data: saveData, error } = await Promise.race([
          supabase
            .from('user_shopify_sync')
            .upsert({
              user_id: userId,
              shopify_customer_id: shopifyCustomerId,
              phone: phone,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('DB save timeout after 10 seconds')), 10000)
          ),
        ]) as any;

        if (!error) {
          // עדכן את ה-cache
          customerIdCache.set(userId, { id: shopifyCustomerId, timestamp: Date.now() });
        }
      } catch (saveError: any) {
        // שגיאה בשמירה - לא קריטי
      }

      // עדכן כתובת ב-Shopify אם יש
      if (customerData?.address && customerData?.city && customerData?.zipCode) {
        try {
          await updateCustomerAddress(shopifyCustomerId, {
            address1: customerData.address,
            city: customerData.city,
            zip: customerData.zipCode,
            country: 'IL',
          });
        } catch (error: any) {
          // שגיאה בעדכון כתובת - לא קריטי
        }
      }
    }

    return shopifyCustomerId;
  } catch (error: any) {
    throw error;
  }
}

// Cache ל-Shopify Customer ID כדי למנוע קריאות מיותרות ל-DB
const customerIdCache = new Map<string, { id: string | null; timestamp: number }>();
const CACHE_TTL = 60000; // 60 שניות

// Throttle cache - למניעת קריאות חוזרות ל-syncCustomerToShopify
const syncThrottleCache = new Map<string, number>();
const SYNC_THROTTLE_MS = 30000; // 30 שניות בין ניסיונות סינכרון לאותו משתמש

// Failed sync cache - למניעת ניסיונות חוזרים אחרי שגיאת throttle
const failedSyncCache = new Map<string, number>();
const FAILED_SYNC_COOLDOWN = 300000; // 5 דקות המתנה אחרי שגיאת throttle

// Exponential backoff helper
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // רק על THROTTLED נעשה retry
      if (!error.message?.includes('THROTTLED') && !error.message?.includes('Limit exceeded')) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // 1s, 2s, 4s
        console.log(`⏳ Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * מקבל את ה-Shopify Customer ID של משתמש
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
    // וודא שה-session פעיל לפני הקריאה (חשוב ל-RLS)
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session || sessionData.session.user.id !== userId) {
      // אם ה-session לא פעיל או לא תואם, נסה לרענן
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (!refreshData?.session || refreshData.session.user.id !== userId) {
        console.warn('⚠️ getShopifyCustomerId: Session not active or user mismatch, trying API route', {
          requestedUserId: userId,
          sessionUserId: refreshData?.session?.user?.id || sessionData?.session?.user?.id,
        });
        // נסה להשתמש ב-API route במקום (server-side עם session נכון)
        try {
          const response = await fetch(`/api/user/shopify-customer-id?userId=${userId}`, {
            credentials: 'include',
            cache: 'no-store',
          });
          if (response.ok) {
            const data = await response.json();
            const customerId = data?.shopifyCustomerId || null;
            // שמור ב-cache רק אם מצאנו תוצאה
            if (useCache && customerId) {
              customerIdCache.set(userId, { id: customerId, timestamp: Date.now() });
            }
            return customerId;
          }
        } catch (apiError) {
          console.error('❌ getShopifyCustomerId: API route fallback failed', apiError);
        }
        // נסה בכל זאת לקרוא ישירות - אולי ה-RLS יעבוד
      }
    }
    
    const { data, error } = await supabase
      .from('user_shopify_sync')
      .select('shopify_customer_id')
      .eq('user_id', userId)
      .maybeSingle(); // משתמש ב-maybeSingle במקום single כדי לא לזרוק שגיאה אם אין רשומה

    if (error) {
      console.error('❌ getShopifyCustomerId: Database error', {
        userId,
        error: error.message,
        code: error.code,
      });
      // אם זו שגיאת RLS (42501), נסה להשתמש ב-API route
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.warn('⚠️ getShopifyCustomerId: RLS permission denied, trying API route fallback', { userId });
        try {
          const response = await fetch(`/api/user/shopify-customer-id?userId=${userId}`, {
            credentials: 'include',
            cache: 'no-store',
          });
          if (response.ok) {
            const apiData = await response.json();
            const customerId = apiData?.shopifyCustomerId || null;
            // שמור ב-cache רק אם מצאנו תוצאה
            if (useCache && customerId) {
              customerIdCache.set(userId, { id: customerId, timestamp: Date.now() });
            }
            return customerId;
          }
        } catch (apiError) {
          console.error('❌ getShopifyCustomerId: API route fallback failed', apiError);
        }
      }
      // אם הטבלה לא קיימת (PGRST116) או שגיאה אחרת, נחזיר null
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        return null;
      }
      return null;
    }

    const customerId = data?.shopify_customer_id || null;
    
    // שמור ב-cache רק אם מצאנו תוצאה (לא null)
    // אם null, לא נשמור ב-cache כדי לאפשר ניסיון חוזר
    if (useCache && customerId) {
      customerIdCache.set(userId, { id: customerId, timestamp: Date.now() });
    }
    
    return customerId;
  } catch (error: any) {
    console.error('❌ getShopifyCustomerId: Exception', {
      userId,
      error: error?.message || error,
    });
    // נסה fallback ל-API route גם במקרה של exception
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch(`/api/user/shopify-customer-id?userId=${userId}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (response.ok) {
          const apiData = await response.json();
          return apiData?.shopifyCustomerId || null;
        }
      } catch (apiError) {
        // ignore
      }
    }
    return null;
  }
}

/**
 * מנקה את ה-cache של Shopify Customer ID
 */
export function clearCustomerIdCache(userId?: string): void {
  if (userId) {
    customerIdCache.delete(userId);
    syncThrottleCache.delete(userId);
    failedSyncCache.delete(userId);
  } else {
    customerIdCache.clear();
    syncThrottleCache.clear();
    failedSyncCache.clear();
  }
}

