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
        disallow: ['/api/', '/auth/', '/checkout/', '/cart/', '/account/', '/payment/'],
      },
    ],
    sitemap: 'https://www.klumit-online.co.il/sitemap.xml',
  };
}
