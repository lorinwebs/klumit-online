import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { Badge, BadgeData } from '../components/badge/Badge';

const BADGE_W = 1122;
const BADGE_H = 1402;

async function main() {
  const data: BadgeData = {
    first_name: 'הודיה',
    last_name: 'כהן',
    married_name: 'בן-גל',
    gender: 'female',
    marital_status: 'married',
    grade: 'יב1',
    city: 'ראשון לציון',
    occupation: 'אנליזה שיווקית',
    num_children: 2,
  };

  const buf = fs.readFileSync(path.join(process.cwd(), 'public/badge-template-for-print.png'));
  const template = `data:image/png;base64,${buf.toString('base64')}`;

  const fontsDir = path.resolve('lib/badge/fonts');
  const [heebo, heeboBold, frank] = await Promise.all([
    fs.promises.readFile(path.join(fontsDir, 'Heebo-Regular.ttf')),
    fs.promises.readFile(path.join(fontsDir, 'Heebo-SemiBold.ttf')),
    fs.promises.readFile(path.join(fontsDir, 'FrankRuhlLibre-Bold.ttf')),
  ]);

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

  const svg = await satori(element, {
    width: BADGE_W,
    height: BADGE_H,
    fonts: [
      { name: 'Heebo',            data: heebo,     weight: 400, style: 'normal' as const },
      { name: 'Heebo',            data: heeboBold, weight: 600, style: 'normal' as const },
      { name: 'Frank Ruhl Libre', data: frank,     weight: 700, style: 'normal' as const },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: BADGE_W } });
  const png = Buffer.from(resvg.render().asPng());
  const out = path.join(process.cwd(), 'badge-hodaya.png');
  fs.writeFileSync(out, png);
  console.log('Wrote', out);
}

main().catch(e => { console.error(e); process.exit(1); });
