import { supabase } from './supabase';
import { shopifyClient } from './shopify';
import { CREATE_CUSTOMER_MUTATION } from './shopify-admin';

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
      .single();

    if (existingSync.data?.shopify_customer_id) {
      // הלקוח כבר קיים - נשמור את ה-ID ונמשיך
      shopifyCustomerId = existingSync.data.shopify_customer_id;
      console.log('ℹ️ Customer already synced to Shopify:', shopifyCustomerId);
    } else {
      // השתמש בפרטים שהתקבלו, או צור email מ-phone אם אין
      const userEmail = customerData?.email || `phone-${phoneWithoutPlus.replace(/\D/g, '')}@klomit.local`;
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
          // אם הלקוח כבר קיים (לפי טלפון או אימייל), ננסה להמשיך
          const errorMessage = result.customerCreate.customerUserErrors[0].message;
          const errorCode = result.customerCreate.customerUserErrors[0].code;
          
          if (errorCode === 'TAKEN' || errorMessage.includes('already exists') || errorMessage.includes('taken')) {
            console.log('ℹ️ Customer already exists in Shopify (by phone or email)');
            // Shopify זיהה שהלקוח כבר קיים - נמשיך בלי ID
            // הערה: Storefront API לא מאפשר לנו לקבל את ה-ID של לקוח קיים בלי customerAccessToken
          } else {
            console.error('❌ Error creating customer:', result.customerCreate.customerUserErrors);
          }
        } else if (result.customerCreate.customer) {
          shopifyCustomerId = result.customerCreate.customer.id;
          console.log('✅ Customer created in Shopify:', shopifyCustomerId);
        }
      } catch (error: any) {
        console.warn('⚠️ Could not create customer in Shopify:', error.message);
      }
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
      }
    }

    return shopifyCustomerId;
  } catch (error: any) {
    console.error('❌ Error syncing customer to Shopify:', error);
    throw error;
  }
}

/**
 * מקבל את ה-Shopify Customer ID של משתמש
 */
export async function getShopifyCustomerId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_shopify_sync')
      .select('shopify_customer_id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.shopify_customer_id;
  } catch (error) {
    console.error('Error getting Shopify Customer ID:', error);
    return null;
  }
}

