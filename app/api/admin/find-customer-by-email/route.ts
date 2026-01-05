import { NextRequest, NextResponse } from 'next/server';
import { shopifyAdminClient } from '@/lib/shopify-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    if (!shopifyAdminClient) {
      return NextResponse.json({ error: 'Admin API not configured' }, { status: 500 });
    }

    const query = `email:"${email}"`;

    const searchResult = await shopifyAdminClient.request<{
      customers: { edges: Array<{ node: { id: string; email: string; phone: string | null } }> };
    }>(`
      query getCustomers($query: String!) {
        customers(first: 1, query: $query) {
          edges { node { id email phone } }
        }
      }
    `, { query });

    const customer = searchResult.customers.edges[0]?.node;
    const customerId = customer?.id || null;

    return NextResponse.json({ customerId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

