/**
 * Makes resized WebP copies of the large photos in /public, so each screen downloads
 * a file close to the size it actually shows instead of the full original.
 *
 * Run `npm run images` after adding or replacing one of the photos listed below, and
 * commit the results: the copies in public/optimized and lib/responsive-images.json,
 * which tells lib/image-loader.ts which copies exist.
 *
 * File names carry a hash of the original, so a replaced photo gets new URLs and
 * browsers never show a stale cached copy.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUT_DIR = path.join(PUBLIC_DIR, 'optimized');
const MANIFEST = path.join(ROOT, 'lib', 'responsive-images.json');

/** Photo in /public -> widths to make. Widths above the original's are skipped. */
const PHOTOS = {
  // Desktop hero fills half the screen, so large retina screens need the big copies
  '/hero-bags-venice.jpg': [640, 750, 828, 1080, 1200, 1600, 2160],
  '/hero-bags-venice-mobile.jpg': [640, 750, 828, 1080, 1200, 1440],
  '/home-editorial.png': [384, 640, 750, 828, 1024],
};

const QUALITY = 76;

const manifest = {};
const wanted = new Set();
await mkdir(OUT_DIR, { recursive: true });

for (const [src, widths] of Object.entries(PHOTOS)) {
  const original = await readFile(path.join(PUBLIC_DIR, src));
  const hash = createHash('sha256').update(original).digest('hex').slice(0, 8);
  const { width: originalWidth = 0 } = await sharp(original).metadata();
  const name = path.basename(src, path.extname(src));
  const made = [];

  for (const width of widths) {
    if (width > originalWidth) continue;
    const file = `${name}-${width}.${hash}.webp`;
    const { size } = await sharp(original)
      .resize({ width })
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(path.join(OUT_DIR, file));
    wanted.add(file);
    made.push(width);
    console.log(`${file}  ${(size / 1024).toFixed(0)} KB`);
  }
  manifest[src] = { hash, widths: made };
}

// Copies of photos that were replaced or removed
for (const file of await readdir(OUT_DIR)) {
  if (!wanted.has(file)) await rm(path.join(OUT_DIR, file));
}

await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
