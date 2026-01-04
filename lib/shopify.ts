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

// Shopify credentials check - will fail gracefully if missing

/**
 * Creates a Shopify Storefront client with Buyer-IP header for server-side use
 * This helps Shopify understand requests come from different buyers, reducing rate limits
 */
export function createServerShopifyClient(buyerIp?: string | null) {
  const headers: Record<string, string> = {
    'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
    'Content-Type': 'application/json',
  };
  
  if (buyerIp) {
    headers['Shopify-Storefront-Buyer-IP'] = buyerIp;
  }
  
  return new GraphQLClient(
    `https://${storeDomain}/api/2024-07/graphql.json`,
    {
      headers,
      fetch: (url, options) => 
        fetch(url, { 
          ...options as RequestInit, 
          cache: 'no-store',
          next: { revalidate: 0 }
        } as RequestInit)
    }
  );
}

/**
 * Extract buyer IP from request headers (for use in API routes)
 */
export function getBuyerIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return headers.get('x-real-ip') || null;
}

export const shopifyClient = new GraphQLClient(
  `https://${storeDomain}/api/2024-07/graphql.json`,
  {
    headers: {
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken,
      'Content-Type': 'application/json',
    },
    // ביטול Cache - קריטי! מונע קבלת תשובות ישנות מ-Next.js
    fetch: (url, options) => 
      fetch(url, { 
        ...options as RequestInit, 
        cache: 'no-store',
        next: { revalidate: 0 }
      } as RequestInit)
  }
);

export const PRODUCTS_QUERY = `
  query getProducts($first: Int!, $query: String) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          title
          handle
          description
          descriptionHtml
          productType
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
            selectedOptions {
              name
              value
            }
            image {
              url
              altText
            }
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
        buyerIdentity {
          email
          phone
        }
      }
      userErrors {
        field
        message
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

export const REMOVE_CART_LINES_MUTATION = `
  mutation removeCartLines($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
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
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_CART_LINES_MUTATION = `
  mutation updateCartLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
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
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_CART_DELIVERY_ADDRESS_MUTATION = `
  mutation cartDeliveryAddressUpdate($cartId: ID!, $deliveryAddress: MailingAddressInput!) {
    cartDeliveryAddressUpdate(cartId: $cartId, deliveryAddress: $deliveryAddress) {
      cart {
        id
        checkoutUrl
        deliveryGroups {
          deliveryAddress {
            address1
            address2
            city
            zip
            countryCodeV2
            firstName
            lastName
            phone
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_CART_BUYER_IDENTITY_MUTATION = `
  mutation cartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        id
        checkoutUrl
        buyerIdentity {
          email
          phone
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const UPDATE_CART_DISCOUNT_CODES_MUTATION = `
  mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
      cart {
        id
        checkoutUrl
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
        discountCodes {
          code
          applicable
        }
        discountAllocations {
          discountedAmount {
            amount
            currencyCode
          }
        }
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
      }
    }
  }
`;

export const GET_CART_QUERY = `
  query getCart($id: ID!) {
    cart(id: $id) {
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
                quantityAvailable
                selectedOptions {
                  name
                  value
                }
                price {
                  amount
                  currencyCode
                }
                product {
                  title
                  handle
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
      buyerIdentity {
        email
        phone
      }
    }
  }
`;

