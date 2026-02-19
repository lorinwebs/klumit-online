import { MetadataRoute } from 'next';
import { shopifyClient } from '@/lib/shopify';

const BASE_URL = 'https://www.klumit-online.co.il';

const SITEMAP_PRODUCTS_QUERY = `
  query getSitemapProducts($first: Int!) {
    products(first: $first, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          handle
          updatedAt
        }
      }
    }
  }
`;

const SITEMAP_ARTICLES_QUERY = `
  query getSitemapArticles($first: Int!) {
    articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
      edges {
        node {
          handle
          publishedAt
        }
      }
    }
  }
`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/products?tab=belts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/products?tab=wallets`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/returns`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  let productPages: MetadataRoute.Sitemap = [];
  try {
    const data = await shopifyClient.request<{
      products: { edges: Array<{ node: { handle: string; updatedAt: string } }> };
    }>(SITEMAP_PRODUCTS_QUERY, { first: 250 });

    productPages = data.products.edges.map(({ node }) => ({
      url: `${BASE_URL}/products/${node.handle}`,
      lastModified: new Date(node.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Failed to fetch products for sitemap:', error);
  }

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const data = await shopifyClient.request<{
      articles: { edges: Array<{ node: { handle: string; publishedAt: string } }> };
    }>(SITEMAP_ARTICLES_QUERY, { first: 100 });

    blogPages = [
      {
        url: `${BASE_URL}/blog`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      },
      ...data.articles.edges.map(({ node }) => ({
        url: `${BASE_URL}/blog/${node.handle}`,
        lastModified: new Date(node.publishedAt),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })),
    ];
  } catch (error) {
    console.error('Failed to fetch articles for sitemap:', error);
  }

  return [...staticPages, ...productPages, ...blogPages];
}
