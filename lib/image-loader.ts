'use client';

/**
 * Tells next/image where to fetch each size of a picture (wired up in next.config.js).
 *
 * Product photos are resized by Shopify's own CDN, which also picks WebP/AVIF for the
 * browser. They used to go through Vercel's image optimizer, and once its monthly allowance
 * ran out every photo it had not already cached (any new or replaced one) failed with 402.
 */
export default function imageLoader({ src, width }: { src: string; width: number }): string {
  if (src.startsWith('https://cdn.shopify.com/')) {
    const url = new URL(src);
    url.searchParams.set('width', String(width));
    return url.toString();
  }

  // Everything else (files in /public) is served as the file itself. The file server
  // ignores `w`; it is there because next/image expects each size to have its own URL.
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
}
