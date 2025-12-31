import { GraphQLClient } from 'graphql-request';

/**
 * הגדרת Storefront API:
 * 
 * 1. ב-Shopify Admin: Settings > Apps and sales channels > Develop apps
 * 2. צור אפליקציה חדשה והפעל Storefront API
 * 3. הפעל הרשאות: unauthenticated_read_product_listings, unauthenticated_write_checkouts
 * 4. התקן את האפליקציה והעתק את ה-Storefront access token
 * 5. הוסף ל-.env.local:
 *    NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store-name (ללא .myshopify.com)
 *    NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpss_xxxxx (או shpat_xxxxx)
 * 
 * הערה: השתמש ב-"API secret key" מההגדרות (הערך שמתחיל ב-shpss_)
 *        לא צריך את ה-"API key" - רק את ה-secret key
 */

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN!;
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

// הוסף .myshopify.com אם לא קיים
const storeDomain = domain.includes('.myshopify.com') 
  ? domain 
  : `${domain}.myshopify.com`;

// בדיקה שהמשתנים מוגדרים
if (!domain || !storefrontAccessToken) {
  console.error('❌ Shopify credentials missing!');
  console.error('Domain:', domain || 'NOT SET');
  console.error('Token:', storefrontAccessToken ? `${storefrontAccessToken.substring(0, 10)}...` : 'NOT SET');
}

export const shopifyClient = new GraphQLClient(
  `https://${storeDomain}/api/2024-01/graphql.json`,
  {
    headers: {
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      'Content-Type': 'application/json',
    },
  }
);

export const PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          descriptionHtml
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
              }
            }
          }
        }
      }
    }
  }
`;

export const PRODUCT_QUERY = `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      id
      title
      handle
      description
      descriptionHtml
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 10) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            availableForSale
            quantityAvailable
          }
        }
      }
    }
  }
`;

export const CREATE_CART_MUTATION = `
  mutation createCart($cartInput: CartInput!) {
    cartCreate(input: $cartInput) {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export const ADD_TO_CART_MUTATION = `
  mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

