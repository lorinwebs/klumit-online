const SITE_URL = 'https://www.klumit-online.co.il';

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
}

export function generateProductJsonLd(product: ProductSchemaInput) {
  const category = detectCategory(product.productType || '', product.title);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || `${product.title} - תיק עור איטלקי יוקרתי מקלומית`,
    url: `${SITE_URL}/products/${product.handle}`,
    image: product.images.map((img) => img.url),
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Klumit',
    },
    ...(product.sku && { sku: product.sku }),
    material: 'Genuine Italian Leather',
    category,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.handle}`,
      priceCurrency: product.currency || 'ILS',
      price: parseFloat(product.price).toFixed(2),
      availability: product.available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'קלומית',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'IL',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          businessDays: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 5,
          },
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
  return 'אביזרי עור';
}
