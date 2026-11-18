import { SHOPIFY_CATALOG_REVALIDATE_SECONDS } from '@/lib/shopify';

/** Where the product sits inside its studio photo. x / y / width / height are fractions of the photo (0–1). */
export interface ProductBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Photo width ÷ height */
  aspect: number;
}

/** How far a pixel may be from pure white and still count as background (ignores off-white studio falloff). */
const BACKGROUND_TOLERANCE = 30;

/**
 * Finds the product inside a photo shot on white, so photos with different framing
 * can be shown at the same size and on the same line. Server-only (uses sharp).
 * Returns null when the photo can't be measured; callers then show it as-is.
 */
export async function measureProductBounds(url: string): Promise<ProductBounds | null> {
  try {
    const sharp = (await import('sharp')).default;
    // A thumbnail is plenty for locating the product and keeps this fast
    const thumbUrl = `${url}${url.includes('?') ? '&' : '?'}width=240`;
    const response = await fetch(thumbUrl, {
      next: { revalidate: SHOPIFY_CATALOG_REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;

    const input = Buffer.from(await response.arrayBuffer());
    const { width: photoWidth, height: photoHeight } = await sharp(input).metadata();
    if (!photoWidth || !photoHeight) return null;

    const { info } = await sharp(input)
      .flatten({ background: '#ffffff' })
      .trim({ background: '#ffffff', threshold: BACKGROUND_TOLERANCE })
      .toBuffer({ resolveWithObject: true });

    return {
      // sharp reports trim offsets as zero or negative
      x: Math.abs(info.trimOffsetLeft ?? 0) / photoWidth,
      y: Math.abs(info.trimOffsetTop ?? 0) / photoHeight,
      width: info.width / photoWidth,
      height: info.height / photoHeight,
      aspect: photoWidth / photoHeight,
    };
  } catch (error) {
    console.error('Error measuring product photo:', error);
    return null;
  }
}
