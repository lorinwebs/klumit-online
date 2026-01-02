'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { shopifyAdminClient } from '@/lib/shopify-admin';
import { GraphQLClient } from 'graphql-request';
import { syncCustomerToShopify } from '@/lib/sync-customer';

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

/**
 * Server Action: מחפש לקוח ב-Shopify לפי טלפון
 */
export async function findShopifyCustomerByPhone(phone: string): Promise<string | null> {
  if (!shopifyAdminClient) {
    return null;
  }

  try {
    // נסה כמה פורמטים של טלפון
    const phoneWithoutPlus = phone.replace(/^\+/, '');
    const formattedPhone = phoneWithoutPlus.startsWith('972') 
      ? `+${phoneWithoutPlus}` 
      : `+972${phoneWithoutPlus.replace(/^0/, '')}`;

    const phoneVariations = [
      formattedPhone,
      formattedPhone.replace(/^\+/, ''),
      formattedPhone.replace(/^\+972/, '0'),
      phoneWithoutPlus,
    ];

    for (const phoneQuery of phoneVariations) {
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
            return existingCustomer.id;
          }
        } catch (innerError: any) {
          // שגיאה בחיפוש - נמשיך לנסות
        }
      }
    }

    return null;
  } catch (error: any) {
    return null;
  }
}

/**
 * Server Action: שומר Shopify Customer ID ב-DB
 */
export async function saveShopifyCustomerId(
  userId: string,
  shopifyCustomerId: string,
  phone: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    
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
      return false;
    }

    return true;
  } catch (error: any) {
    return false;
  }
}

export async function verifyOtpServer(prevState: any, formData: FormData) {
  const phone = formData.get('phone') as string;
  const token = formData.get('token') as string;
  
  if (!phone || !token) {
    return { error: 'מספר טלפון וקוד נדרשים' };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      return { error: error.message };
    }

    if (!data?.session) {
      return { error: 'אימות נכשל' };
    }

    const user = data.user;
    
    // סנכרן עם Shopify מיד אחרי האימות - יוצר יוזר בשופיפי עם placeholder email מהטלפון
    if (user && phone) {
      try {
        await syncCustomerToShopify(
          user.id,
          phone,
          {
            email: user.email || undefined,
            firstName: user.user_metadata?.first_name || undefined,
            lastName: user.user_metadata?.last_name || undefined,
          }
        );
      } catch (syncError: any) {
        // לא נעצור את התהליך אם הסנכרון נכשל - המשתמש כבר מאומת
      }
    }

    // בדיקה אם יש פרופיל כדי לדעת לאן לנווט
    const hasProfile = 
      (user?.user_metadata?.first_name && user?.user_metadata?.last_name) ||
      user?.email;

    // אם הכל תקין - הפעולה תבצע הפניה
    // חשוב: redirect זורק שגיאה ב-Next.js, לכן הוא חייב להיות מחוץ ל-try/catch או בסוף
    redirect(hasProfile ? '/' : '/auth/complete-profile');
  } catch (err: any) {
    // אם זה redirect, זרוק אותו הלאה
    if (err?.digest?.includes('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
      throw err;
    }
    // אחרת, החזר שגיאה
    return { error: err?.message || 'שגיאה באימות הקוד' };
  }
}

export async function verifyEmailOtpServer(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const token = formData.get('token') as string;
  
  if (!email || !token) {
    return { error: 'אימייל וקוד נדרשים' };
  }

  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      return { error: error.message };
    }

    if (!data?.session) {
      return { error: 'אימות נכשל' };
    }

    const user = data.user;
    
    // עדכן את האימייל אם יש pending_email
    const pendingEmail = user?.user_metadata?.pending_email;
    if (pendingEmail && pendingEmail !== user.email) {
      const { error: updateError } = await supabase.auth.updateUser({
        email: pendingEmail,
        data: {
          email_verified: true,
          pending_email: null,
        },
      });

      if (updateError) {
        // שגיאה בעדכון אימייל - לא קריטי
      }
    }

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'שגיאה באימות הקוד' };
  }
}
