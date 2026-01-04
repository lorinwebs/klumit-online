import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminClient } from '@/lib/shopify-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    console.log('🔍 find-customer-by-email: Starting', { email });

    if (!email) {
      console.log('❌ find-customer-by-email: No email provided');
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (!shopifyAdminClient) {
      console.log('❌ find-customer-by-email: Admin API not configured');
      return NextResponse.json({ error: 'Admin API not configured' }, { status: 500 });
    }

    const query = `email:"${email}"`;
    console.log('🔍 find-customer-by-email: Searching with query', { query });

    const searchResult = await shopifyAdminClient.request<{
      customers: { edges: Array<{ node: { id: string; email: string; phone: string | null } }> };
    }>(`
      query getCustomers($query: String!) {
        customers(first: 1, query: $query) {
          edges { node { id email phone } }
        }
      }
    `, { query });

    console.log('📦 find-customer-by-email: Search result', { 
      edges: searchResult.customers.edges,
      found: searchResult.customers.edges.length > 0,
    });

    const customer = searchResult.customers.edges[0]?.node;
    const customerId = customer?.id || null;

    console.log('✅ find-customer-by-email: Returning', { customerId, customerEmail: customer?.email, customerPhone: customer?.phone });

    return NextResponse.json({ customerId });
  } catch (error: any) {
    console.error('❌ find-customer-by-email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

