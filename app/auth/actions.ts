'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { shopifyAdminClient } from '@/lib/shopify-admin';
import { GraphQLClient } from 'graphql-request';
import { notifyNewUser } from '@/lib/telegram';

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
    
    // בדוק אם זה משתמש חדש (נוצר בדקה האחרונה)
    const isNewUser = user?.created_at && 
      (Date.now() - new Date(user.created_at).getTime()) < 60000;
    
    // שלח הודעת טלגרם על משתמש חדש
    if (isNewUser && user && phone) {
      notifyNewUser(phone, user.id).catch(() => {});
    }
    
    // סנכרון Shopify Customer הוסר - נעשה בנפרד

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

const UPDATE_CUSTOMER_MUTATION = `
  mutation customerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        firstName
        lastName
        email
        phone
        defaultAddress {
          id
          address1
          address2
          city
          zip
          country
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Server Action: עדכון פרופיל משתמש (Supabase + Shopify)
 */
export async function updateUserProfile(data: {
  firstName: string;
  lastName: string;
  phone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZipCode?: string;
  shippingApartment?: string;
  shippingFloor?: string;
  shippingNotes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    // 1. עדכן ב-Supabase
    const { data: userData, error } = await supabase.auth.updateUser({
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        shipping_address: data.shippingAddress,
        shipping_city: data.shippingCity,
        shipping_zip_code: data.shippingZipCode,
        shipping_apartment: data.shippingApartment,
        shipping_floor: data.shippingFloor,
        shipping_notes: data.shippingNotes,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // 2. עדכן ב-Shopify (אם יש חיבור)
    if (shopifyAdminClient && userData?.user) {
      try {
        // קבל את ה-Shopify Customer ID
        const { data: syncData } = await supabase
          .from('user_shopify_sync')
          .select('shopify_customer_id')
          .eq('user_id', userData.user.id)
          .maybeSingle();

        if (syncData?.shopify_customer_id) {
          // בנה את address2 מדירה, קומה והערות
          const address2Parts = [
            data.shippingApartment ? `דירה ${data.shippingApartment}` : '',
            data.shippingFloor ? `קומה ${data.shippingFloor}` : '',
            data.shippingNotes || ''
          ].filter(Boolean);
          const address2 = address2Parts.join(', ') || undefined;

          // נרמל טלפון לפורמט E.164
          let formattedPhone = data.phone;
          if (data.phone && !data.phone.startsWith('+')) {
            const digitsOnly = data.phone.replace(/\D/g, '');
            if (digitsOnly.startsWith('972')) {
              formattedPhone = `+${digitsOnly}`;
            } else if (digitsOnly.startsWith('0')) {
              formattedPhone = `+972${digitsOnly.slice(1)}`;
            } else {
              formattedPhone = `+972${digitsOnly}`;
            }
          }

          // עדכן את הלקוח ב-Shopify
          const result = await shopifyAdminClient.request<{
            customerUpdate: {
              customer: { id: string } | null;
              userErrors: Array<{ field: string[]; message: string }>;
            };
          }>(UPDATE_CUSTOMER_MUTATION, {
            input: {
              id: syncData.shopify_customer_id,
              firstName: data.firstName,
              lastName: data.lastName,
              phone: formattedPhone,
              addresses: data.shippingAddress ? [{
                address1: data.shippingAddress,
                address2,
                city: data.shippingCity,
                zip: data.shippingZipCode,
                country: 'IL',
              }] : undefined,
            },
          });

          if (result.customerUpdate.userErrors.length > 0) {
            // לא נכשיל את כל הפעולה - Supabase כבר עודכן
          }
        }
      } catch (shopifyError: any) {
        // לא נכשיל את כל הפעולה - Supabase כבר עודכן
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'שגיאה בעדכון הפרופיל' };
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
