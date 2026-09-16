export type ProductDimensions = {
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  raw?: string;
};

const CM_NUM = String.raw`(\d+(?:[.,]\d+)?)`;

/**
 * Extract L×W×H (cm) from Shopify description HTML/plain text.
 * Supports Hebrew labels and common × / x separators.
 */
export function parseProductDimensions(
  ...parts: Array<string | null | undefined>
): ProductDimensions | null {
  const text = parts
    .filter(Boolean)
    .join('\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return null;

  const length =
    matchFirst(text, [
      new RegExp(`אורך\\s*:?\\s*${CM_NUM}\\s*(?:ס["״']?מ|cm)?`, 'i'),
      new RegExp(`length\\s*:?\\s*${CM_NUM}\\s*cm`, 'i'),
    ]) ?? undefined;
  const width =
    matchFirst(text, [
      new RegExp(`רוחב\\s*:?\\s*${CM_NUM}\\s*(?:ס["״']?מ|cm)?`, 'i'),
      new RegExp(`width\\s*:?\\s*${CM_NUM}\\s*cm`, 'i'),
    ]) ?? undefined;
  const height =
    matchFirst(text, [
      new RegExp(`גובה\\s*:?\\s*${CM_NUM}\\s*(?:ס["״']?מ|cm)?`, 'i'),
      new RegExp(`height\\s*:?\\s*${CM_NUM}\\s*cm`, 'i'),
    ]) ?? undefined;

  // Compact forms: 30×20×10 / 30 x 20 x 10 cm
  if (length == null && width == null && height == null) {
    const compact = text.match(
      new RegExp(
        `${CM_NUM}\\s*[x×*]\\s*${CM_NUM}\\s*[x×*]\\s*${CM_NUM}\\s*(?:ס["״']?מ|cm)?`,
        'i'
      )
    );
    if (compact) {
      return {
        lengthCm: toNum(compact[1]),
        widthCm: toNum(compact[2]),
        heightCm: toNum(compact[3]),
        raw: compact[0],
      };
    }
    const two = text.match(
      new RegExp(`${CM_NUM}\\s*[x×*]\\s*${CM_NUM}\\s*(?:ס["״']?מ|cm)?`, 'i')
    );
    if (two) {
      return {
        lengthCm: toNum(two[1]),
        widthCm: toNum(two[2]),
        raw: two[0],
      };
    }
    return null;
  }

  if (length == null && width == null && height == null) return null;
  return { lengthCm: length, widthCm: width, heightCm: height };
}

export function hasDimensionKeywords(text: string): boolean {
  return /מידות|dimensions|\bcm\b|ס["״']?מ|אורך|רוחב|גובה/i.test(text);
}

function matchFirst(text: string, patterns: RegExp[]): number | null {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return toNum(m[1]);
  }
  return null;
}

function toNum(s: string): number {
  return parseFloat(s.replace(',', '.'));
}
