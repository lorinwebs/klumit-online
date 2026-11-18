import { detectProductMaterial, materialSchemaValue } from '@/lib/product-material';
import { STORE_POLICY } from '@/lib/store-policy';

export const SITE_URL = 'https://www.klumit-online.co.il';

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'KLUMIT',
  logo: `${SITE_URL}/logo-klumit.svg`,
} as const;

export function productUrl(handle: string) {
  return `${SITE_URL}/products/${handle}`;
}

interface ProductSchemaInput {
  title: string;
  description: string;
  handle: string;
  images: Array<{ url: string; altText?: string }>;
  brand?: string;
  sku?: string;
  price: string;
  currency?: string;
  available: boolean;
  productType?: string;
  tags?: string[];
}

export function generateProductJsonLd(product: ProductSchemaInput) {
  const category = detectCategory(product.productType || '', product.title);
  const material = detectProductMaterial(
    product.title,
    product.description,
    product.productType,
    ...(product.tags || [])
  );
  const materialValue = materialSchemaValue(material);
  const price = parseFloat(product.price);
  const shippingRate =
    price >= STORE_POLICY.freeShippingThreshold ? 0 : STORE_POLICY.standardShippingPrice;
  const { min: minDeliveryDays, max: maxDeliveryDays } = STORE_POLICY.deliveryBusinessDays;

  // Price valid until end of next year — keeps Offer eligible for rich results.
  const priceValidUntil = `${new Date().getFullYear() + 1}-12-31`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || `${product.title} - תיק יוקרתי מאיטליה מקלומית`,
    url: productUrl(product.handle),
    image: product.images.map((img) => img.url),
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Klumit',
    },
    ...(product.sku && { sku: product.sku }),
    ...(materialValue && { material: materialValue }),
    category,
    offers: {
      '@type': 'Offer',
      url: productUrl(product.handle),
      priceCurrency: product.currency || 'ILS',
      price: price.toFixed(2),
      priceValidUntil,
      availability: product.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: ORGANIZATION,
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: shippingRate,
          currency: 'ILS',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IL',
        },
        // Handling + transit add up to the delivery window promised on /shipping
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: minDeliveryDays,
            maxValue: maxDeliveryDays - 1,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IL',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: STORE_POLICY.returnWindowDays,
        returnMethod: ['https://schema.org/ReturnByMail', 'https://schema.org/ReturnInStore'],
        returnFees: 'https://schema.org/ReturnShippingFees',
        returnShippingFeesAmount: {
          '@type': 'MonetaryAmount',
          value: STORE_POLICY.returnCourierFee,
          currency: 'ILS',
        },
      },
    },
  };
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** Only for pages that show the same questions and answers as visible text. */
export function generateFaqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'he-IL',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function generateCollectionJsonLd(collection: {
  name: string;
  description: string;
  url: string;
  products: Array<{ title: string; handle: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.name,
    description: collection.description,
    url: collection.url,
    inLanguage: 'he-IL',
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: collection.products.length,
      itemListElement: collection.products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: productUrl(product.handle),
        name: product.title,
      })),
    },
  };
}

export function generateArticleJsonLd(article: {
  title: string;
  url: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  publishedAt: string;
  authorName?: string | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    ...(article.excerpt && { description: article.excerpt }),
    ...(article.imageUrl && { image: [article.imageUrl] }),
    datePublished: article.publishedAt,
    author: article.authorName ? { '@type': 'Person', name: article.authorName } : ORGANIZATION,
    publisher: ORGANIZATION,
    mainEntityOfPage: article.url,
    url: article.url,
    inLanguage: 'he-IL',
  };
}

function detectCategory(productType: string, title: string): string {
  const type = productType.toLowerCase();
  const t = title.toLowerCase();

  if (type.includes('bag') || type.includes('תיק') || t.includes('bag') || t.includes('תיק')) {
    return 'תיקים';
  }
  if (type.includes('belt') || type.includes('חגור') || t.includes('belt') || t.includes('חגור')) {
    return 'חגורות';
  }
  if (type.includes('wallet') || type.includes('ארנק') || t.includes('wallet') || t.includes('ארנק')) {
    return 'ארנקים';
  }
  return 'אביזרי אופנה';
}
