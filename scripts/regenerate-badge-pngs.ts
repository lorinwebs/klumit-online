// Regenerate all badge PNGs from the current data in Supabase and re-upload
// them, overwriting the existing files at `badges/${id}.png`. Run this
// whenever the badge layout changes (e.g. nameTopOverride below).
//
// The badge rendering logic is duplicated from lib/badge/png.tsx because that
// file imports `server-only`, which can't run in a plain Node context.
// Keep the two in sync when the layout changes.
//
// Usage:
//   npx tsx scripts/regenerate-badge-pngs.ts            # regenerate all
//   npx tsx scripts/regenerate-badge-pngs.ts 5          # only first 5

import 'dotenv/config';
import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { createClient } from '@supabase/supabase-js';
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
    { name: 'Heebo',            data: fs.readFileSync(path.join(dir, 'Heebo-Regular.ttf')),     weight: 400 as const, style: 'normal' as const },
    { name: 'Heebo',            data: fs.readFileSync(path.join(dir, 'Heebo-SemiBold.ttf')),    weight: 600 as const, style: 'normal' as const },
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

  console.log(`Regenerating ${rows.length} PNGs…`);

  let ok = 0, failed = 0;
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

    try {
      const png = await generatePng(data);
      const storagePath = `badges/${row.id}.png`;

      const { error: upErr } = await supabase
        .storage
        .from('reunion-badges')
        .upload(storagePath, png, { contentType: 'image/png', upsert: true });

      if (upErr) {
        console.warn(`  [${i + 1}/${rows.length}] ${data.first_name} ${data.last_name} – upload failed: ${upErr.message}`);
        failed++;
      } else {
        await supabase.from('reunion_badges').update({ png_path: storagePath }).eq('id', row.id);
        console.log(`  [${i + 1}/${rows.length}] ${data.first_name} ${data.last_name} ✔`);
        ok++;
      }
    } catch (e) {
      console.warn(`  [${i + 1}/${rows.length}] ${data.first_name} ${data.last_name} – generate failed:`, e);
      failed++;
    }
  }

  console.log(`\nDone. ${ok} ok, ${failed} failed.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
