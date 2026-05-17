#!/usr/bin/env node
// Generate a print-ready PDF of reunion badges.
//
// Page layout:
//   - Page size (with bleed):  100 × 135 mm  (10 × 13.5 cm)
//   - Trim size:                95 × 130 mm  (9.5 × 13 cm)
//   - Bleed:                    2.5 mm on each side (neutral white background)
//
// The existing badge template (1122×1402 PNG) is placed inside the trim
// area, centered. The decorative purple border stays well inside the trim,
// so when the printer cuts along the trim line nothing important is lost.
//
// Usage:
//   node scripts/generate-badges-pdf.mjs [limit]
//   node scripts/generate-badges-pdf.mjs 5      # first 5 badges (default)
//   node scripts/generate-badges-pdf.mjs all    # every badge in the table

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// ── Layout (in millimetres) ────────────────────────────────────────────────
const MM_PER_PT = 25.4 / 72;                 // 1 pt = 0.352778 mm
const mm = (v) => v / MM_PER_PT;             // mm → pt

const TRIM_W_MM   = 95;
const TRIM_H_MM   = 130;
const BLEED_MM    = 2.5;
const PAGE_W_MM   = TRIM_W_MM + BLEED_MM * 2; // 100 mm
const PAGE_H_MM   = TRIM_H_MM + BLEED_MM * 2; // 135 mm

const PAGE_W_PT = mm(PAGE_W_MM);
const PAGE_H_PT = mm(PAGE_H_MM);
const TRIM_W_PT = mm(TRIM_W_MM);
const TRIM_H_PT = mm(TRIM_H_MM);
const BLEED_PT  = mm(BLEED_MM);

// ── Supabase ───────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Args ───────────────────────────────────────────────────────────────────
const arg = process.argv[2] ?? '5';
const limit = arg === 'all' ? null : Math.max(1, parseInt(arg, 10) || 5);

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching ${limit ?? 'all'} badges from Supabase…`);

  let query = supabase
    .from('reunion_badges')
    .select('id, first_name, last_name, png_path, created_at')
    .not('png_path', 'is', null)
    .order('created_at', { ascending: true });

  if (limit) query = query.limit(limit);

  const { data: rows, error } = await query;
  if (error) {
    console.error('DB error:', error.message);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.error('No badges with png_path found.');
    process.exit(1);
  }

  console.log(`Got ${rows.length} badges. Downloading PNGs…`);

  const pdf = await PDFDocument.create();
  pdf.setTitle('Reunion badges – print ready');
  pdf.setCreator('klumit-online');

  for (const [i, row] of rows.entries()) {
    const { data: blob, error: dlErr } = await supabase
      .storage
      .from('reunion-badges')
      .download(row.png_path);

    if (dlErr || !blob) {
      console.warn(`  [${i + 1}/${rows.length}] ${row.png_path} – download failed: ${dlErr?.message}`);
      continue;
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const png   = await pdf.embedPng(bytes);

    const page = pdf.addPage([PAGE_W_PT, PAGE_H_PT]);

    // White background fills the whole page (including bleed) by default —
    // pdf-lib pages are transparent, but PDF readers/printers treat unset
    // areas as paper white. We explicitly do nothing for the bleed area, so
    // the design's existing white background carries through naturally.

    // Place the badge artwork inside the trim, centered. The PNG's own
    // dimensions already represent 95×130 mm of artwork.
    page.drawImage(png, {
      x: BLEED_PT,
      y: BLEED_PT,
      width:  TRIM_W_PT,
      height: TRIM_H_PT,
    });

    console.log(`  [${i + 1}/${rows.length}] ${row.first_name} ${row.last_name}`);
  }

  const outPath = path.join(ROOT, `badges-print-${limit ?? 'all'}.pdf`);
  fs.writeFileSync(outPath, await pdf.save());
  console.log(`\n✔ Wrote ${outPath}`);
  console.log(`  Page size: ${PAGE_W_MM} × ${PAGE_H_MM} mm`);
  console.log(`  Trim:      ${TRIM_W_MM} × ${TRIM_H_MM} mm  (bleed ${BLEED_MM} mm)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
