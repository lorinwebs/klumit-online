import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminClient } from '@/lib/shopify-admin';

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

export async function POST(request: NextRequest) {
  try {
    const { userId, phone, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // שלב 1: בדוק ב-Supabase
    const { data: existingSync } = await supabase
      .from('user_shopify_sync')
      .select('shopify_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingSync?.shopify_customer_id) {
      return NextResponse.json({ 
        customerId: existingSync.shopify_customer_id, 
        source: 'supabase' 
      });
    }

    // שלב 2: חפש ב-Shopify
    if (!shopifyAdminClient) {
      return NextResponse.json({ error: 'Admin API not configured' }, { status: 500 });
    }

    let shopifyCustomerId: string | null = null;

    // נרמל טלפון לפורמט 972xxx
    let normalizedPhone: string | null = null;
    if (phone) {
      const digitsOnly = phone.replace(/\D/g, '');
      if (digitsOnly.startsWith('972')) {
        normalizedPhone = digitsOnly;
      } else if (digitsOnly.startsWith('0')) {
        normalizedPhone = '972' + digitsOnly.slice(1);
      } else {
        normalizedPhone = '972' + digitsOnly;
      }
    }

    // 2a: חפש לפי טלפון
    if (normalizedPhone && !shopifyCustomerId) {
      try {
        const result = await shopifyAdminClient.request<{
          customers: { edges: Array<{ node: { id: string } }> };
        }>(FIND_CUSTOMER_QUERY, { query: `phone:"${normalizedPhone}"` });
        
        if (result.customers.edges[0]?.node) {
          shopifyCustomerId = result.customers.edges[0].node.id;
        }
      } catch {}
    }

    // 2b: חפש לפי email מיוצר
    if (normalizedPhone && !shopifyCustomerId) {
      try {
        const result = await shopifyAdminClient.request<{
          customers: { edges: Array<{ node: { id: string } }> };
        }>(FIND_CUSTOMER_QUERY, { query: `email:"phone-${normalizedPhone}@klumit.local"` });
        
        if (result.customers.edges[0]?.node) {
          shopifyCustomerId = result.customers.edges[0].node.id;
        }
      } catch {}
    }

    // 2c: חפש לפי email אמיתי
    if (email && !shopifyCustomerId) {
      try {
        const result = await shopifyAdminClient.request<{
          customers: { edges: Array<{ node: { id: string } }> };
        }>(FIND_CUSTOMER_QUERY, { query: `email:"${email}"` });
        
        if (result.customers.edges[0]?.node) {
          shopifyCustomerId = result.customers.edges[0].node.id;
        }
      } catch {}
    }

    // שמור ל-Supabase אם מצאנו
    if (shopifyCustomerId) {
      await supabase
        .from('user_shopify_sync')
        .upsert({
          user_id: userId,
          shopify_customer_id: shopifyCustomerId,
          phone: normalizedPhone,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
      
      return NextResponse.json({ 
        customerId: shopifyCustomerId, 
        source: 'shopify',
      });
    }

    return NextResponse.json({ 
      customerId: null, 
      source: 'not_found' 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
