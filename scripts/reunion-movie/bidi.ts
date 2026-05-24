/**
 * Hebrew-aware visual reordering for satori.
 *
 * Satori renders glyphs in logical order without applying the Unicode BiDi
 * algorithm, so Hebrew comes out reversed. This helper converts a logical-
 * order string into a visual-order string suitable for LTR rendering.
 */
const HEBREW =
  /[\u0590-\u05FF\u0600-\u06FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/** Reorder a logical Hebrew string into visual order for LTR rendering. */
export function rtl(input: string): string {
  if (!input) return input;
  // Split into digit runs, Hebrew runs, Latin runs, and individual other
  // chars (spaces, punctuation). Keeping punctuation separate ensures marks
  // like ? ! land on the correct visual side after reordering.
  const parts =
    input.match(
      /\d+|[\u0590-\u05FF\u0600-\u06FF\uFB1D-\uFDFF\uFE70-\uFEFF]+|[A-Za-z]+|./gs,
    ) ?? [];
  return parts
    .reverse()
    .map(p => {
      if (/^\d+$/.test(p)) return p;
      if (HEBREW.test(p)) return [...p].reverse().join('');
      return p;
    })
    .join('')
    .replace(/\)/g, '\u27E8')
    .replace(/\(/g, ')')
    .replace(/\u27E8/g, '(');
}
