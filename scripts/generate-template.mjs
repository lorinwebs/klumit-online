import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const logoBuf = fs.readFileSync(path.join(root, 'public/mekif-chet-logo.png'));
const logoDataUrl = `data:image/png;base64,${logoBuf.toString('base64')}`;

async function fetchFont(family, weight) {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`;
  const css = await fetch(url, {
    headers: { 'User-Agent': 'Safari/537.36' }
  }).then(r => r.text());
  const match = css.match(/url\(([^)]+)\)/);
  if (!match) throw new Error(`Font URL not found: ${family} ${weight}`);
  return fetch(match[1]).then(r => r.arrayBuffer());
}

const PURPLE = '#2D1B69';
const W = 800;
const H = 1100;

function corner(vPos, hPos) {
  const isTop = vPos === 'top';
  const isLeft = hPos === 'left';
  return {
    type: 'div', props: { style: {
      position: 'absolute',
      [isTop ? 'top' : 'bottom']: -1,
      [isLeft ? 'left' : 'right']: -1,
      width: 50, height: 50, display: 'flex',
    }, children: [
      { type: 'div', props: { style: { position: 'absolute', [isTop?'top':'bottom']: 0, [isLeft?'left':'right']: 0, width: 50, height: 3, backgroundColor: PURPLE }}},
      { type: 'div', props: { style: { position: 'absolute', [isTop?'top':'bottom']: 0, [isLeft?'left':'right']: 0, width: 3, height: 50, backgroundColor: PURPLE }}},
      { type: 'div', props: { style: { position: 'absolute', [isTop?'top':'bottom']: -3, [isLeft?'left':'right']: -3, width: 8, height: 8, borderRadius: 8, backgroundColor: PURPLE }}},
    ]}
  };
}

const element = {
  type: 'div', props: { style: {
    width: '100%', height: '100%', backgroundColor: 'white',
    position: 'relative', display: 'flex', fontFamily: 'Heebo, sans-serif',
  }, children: [
    // Outer border
    { type: 'div', props: { style: { position: 'absolute', top: 14, right: 14, bottom: 14, left: 14, border: `4px solid ${PURPLE}`, borderRadius: 6 }}},
    // Inner border + corners
    { type: 'div', props: { style: { position: 'absolute', top: 28, right: 28, bottom: 28, left: 28, border: `2px solid ${PURPLE}`, borderRadius: 4, display: 'flex' },
      children: [corner('top','left'), corner('top','right'), corner('bottom','left'), corner('bottom','right')]
    }},
    // Watermarks
    { type: 'div', props: { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', opacity: 0.06, overflow: 'hidden' },
      children: [0,1,2,3,4].map(r => ({ type: 'div', props: { style: { display: 'flex', justifyContent: 'space-around' },
        children: [0,1,2].map(c => ({ type: 'img', props: { src: logoDataUrl, style: { width: 130, height: 130, objectFit: 'contain', transform: 'rotate(-20deg)' }}}))
      }}))
    }},
    // Content
    { type: 'div', props: { style: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      paddingTop: 44, paddingBottom: 44, paddingLeft: 50, paddingRight: 50, direction: 'rtl',
    }, children: [
      { type: 'div', props: { style: { fontSize: 16, fontWeight: 700, color: PURPLE, textAlign: 'center', letterSpacing: 2 }, children: 'מפגש מחזור 20 שנה - 2026' }},
      { type: 'img', props: { src: logoDataUrl, style: { width: 160, height: 160, objectFit: 'contain', marginTop: 10 }}},
      { type: 'div', props: { style: { marginTop: 8, fontSize: 16, fontWeight: 700, color: PURPLE, textAlign: 'center', letterSpacing: 1 }, children: 'מקיף ח׳ ראשון לציון' }},
      { type: 'div', props: { style: { marginTop: 20, fontSize: 28, fontWeight: 600, color: PURPLE, textAlign: 'center', lineHeight: 1.4 }, children: 'מפגש מחזור 20 שנה' }},
      // Divider
      { type: 'div', props: { style: { display: 'flex', alignItems: 'center', width: '65%', marginTop: 16, marginBottom: 16, gap: 12 }, children: [
        { type: 'div', props: { style: { flex: 1, height: 2, backgroundColor: PURPLE }}},
        { type: 'div', props: { style: { fontSize: 14, color: PURPLE }, children: '❖' }},
        { type: 'div', props: { style: { flex: 1, height: 2, backgroundColor: PURPLE }}},
      ]}},
      // Name area spacer
      { type: 'div', props: { style: { minHeight: 80 }}},
      // Details
      { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start', direction: 'rtl', width: '100%', marginTop: 16, paddingRight: 30 },
        children: ['כיתה:', 'עיר:', 'עיסוק:', 'סטטוס:'].map(l => ({ type: 'div', props: { style: { fontWeight: 800, color: PURPLE, fontSize: 36 }, children: l }}))
      }},
      // Bottom ornament
      { type: 'div', props: { style: { marginTop: 'auto', paddingTop: 14, display: 'flex', gap: 4, alignItems: 'center' }, children: [
        { type: 'div', props: { style: { fontSize: 10, color: PURPLE, opacity: 0.5 }, children: '✦' }},
        { type: 'div', props: { style: { fontSize: 14, color: PURPLE, opacity: 0.6 }, children: '❖' }},
        { type: 'div', props: { style: { fontSize: 10, color: PURPLE, opacity: 0.5 }, children: '✦' }},
      ]}},
    ]}},
  ]},
};

async function main() {
  console.log('Fetching fonts...');
  const [heebo, heeboBold] = await Promise.all([
    fetchFont('Heebo', 400),
    fetchFont('Heebo', 700),
  ]);

  console.log('Rendering SVG...');
  const svg = await satori(element, {
    width: W, height: H,
    fonts: [
      { name: 'Heebo', data: heebo, weight: 400, style: 'normal' },
      { name: 'Heebo', data: heeboBold, weight: 700, style: 'normal' },
    ],
  });

  console.log('Converting to PNG...');
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: W } });
  const png = resvg.render().asPng();

  const outPath = path.join(root, 'public/badge-template.png');
  fs.writeFileSync(outPath, png);
  console.log(`Done! Written to ${outPath} (${png.length} bytes)`);
}

main().catch(err => { console.error(err); process.exit(1); });
