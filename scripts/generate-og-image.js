/*
 * Generates public/og-image.png (1200x630) — the KLUMIT logo on a light
 * background, used for WhatsApp/Facebook/Twitter link previews.
 * Run: node scripts/generate-og-image.js
 */
const sharp = require('sharp');
const path = require('path');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#F5F5F0"/>
  <text
    x="600"
    y="315"
    text-anchor="middle"
    dominant-baseline="central"
    fill="#111111"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="110"
    font-weight="400"
    letter-spacing="28"
  >KLUMIT</text>
  <text
    x="600"
    y="420"
    text-anchor="middle"
    dominant-baseline="central"
    fill="#555555"
    font-family="Georgia, 'Times New Roman', serif"
    font-size="34"
    letter-spacing="8"
  >LUXURY ITALIAN BAGS</text>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile(path.join(__dirname, '..', 'public', 'og-image.png'))
  .then(() => console.log('Created public/og-image.png'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
