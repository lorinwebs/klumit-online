[Violation] Added non-passive event listener to a scroll-blocking 'wheel' event. Consider marking event handler as 'passive' to make the page more responsive. See https://www.chromestatus.com/feature/5745543795965952import { supabase } from './supabase';
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
      .maybeSingle(); // שימוש ב-maybeSingle במקום single כדי לא לזרוק שגיאה אם אין רשומה

    if (existingSync.data?.shopify_customer_id) {
      // הלקוח כבר קיים - נשמור את ה-ID ונמשיך
      shopifyCustomerId = existingSync.data.shopify_customer_id;
      console.log('ℹ️ Customer already synced to Shopify:', shopifyCustomerId);
      return shopifyCustomerId; // החזר מיד - אין צורך לעשות כלום נוסף
    } else {
      // נסה למצוא customer קיים ב-Shopify לפני יצירה חדשה
      // תמיד נחפש לפי טלפון קודם (זה המזהה העיקרי)
      console.log('🔍 No customer ID in DB, searching for existing customer in Shopify by phone...');
      
      try {
        const { shopifyAdminClient } = await import('./shopify-admin');
        if (shopifyAdminClient) {
          const FIND_CUSTOMER_QUERY = `
            query getCustomers($query: String!) {
              customers(first: 1, query: $query) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          `;
          
          // תמיד נחפש לפי טלפון קודם (זה המזהה העיקרי)
          console.log('🔍 Searching for customer by phone:', formattedPhone);
          
          let customerResult = await shopifyAdminClient.request<{
            customers: { edges: Array<{ node: { id: string } }> };
          }>(FIND_CUSTOMER_QUERY, { query: `phone:${formattedPhone}` });
          
          console.log('📊 Search results by phone:', {
            found: customerResult.customers.edges.length,
            results: customerResult.customers.edges.map(e => e.node.id)
          });
          
          // אם לא מצאנו לפי טלפון, ננסה לפי email (אם יש)
          if (customerResult.customers.edges.length === 0 && customerData?.email) {
            console.log('🔍 No customer found by phone, trying by email:', customerData.email);
            customerResult = await shopifyAdminClient.request<{
              customers: { edges: Array<{ node: { id: string } }> };
            }>(FIND_CUSTOMER_QUERY, { query: `email:${customerData.email}` });
            
            console.log('📊 Search results by email:', {
              found: customerResult.customers.edges.length,
              results: customerResult.customers.edges.map(e => e.node.id)
            });
          }
          
          if (customerResult.customers.edges.length > 0) {
            shopifyCustomerId = customerResult.customers.edges[0].node.id;
            console.log('✅ Found existing customer in Shopify:', shopifyCustomerId);
            
            // שמור את ה-ID ב-DB מיד עם הקישור לטלפון
            console.log('💾 Saving to Supabase:', {
              user_id: userId,
              shopify_customer_id: shopifyCustomerId,
              phone: phone
            });
            
            const { data: saveData, error: saveError } = await supabase
              .from('user_shopify_sync')
              .upsert({
                user_id: userId,
                shopify_customer_id: shopifyCustomerId,
                phone: phone,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id',
              })
              .select();
            
            if (saveError) {
              console.error('❌ Error saving found customer to Supabase:', saveError);
              console.error('Error details:', JSON.stringify(saveError, null, 2));
            } else {
              console.log('✅ Saved found customer ID to Supabase with phone link:', saveData);
            }
            
            return shopifyCustomerId; // החזר את ה-ID שנמצא
          } else {
            console.log('ℹ️ No existing customer found in Shopify, will create new customer...');
          }
        }
      } catch (findError) {
        console.warn('⚠️ Could not search for existing customer in Shopify:', findError);
        // נמשיך לנסות ליצור customer חדש
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
          // אם הלקוח כבר קיים (לפי טלפון או אימייל), ננסה להמשיך
          const errorMessage = result.customerCreate.customerUserErrors[0].message;
          const errorCode = result.customerCreate.customerUserErrors[0].code;
          
          if (errorCode === 'TAKEN' || errorMessage.includes('already exists') || errorMessage.includes('taken')) {
            console.log('ℹ️ Customer already exists in Shopify (by phone or email)');
            // Shopify זיהה שהלקוח כבר קיים - ננסה למצוא אותו ב-Admin API
            try {
              const { shopifyAdminClient } = await import('./shopify-admin');
              if (shopifyAdminClient) {
                // נסה למצוא customer לפי email או phone ב-Admin API
                const searchQuery = customerData?.email 
                  ? `email:${customerData.email}`
                  : `phone:${formattedPhone}`;
                
                const FIND_CUSTOMER_QUERY = `
                  query getCustomers($query: String!) {
                    customers(first: 1, query: $query) {
                      edges {
                        node {
                          id
                        }
                      }
                    }
                  }
                `;
                
                const customerResult = await shopifyAdminClient.request<{
                  customers: { edges: Array<{ node: { id: string } }> };
                }>(FIND_CUSTOMER_QUERY, { query: searchQuery });
                
                if (customerResult.customers.edges.length > 0) {
                  shopifyCustomerId = customerResult.customers.edges[0].node.id;
                  console.log('✅ Found existing customer in Shopify:', shopifyCustomerId);
                }
              }
            } catch (findError) {
              console.warn('⚠️ Could not find existing customer:', findError);
            }
          } else if (errorCode === 'THROTTLED' || errorMessage.includes('Limit exceeded')) {
            console.warn('⚠️ Shopify API throttled - customer creation limit exceeded. Will retry later.');
            // לא נזרוק שגיאה - נחזיר null וננסה שוב בפעם הבאה
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

/**
 * מקבל את ה-Shopify Customer ID של משתמש
 */
export async function getShopifyCustomerId(userId: string): Promise<string | null> {
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

    if (!data) {
      return null;
    }

    return data.shopify_customer_id;
  } catch (error) {
    console.error('Error getting Shopify Customer ID:', error);
    return null;
  }
}

