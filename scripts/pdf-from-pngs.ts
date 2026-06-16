// Build a print-ready PDF from existing badge-*.png files in the repo root.
// Same page layout as generate-badges-pdf.ts: 100×135 mm page,
// 95×130 mm trim, 2.5 mm bleed. Excludes any file matching "ido".
//
// Usage:  npx tsx scripts/pdf-from-pngs.ts

import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

const ROOT = path.resolve(__dirname, '..');

const MM_PER_PT = 25.4 / 72;
const mm = (v: number) => v / MM_PER_PT;
const TRIM_W_MM = 95, TRIM_H_MM = 130, BLEED_MM = 2.5;
const PAGE_W_PT = mm(TRIM_W_MM + BLEED_MM * 2);
const PAGE_H_PT = mm(TRIM_H_MM + BLEED_MM * 2);
const TRIM_W_PT = mm(TRIM_W_MM);
const TRIM_H_PT = mm(TRIM_H_MM);
const BLEED_PT  = mm(BLEED_MM);

async function main() {
  const files = fs.readdirSync(ROOT)
    .filter(f => /^badge-.*\.png$/i.test(f))
    .filter(f => /hodaya/i.test(f))
    .sort();

  if (!files.length) { console.error('No badge PNGs found.'); process.exit(1); }

  const pdf = await PDFDocument.create();
  pdf.setTitle('Reunion badges – from PNGs – print ready');
  pdf.setCreator('klumit-online');

  for (const [i, f] of files.entries()) {
    const png = fs.readFileSync(path.join(ROOT, f));
    const embedded = await pdf.embedPng(png);
    const page = pdf.addPage([PAGE_W_PT, PAGE_H_PT]);
    page.drawImage(embedded, { x: BLEED_PT, y: BLEED_PT, width: TRIM_W_PT, height: TRIM_H_PT });
    console.log(`  [${i + 1}/${files.length}] ${f}`);
  }

  const outPath = path.join(ROOT, 'badges-print-from-pngs.pdf');
  fs.writeFileSync(outPath, await pdf.save());
  console.log(`\n✔ Wrote ${outPath}  (${files.length} pages)`);
}

main().catch(e => { console.error(e); process.exit(1); });
