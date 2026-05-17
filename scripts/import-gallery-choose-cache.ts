/**
 * One-time import of face_cache.json into reunion_photo_analysis.
 *
 * Usage:
 *   npx tsx scripts/import-gallery-choose-cache.ts /path/to/face_cache.json
 */
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';
import { importFaceCacheObject } from '../lib/gallery-choose/import-cache';

dotenv.config({ path: '.env.local' });

const file = process.argv[2];
if (!file) {
  console.error('Usage: npx tsx scripts/import-gallery-choose-cache.ts <face_cache.json>');
  process.exit(1);
}

const raw = JSON.parse(readFileSync(file, 'utf-8'));

async function main() {
  const imported = await importFaceCacheObject(raw, true);
  console.log(`Done. Imported ${imported} rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
