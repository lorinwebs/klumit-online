// Print-ready PDF for the 5 badges hand-prepared in the chat session
// (people not in / differing from the DB). Same page layout as
// generate-badges-pdf.ts: 100×135 mm page, 95×130 mm trim, 2.5 mm bleed.
//
// Usage:  npx tsx scripts/generate-5-badges-pdf.ts

import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { PDFDocument } from 'pdf-lib';
import { Badge, type BadgeData } from '../components/badge/Badge';

const BADGES: BadgeData[] = [
  { first_name: 'שרון', last_name: 'שאול', married_name: 'ישראל', gender: 'female', marital_status: 'married', grade: 'יב3', city: 'ראשון לציון', occupation: 'מנהלת לשכה', num_children: 3 },
  { first_name: 'צילי', last_name: 'שטיינר', married_name: 'כהן', gender: 'female', marital_status: 'married', grade: 'יב8', city: 'באר יעקב', occupation: 'מורה', num_children: 3 },
  { first_name: 'שני', last_name: 'שלמה', married_name: 'גרינברג', gender: 'female', marital_status: 'other', other_status: "פרק ב'", grade: 'יב1', city: 'רעננה', occupation: 'עורכת דין', num_children: 2 },
  { first_name: 'אורטל', last_name: 'יאמין', married_name: 'חיים', gender: 'female', marital_status: 'married', grade: 'יב1', city: 'יבנה', occupation: 'קוסמטיקאית', num_children: 3 },
];

// ── Layout ─────────────────────────────────────────────────────────────────
const MM_PER_PT = 25.4 / 72;
const mm = (v: number) => v / MM_PER_PT;

const TRIM_W_MM = 95;
const TRIM_H_MM = 130;
const BLEED_MM  = 2.5;
const PAGE_W_MM = TRIM_W_MM + BLEED_MM * 2;
const PAGE_H_MM = TRIM_H_MM + BLEED_MM * 2;

const PAGE_W_PT = mm(PAGE_W_MM);
const PAGE_H_PT = mm(PAGE_H_MM);
const TRIM_W_PT = mm(TRIM_W_MM);
const TRIM_H_PT = mm(TRIM_H_MM);
const BLEED_PT  = mm(BLEED_MM);

// ── Badge rendering ────────────────────────────────────────────────────────
const BADGE_W = 1122;
const BADGE_H = 1402;
const ROOT = path.resolve(__dirname, '..');

const template = (() => {
  const buf = fs.readFileSync(path.join(ROOT, 'public/badge-template-for-print.png'));
  return `data:image/png;base64,${buf.toString('base64')}`;
})();

const fonts = (() => {
  const dir = path.join(ROOT, 'lib/badge/fonts');
  return [
    { name: 'Heebo',            data: fs.readFileSync(path.join(dir, 'Heebo-Regular.ttf')),       weight: 400 as const, style: 'normal' as const },
    { name: 'Heebo',            data: fs.readFileSync(path.join(dir, 'Heebo-SemiBold.ttf')),      weight: 600 as const, style: 'normal' as const },
    { name: 'Frank Ruhl Libre', data: fs.readFileSync(path.join(dir, 'FrankRuhlLibre-Bold.ttf')), weight: 700 as const, style: 'normal' as const },
  ];
})();

async function generatePng(data: BadgeData): Promise<Buffer> {
  const element = React.createElement(Badge, {
    data,
    templateSrc: template,
    nameTopOverride: 640,
    detailFontSize: 76,
    satoriRtlFix: true,
    detailPositionsOverride: [
      { top: 810,  valueRight: 530 },
      { top: 920,  valueRight: 530 },
      { top: 1040, valueRight: 530 },
      { top: 1150, valueRight: 530 },
    ],
  });
  const svg = await satori(element, { width: BADGE_W, height: BADGE_H, fonts });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: BADGE_W } });
  return Buffer.from(resvg.render().asPng());
}

async function main() {
  const pdf = await PDFDocument.create();
  pdf.setTitle('Reunion badges – 5 manual – print ready');
  pdf.setCreator('klumit-online');

  for (const [i, data] of BADGES.entries()) {
    const png = await generatePng(data);
    const embedded = await pdf.embedPng(png);
    const page = pdf.addPage([PAGE_W_PT, PAGE_H_PT]);
    page.drawImage(embedded, { x: BLEED_PT, y: BLEED_PT, width: TRIM_W_PT, height: TRIM_H_PT });
    console.log(`  [${i + 1}/${BADGES.length}] ${data.first_name} ${data.last_name}`);
  }

  const outPath = path.join(ROOT, 'badges-print-5-manual.pdf');
  fs.writeFileSync(outPath, await pdf.save());
  console.log(`\n✔ Wrote ${outPath}`);
  console.log(`  Page size: ${PAGE_W_MM} × ${PAGE_H_MM} mm | Trim: ${TRIM_W_MM} × ${TRIM_H_MM} mm (bleed ${BLEED_MM} mm)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
