import { shopifyClient } from '@/lib/shopify';
import { SITE_URL, productUrl } from '@/lib/seo';
import { STORE_POLICY } from '@/lib/store-policy';
import { getSaleInfo } from '@/lib/product-sale';
import { isProductSoldOut } from '@/lib/product-availability';
import { isDevOnlyProductHidden } from '@/lib/dev-only-products';
import { detectProductMaterial, materialSchemaValue } from '@/lib/product-material';

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace), fetched daily by Merchant Center.
 * Links point at this storefront — Shopify's primary domain is the myshopify one, so the
 * Google & YouTube app would send shoppers to the Shopify theme instead.
 *
 * Price and availability must match the product page's JSON-LD (generateProductJsonLd),
 * or Merchant Center disapproves the item.
 */

const FEED_PRODUCTS_QUERY = `
  query getMerchantFeedProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          title
          handle
          description
          productType
          vendor
          tags
          options { name values }
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { minVariantPrice { amount currencyCode } }
          images(first: 11) { edges { node { url } } }
          variants(first: 50) {
            edges {
              node {
                barcode
                availableForSale
                compareAtPrice { amount currencyCode }
              }
            }
          }
        }
      }
    }
  }
`;

interface FeedProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  productType: string;
  vendor: string;
  tags: string[];
  options: Array<{ name: string; values: string[] }>;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  compareAtPriceRange?: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: Array<{ node: { url: string } }> };
  variants: {
    edges: Array<{
      node: {
        barcode: string | null;
        availableForSale: boolean;
        compareAtPrice: { amount: string; currencyCode: string } | null;
      };
    }>;
  };
}

async function fetchAllProducts(): Promise<FeedProduct[]> {
  const all: FeedProduct[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data: {
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{ node: FeedProduct }>;
      };
    } = await shopifyClient.request(FEED_PRODUCTS_QUERY, { first: 100, after });

    all.push(...data.products.edges.map((edge) => edge.node));
    hasNext = data.products.pageInfo.hasNextPage;
    after = data.products.pageInfo.endCursor;
    if (all.length > 2000) break;
  }
  return all;
}

/** Store barcodes hold internal codes ("1", "v806"); only real GTINs (valid check digit) are sent. */
function validGtin(barcode: string | null): string | null {
  const code = barcode?.replace(/\s/g, '') ?? '';
  if (!/^(\d{8}|\d{12,14})$/.test(code) || /^0+$/.test(code)) return null;
  const digits = code.split('').map(Number);
  const check = digits.pop()!;
  const sum = digits
    .reverse()
    .reduce((acc, digit, i) => acc + digit * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check ? code : null;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Characters outside the XML 1.0 range make the whole feed unparseable
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

function tag(name: string, value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  return `<g:${name}>${escapeXml(String(value))}</g:${name}>`;
}

function money(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

function productItem(product: FeedProduct): string {
  const numericId = product.id.split('/').pop()!;
  const currency = product.priceRange.minVariantPrice.currencyCode || 'ILS';
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const sale = getSaleInfo(product);
  const shippingRate =
    price >= STORE_POLICY.freeShippingThreshold ? 0 : STORE_POLICY.standardShippingPrice;

  const images = product.images.edges.map((edge) => edge.node.url);
  const variants = product.variants.edges.map((edge) => edge.node);
  const gtin = validGtin((variants.find((v) => v.availableForSale) ?? variants[0])?.barcode ?? null);

  const colorOption = product.options.find((option) => /^(color|colour|צבע)$/i.test(option.name.trim()));
  const color = colorOption?.values.length === 1 ? colorOption.values[0] : null;

  const material = materialSchemaValue(
    detectProductMaterial(product.title, product.description, product.productType, ...product.tags)
  );

  const title = product.title.slice(0, 150);
  const description = (product.description?.trim() || product.title).slice(0, 5000);

  return [
    '<item>',
    tag('id', numericId),
    `<title>${escapeXml(title)}</title>`,
    `<description>${escapeXml(description)}</description>`,
    `<link>${escapeXml(productUrl(encodeURIComponent(product.handle)))}</link>`,
    tag('image_link', images[0]),
    ...images.slice(1, 11).map((url) => tag('additional_image_link', url)),
    tag('availability', 'in_stock'),
    tag('price', money(sale ? sale.original : price, currency)),
    sale ? tag('sale_price', money(price, currency)) : '',
    tag('brand', product.vendor || 'Klumit'),
    tag('condition', 'new'),
    gtin ? tag('gtin', gtin) : tag('identifier_exists', 'no'),
    tag('product_type', product.productType),
    tag('color', color),
    tag('material', material),
    tag('age_group', 'adult'),
    '<g:shipping>',
    tag('country', 'IL'),
    tag('price', money(shippingRate, 'ILS')),
    '</g:shipping>',
    '</item>',
  ]
    .filter(Boolean)
    .join('');
}

export async function GET() {
  let products: FeedProduct[];
  try {
    products = await fetchAllProducts();
  } catch (error) {
    console.error('Google Merchant feed: Shopify fetch failed', error);
    // A failed fetch keeps Merchant Center's last good copy; an empty feed would delist everything.
    return new Response('Feed temporarily unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '600' },
    });
  }

  const items = products
    .filter((product) => !isDevOnlyProductHidden(product) && !isProductSoldOut(product))
    .filter((product) => product.images.edges.length > 0)
    .map(productItem);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    '<channel>',
    '<title>קלומית - Klumit</title>',
    `<link>${SITE_URL}</link>`,
    '<description>תיקים, ארנקים וחגורות מאיטליה</description>',
    ...items,
    '</channel>',
    '</rss>',
  ].join('\n');

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
