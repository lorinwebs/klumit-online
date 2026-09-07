export type ProductMaterial = 'leather' | 'faux' | 'unknown';

const FAUX_PATTERNS =
  /דמוי\s*עור|faux\s*leather|vegan\s*leather|synthetic\s*leather|leatherette|pu\s*leather|eco[\s-]?leather|ecopelle|artificial\s*leather|man[\s-]?made\s*leather|imitat(?:ion)?\s*leather|דמוי/i;

const LEATHER_PATTERNS =
  /עור\s*אמיתי|genuine\s*leather|real\s*leather|full[\s-]?grain|top[\s-]?grain|nappa|italian\s*leather|עור\s*איטלקי|100%\s*leather|מעור\s|מעור$|cowhide|calfskin|lambskin|goatskin|\bleather\b/i;

/**
 * Infer product material from Shopify title/description/tags text.
 * Faux cues win over generic "leather"/"עור" so "דמוי עור" is never treated as real leather.
 */
export function detectProductMaterial(
  ...parts: Array<string | null | undefined>
): ProductMaterial {
  const text = parts.filter(Boolean).join('\n');
  if (!text.trim()) return 'unknown';

  if (FAUX_PATTERNS.test(text)) return 'faux';

  // Remove faux phrases before checking for bare Hebrew "עור"
  const withoutFaux = text.replace(FAUX_PATTERNS, ' ');
  if (LEATHER_PATTERNS.test(withoutFaux) || /עור/.test(withoutFaux)) {
    return 'leather';
  }

  return 'unknown';
}

export function materialSchemaValue(material: ProductMaterial): string | undefined {
  if (material === 'leather') return 'Genuine leather';
  if (material === 'faux') return 'Faux leather';
  return undefined;
}

export function materialTranslationKey(
  material: ProductMaterial
): 'products.materialLeather' | 'products.materialFaux' | null {
  if (material === 'leather') return 'products.materialLeather';
  if (material === 'faux') return 'products.materialFaux';
  return null;
}
