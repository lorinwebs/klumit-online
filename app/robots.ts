import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/checkout/',
          '/cart/',
          '/account/',
          '/payment/',
          '/lorin-mor-wedding-gifts',
          '/*?orderby=',
          '/*?add-to-cart=',
          '/*?filter=',
          '/*?utm_*',
          '/*?fbclid=*',
          '/*?ref=',
          '/*?sessionid=',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/auth/', '/checkout/', '/cart/', '/account/', '/payment/', '/lorin-mor-wedding-gifts'],
      },
      // AI answer-engine crawlers (AEO): allow indexing of public content
      {
        userAgent: [
          'GPTBot',
          'OAI-SearchBot',
          'ChatGPT-User',
          'PerplexityBot',
          'Perplexity-User',
          'ClaudeBot',
          'Claude-Web',
          'Google-Extended',
          'Applebot-Extended',
          'CCBot',
        ],
        allow: '/',
        disallow: ['/api/', '/auth/', '/checkout/', '/cart/', '/account/', '/payment/', '/lorin-mor-wedding-gifts'],
      },
    ],
    sitemap: 'https://www.klumit-online.co.il/sitemap.xml',
  };
}
