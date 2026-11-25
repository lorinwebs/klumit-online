'use client';

import responsiveImages from './responsive-images.json';

const resized: Record<string, { hash: string; widths: number[] }> = responsiveImages;

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

  // Large photos in /public have resized WebP copies, made by scripts/optimize-images.mjs:
  // serve the smallest copy that is at least as wide as asked for.
  const copies = resized[src];
  if (copies) {
    const best = copies.widths.find((w) => w >= width) ?? copies.widths[copies.widths.length - 1];
    const name = src.slice(src.lastIndexOf('/') + 1, src.lastIndexOf('.'));
    return `/optimized/${name}-${best}.${copies.hash}.webp`;
  }

  // Everything else in /public is served as the file itself. The file server
  // ignores `w`; it is there because next/image expects each size to have its own URL.
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
}

/** `srcset` listing every resized copy of a /public photo (empty if it has none). */
export function resizedSrcSet(src: string): string {
  return (resized[src]?.widths ?? [])
    .map((width) => `${imageLoader({ src, width })} ${width}w`)
    .join(', ');
}
