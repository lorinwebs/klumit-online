import { supabase } from './supabase';
import { shopifyClient } from './shopify';
import { CREATE_CUSTOMER_MUTATION, updateCustomerAddress } from './shopify-admin';

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
  try {
    let shopifyCustomerId: string | null = null;

    // צור לקוח חדש ב-Shopify באמצעות Storefront API
    const phoneWithoutPlus = phone.replace(/^\+/, '');
    const formattedPhone = phoneWithoutPlus.startsWith('972') 
      ? `+${phoneWithoutPlus}` 
      : `+972${phoneWithoutPlus.replace(/^0/, '')}`;

    // בדוק אם יש כבר Shopify Customer ID ב-Supabase
    const existingSync = await supabase
      .from('user_shopify_sync')
      .select('shopify_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSync.data?.shopify_customer_id) {
      // הלקוח כבר קיים - החזר את ה-ID
      shopifyCustomerId = existingSync.data.shopify_customer_id;
      console.log('ℹ️ Customer already synced to Shopify:', shopifyCustomerId);
      return shopifyCustomerId;
    }

    // השתמש בפרטים שהתקבלו, או צור email מ-phone אם אין
    const userEmail = customerData?.email || `phone-${phoneWithoutPlus.replace(/\D/g, '')}@klumit.local`;
    const firstName = customerData?.firstName || '';
    const lastName = customerData?.lastName || '';
    
    // סיסמה אקראית (לא נשתמש בה - אנחנו משתמשים ב-SMS auth)
    const randomPassword = Math.random().toString(36).slice(-12) + 'A1!';

    try {
      const result = await shopifyClient.request<{
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

      if (result.customerCreate.customerUserErrors && result.customerCreate.customerUserErrors.length > 0) {
        const errorMessage = result.customerCreate.customerUserErrors[0].message;
        const errorCode = result.customerCreate.customerUserErrors[0].code;
        
        if (errorCode === 'TAKEN' || errorMessage.includes('already exists') || errorMessage.includes('taken')) {
          console.log('ℹ️ Customer already exists in Shopify (by phone or email)');
          // אם הלקוח כבר קיים, נחזיר null וננסה שוב בפעם הבאה
          return null;
        } else if (errorCode === 'THROTTLED' || errorMessage.includes('Limit exceeded')) {
          console.warn('⚠️ Shopify API throttled - customer creation limit exceeded. Will retry later.');
          return null;
        } else {
          console.error('❌ Error creating customer:', result.customerCreate.customerUserErrors);
        }
      } else if (result.customerCreate.customer) {
        shopifyCustomerId = result.customerCreate.customer.id;
        console.log('✅ Customer created in Shopify:', shopifyCustomerId);
      }
    } catch (error: any) {
      // בדוק אם זו שגיאת throttling
      if (error.message?.includes('Limit exceeded') || error.message?.includes('THROTTLED')) {
        console.warn('⚠️ Shopify API throttled - customer creation limit exceeded. Will retry later.');
        return null;
      }
      console.warn('⚠️ Could not create customer in Shopify:', error.message);
    }

    // שמור את ה-Shopify Customer ID ב-Supabase
    if (shopifyCustomerId) {
      const { error } = await supabase
        .from('user_shopify_sync')
        .upsert({
          user_id: userId,
          shopify_customer_id: shopifyCustomerId,
          phone: phone,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        console.error('❌ Error saving to Supabase:', error);
        // לא נזרוק שגיאה - זה לא קריטי
      } else {
        console.log('✅ Saved Shopify Customer ID to Supabase');
        // עדכן את ה-cache
        customerIdCache.set(userId, { id: shopifyCustomerId, timestamp: Date.now() });
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
          console.log('✅ Updated customer address in Shopify');
        } catch (error) {
          console.warn('⚠️ Could not update customer address:', error);
        }
      }
    }

    return shopifyCustomerId;
  } catch (error: any) {
    console.error('❌ Error syncing customer to Shopify:', error);
    throw error;
  }
}

// Cache ל-Shopify Customer ID כדי למנוע קריאות מיותרות ל-DB
const customerIdCache = new Map<string, { id: string | null; timestamp: number }>();
const CACHE_TTL = 60000; // 60 שניות

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
    const { data, error } = await supabase
      .from('user_shopify_sync')
      .select('shopify_customer_id')
      .eq('user_id', userId)
      .maybeSingle(); // משתמש ב-maybeSingle במקום single כדי לא לזרוק שגיאה אם אין רשומה

    if (error) {
      // אם הטבלה לא קיימת (PGRST116) או שגיאה אחרת, נחזיר null
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('⚠️ user_shopify_sync table does not exist - run supabase-schema.sql');
        return null;
      }
      console.warn('⚠️ Error getting Shopify Customer ID:', error.message);
      return null;
    }

    const customerId = data?.shopify_customer_id || null;
    
    // שמור ב-cache
    if (useCache) {
      customerIdCache.set(userId, { id: customerId, timestamp: Date.now() });
    }
    
    return customerId;
  } catch (error) {
    console.error('Error getting Shopify Customer ID:', error);
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

