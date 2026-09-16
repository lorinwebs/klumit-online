/**
 * Lists Bag products missing dimension keywords in their Shopify description.
 * Does NOT invent sizes — only reports. Optionally strips broken <meta> tags.
 *
 * Usage:
 *   npx tsx scripts/audit-bag-dimensions.ts
 *   npx tsx scripts/audit-bag-dimensions.ts --fix-biasia-meta
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

const rawDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
const domain = rawDomain.includes('.')
  ? rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  : `${rawDomain}.myshopify.com`;
const adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN;
const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

if (!domain || !storefrontToken) {
  console.error('Missing Shopify storefront env');
  process.exit(1);
}

const HAS_DIM = /מידות|dimensions|\bcm\b|ס["״']?מ|אורך|רוחב|גובה|\d+\s*[x×]/i;

async function fetchAllProducts(): Promise<
  Array<{
    id: string;
    title: string;
    handle: string;
    productType: string;
    vendor: string;
    descriptionHtml: string;
  }>
> {
  const products: Array<{
    id: string;
    title: string;
    handle: string;
    productType: string;
    vendor: string;
    descriptionHtml: string;
  }> = [];
  let cursor: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const query = `
      query ($cursor: String) {
        products(first: 50, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id title handle productType vendor descriptionHtml
            }
          }
        }
      }
    `;
    const res: Response = await fetch(`https://${domain}/api/2024-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken!,
      },
      body: JSON.stringify({ query, variables: { cursor } }),
    });
    const json: {
      data?: {
        products?: {
          pageInfo: { hasNextPage: boolean; endCursor: string | null };
          edges: Array<{
            node: {
              id: string;
              title: string;
              handle: string;
              productType: string;
              vendor: string;
              descriptionHtml: string;
            };
          }>;
        };
      };
    } = await res.json();
    const conn = json.data?.products;
    for (const edge of conn?.edges ?? []) {
      products.push(edge.node);
    }
    hasNext = Boolean(conn?.pageInfo?.hasNextPage);
    cursor = conn?.pageInfo?.endCursor ?? null;
  }
  return products;
}

async function fixBiasiaMeta(handle: string) {
  if (!adminToken) {
    console.error('SHOPIFY_ADMIN_API_TOKEN required for --fix-biasia-meta');
    return;
  }
  const find = await fetch(`https://${domain}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({
      query: `query ($q: String!) {
        products(first: 1, query: $q) {
          edges { node { id descriptionHtml } }
        }
      }`,
      variables: { q: `handle:${handle}` },
    }),
  });
  const found = await find.json();
  const node = found.data?.products?.edges?.[0]?.node;
  if (!node) {
    console.error('Product not found:', handle);
    return;
  }
  const cleaned = String(node.descriptionHtml || '').replace(
    /<meta\s+charset=["']?utf-8["']?\s*\/?>/gi,
    ''
  );
  if (cleaned === node.descriptionHtml) {
    console.log('No <meta charset> found on', handle);
    return;
  }
  const update = await fetch(`https://${domain}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({
      query: `mutation ($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id handle }
          userErrors { field message }
        }
      }`,
      variables: {
        input: { id: node.id, descriptionHtml: cleaned },
      },
    }),
  });
  const result = await update.json();
  console.log(JSON.stringify(result.data?.productUpdate ?? result, null, 2));
}

async function main() {
  const fixMeta = process.argv.includes('--fix-biasia-meta');
  if (fixMeta) {
    await fixBiasiaMeta('the-signature-grained-leather-wallet');
  }

  const products = await fetchAllProducts();
  const bags = products.filter((p) => /bag|תיק/i.test(p.productType || 'Bag'));
  const missing = bags.filter((p) => !HAS_DIM.test(p.descriptionHtml || ''));

  console.log(`Bags total: ${bags.length}`);
  console.log(`Bags missing dimensions: ${missing.length}`);
  for (const p of missing) {
    console.log(`- [${p.vendor}] ${p.handle} — ${p.title}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
