/**
 * Read-only audit of Shopify product descriptions.
 * Reports broken Hebrew sentences, duplicate descriptions, empty/short copy,
 * and English-only descriptions on Hebrew-facing products.
 *
 * Usage:
 *   npx tsx scripts/audit-product-copy.ts
 *
 * Does NOT write to Shopify. Fix copy in Shopify Admin using the reported handles.
 */
import * as dotenv from 'dotenv';
import { GraphQLClient } from 'graphql-request';

dotenv.config({ path: '.env.local' });

const SITE_URL = 'https://www.klumit-online.co.il';

const domain = (process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '').replace(/^https?:\/\//, '');
const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '';

if (!domain || !token) {
  console.error('Missing NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local');
  process.exit(1);
}

const storeDomain = domain.includes('.myshopify.com') ? domain : `${domain}.myshopify.com`;

const client = new GraphQLClient(`https://${storeDomain}/api/2024-07/graphql.json`, {
  headers: {
    'X-Shopify-Storefront-Access-Token': token,
    'Content-Type': 'application/json',
  },
});

const QUERY = `
  query AuditProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: TITLE) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          handle
          title
          description
          descriptionHtml
          productType
          vendor
        }
      }
    }
  }
`;

interface ProductNode {
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForDedupe(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Heuristic: construct ending without noun (e.g. וגימורי before a verb) */
function findBrokenPhrases(text: string): string[] {
  const hits: string[] = [];
  const patterns: Array<{ re: RegExp; label: string }> = [
    { re: /וגימורי\s+\S+/g, label: 'וגימורי (חסר שם עצם)' },
    { re: /השימוש בחומרים איכותיים וגימורי/g, label: 'משפט שבור ידוע: וגימורי הופכים' },
    { re: /\b(של|את|על|עם|בין|ללא)\s*[.!?…]/g, label: 'מילת יחס בסוף משפט' },
    { re: /[א-ת]{2,}י\s+(הופכים|הופכת|עושים|עושה|הופך)\b/g, label: 'סמיכות חתוכה לפני פועל' },
  ];
  for (const { re, label } of patterns) {
    const m = text.match(re);
    if (m) hits.push(`${label}: "${m[0]}"`);
  }
  return hits;
}

function looksMostlyEnglish(text: string): boolean {
  if (!text || text.length < 40) return false;
  const hebrew = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return latin > 40 && hebrew < latin * 0.15;
}

interface AuditProductsResponse {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: Array<{ node: ProductNode }>;
  };
}

async function fetchAllProducts(): Promise<ProductNode[]> {
  const products: ProductNode[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data: AuditProductsResponse = await client.request(QUERY, {
      first: 50,
      after,
    });

    products.push(...data.products.edges.map((edge) => edge.node));
    hasNext = data.products.pageInfo.hasNextPage;
    after = data.products.pageInfo.endCursor;
  }

  return products;
}

async function main() {
  console.log('Fetching products from Shopify Storefront API…\n');
  const products = await fetchAllProducts();
  console.log(`Loaded ${products.length} products.\n`);

  const byNorm = new Map<string, ProductNode[]>();
  const broken: Array<{ product: ProductNode; hits: string[] }> = [];
  const empty: ProductNode[] = [];
  const short: ProductNode[] = [];
  const english: ProductNode[] = [];

  for (const p of products) {
    const plain = stripHtml(p.descriptionHtml || p.description || '');
    if (!plain) {
      empty.push(p);
      continue;
    }
    if (plain.length < 80) short.push(p);
    if (looksMostlyEnglish(plain)) english.push(p);

    const hits = findBrokenPhrases(plain);
    if (hits.length) broken.push({ product: p, hits });

    const key = normalizeForDedupe(plain);
    const group = byNorm.get(key) || [];
    group.push(p);
    byNorm.set(key, group);
  }

  const duplicates = [...byNorm.entries()]
    .filter(([, group]) => group.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  const line = (p: ProductNode) =>
    `  - ${p.handle}\n    ${p.title}\n    ${SITE_URL}/products/${p.handle}`;

  console.log('========== BROKEN / SUSPICIOUS PHRASES ==========');
  if (!broken.length) {
    console.log('(none found)\n');
  } else {
    for (const { product, hits } of broken) {
      console.log(line(product));
      for (const h of hits) console.log(`    ! ${h}`);
      console.log('');
    }
  }

  console.log('========== DUPLICATE DESCRIPTIONS ==========');
  if (!duplicates.length) {
    console.log('(none found)\n');
  } else {
    for (const [norm, group] of duplicates) {
      const preview = norm.slice(0, 100) + (norm.length > 100 ? '…' : '');
      console.log(`Shared by ${group.length} products:\n  "${preview}"`);
      for (const p of group) console.log(`  - ${p.handle} — ${SITE_URL}/products/${p.handle}`);
      console.log('');
    }
  }

  console.log('========== EMPTY DESCRIPTIONS ==========');
  if (!empty.length) console.log('(none)\n');
  else {
    for (const p of empty) console.log(line(p));
    console.log('');
  }

  console.log('========== SHORT DESCRIPTIONS (<80 chars) ==========');
  if (!short.length) console.log('(none)\n');
  else {
    for (const p of short) {
      const plain = stripHtml(p.descriptionHtml || p.description || '');
      console.log(line(p));
      console.log(`    (${plain.length} chars) "${plain}"`);
      console.log('');
    }
  }

  console.log('========== MOSTLY ENGLISH DESCRIPTIONS ==========');
  if (!english.length) console.log('(none)\n');
  else {
    for (const p of english) console.log(line(p));
    console.log('');
  }

  console.log('========== SUMMARY ==========');
  console.log(`Products scanned:     ${products.length}`);
  console.log(`Broken phrases:       ${broken.length}`);
  console.log(`Duplicate groups:     ${duplicates.length}`);
  console.log(`Empty descriptions:   ${empty.length}`);
  console.log(`Short descriptions:   ${short.length}`);
  console.log(`English descriptions: ${english.length}`);
  console.log('\nRead-only audit complete. Fix copy in Shopify Admin.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
