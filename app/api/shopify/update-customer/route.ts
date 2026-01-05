import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminClient } from '@/lib/shopify-admin';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      address, 
      city, 
      zipCode, 
      apartment, 
      floor, 
      notes 
    } = body;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!shopifyAdminClient) {
      return NextResponse.json({ error: 'Admin API not configured' }, { status: 500 });
    }

    // קבל את ה-Shopify Customer ID מ-Supabase
    const { data: syncData } = await supabase
      .from('user_shopify_sync')
      .select('shopify_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!syncData?.shopify_customer_id) {
      return NextResponse.json({ error: 'No Shopify customer linked' }, { status: 404 });
    }

    // בנה את address2 מדירה, קומה והערות
    const address2Parts = [
      apartment ? `דירה ${apartment}` : '',
      floor ? `קומה ${floor}` : '',
      notes || ''
    ].filter(Boolean);
    const address2 = address2Parts.join(', ') || undefined;

    // נרמל טלפון לפורמט E.164
    let formattedPhone = phone;
    if (phone && !phone.startsWith('+')) {
      const digitsOnly = phone.replace(/\D/g, '');
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
        firstName,
        lastName,
        email,
        phone: formattedPhone,
        addresses: [{
          address1: address,
          address2,
          city,
          zip: zipCode,
          country: 'IL',
        }],
      },
    });

    if (result.customerUpdate.userErrors.length > 0) {
      const errors = result.customerUpdate.userErrors.map(e => e.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      customerId: syncData.shopify_customer_id 
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


