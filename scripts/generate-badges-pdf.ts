// Generate a print-ready PDF of reunion badges directly from the data in
// Supabase, regenerating each PNG in memory. This avoids any Supabase Storage
// CDN caching of stale files.
//
// Page layout:
//   - Page size (with bleed):  100 × 135 mm  (10 × 13.5 cm)
//   - Trim size:                95 × 130 mm  (9.5 × 13 cm)
//   - Bleed:                    2.5 mm on each side
//
// Usage:
//   npx tsx scripts/generate-badges-pdf.ts            # all badges
//   npx tsx scripts/generate-badges-pdf.ts 5          # first 5

import 'dotenv/config';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';
import { Badge, type BadgeData } from '../components/badge/Badge';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

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

// ── Main ───────────────────────────────────────────────────────────────────
const arg = process.argv[2];
const limit = arg ? Math.max(1, parseInt(arg, 10) || 0) : null;

async function main() {
  console.log(`Fetching ${limit ?? 'all'} badges…`);

  let query = supabase
    .from('reunion_badges')
    .select('id, first_name, last_name, gender, marital_status, other_status, married_name, grade, city, occupation, num_children')
    .order('created_at', { ascending: true });

  if (limit) query = query.limit(limit);

  const { data: rows, error } = await query;
  if (error) { console.error('DB error:', error.message); process.exit(1); }
  if (!rows?.length) { console.error('No badges found.'); process.exit(1); }

  console.log(`Rendering ${rows.length} badges into PDF…`);

  const pdf = await PDFDocument.create();
  pdf.setTitle('Reunion badges – print ready');
  pdf.setCreator('klumit-online');

  for (const [i, row] of rows.entries()) {
    const data: BadgeData = {
      first_name:     row.first_name ?? '',
      last_name:      row.last_name ?? '',
      gender:         row.gender ?? 'male',
      marital_status: row.marital_status ?? 'single',
      other_status:   row.other_status ?? '',
      married_name:   row.married_name ?? '',
      grade:          row.grade ?? '',
      city:           row.city ?? '',
      occupation:     row.occupation ?? '',
      num_children:   row.num_children ?? 0,
    };

    const png = await generatePng(data);
    const embedded = await pdf.embedPng(png);
    const page = pdf.addPage([PAGE_W_PT, PAGE_H_PT]);

    page.drawImage(embedded, {
      x: BLEED_PT,
      y: BLEED_PT,
      width:  TRIM_W_PT,
      height: TRIM_H_PT,
    });

    console.log(`  [${i + 1}/${rows.length}] ${data.first_name} ${data.last_name}`);
  }

  const outPath = path.join(ROOT, `badges-print-${limit ?? 'all'}.pdf`);
  fs.writeFileSync(outPath, await pdf.save());
  console.log(`\n✔ Wrote ${outPath}`);
  console.log(`  Page size: ${PAGE_W_MM} × ${PAGE_H_MM} mm`);
  console.log(`  Trim:      ${TRIM_W_MM} × ${TRIM_H_MM} mm  (bleed ${BLEED_MM} mm)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
