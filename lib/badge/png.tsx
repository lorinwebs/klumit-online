import 'server-only';
import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';
import { Badge, BadgeData } from '../../components/badge/Badge';

let templateDataUrl: string | null = null; // uses badge-template-for-print.png
let fontCache: { heebo: Buffer; heeboBold: Buffer; frank: Buffer } | null = null;

function getTemplateDataUrl(): string {
  if (!templateDataUrl) {
    const buf = fs.readFileSync(path.join(process.cwd(), 'public/badge-template-for-print.png'));
    templateDataUrl = `data:image/png;base64,${buf.toString('base64')}`;
  }
  return templateDataUrl;
}

async function getFonts() {
  if (!fontCache) {
    const fontsDir = path.resolve('lib/badge/fonts');
    const [heebo, heeboBold, frank] = await Promise.all([
      fs.promises.readFile(path.join(fontsDir, 'Heebo-Regular.ttf')),
      fs.promises.readFile(path.join(fontsDir, 'Heebo-SemiBold.ttf')),
      fs.promises.readFile(path.join(fontsDir, 'FrankRuhlLibre-Bold.ttf')),
    ]);
    fontCache = { heebo, heeboBold, frank };
  }
  return fontCache;
}

const BADGE_W = 1122;
const BADGE_H = 1402;

export async function generateBadgePng(data: BadgeData): Promise<Buffer> {
  const template = getTemplateDataUrl();
  const fonts = await getFonts();

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
      { name: 'Heebo',           data: fonts.heebo,     weight: 400, style: 'normal' as const },
      { name: 'Heebo',           data: fonts.heeboBold, weight: 600, style: 'normal' as const },
      { name: 'Frank Ruhl Libre', data: fonts.frank,    weight: 700, style: 'normal' as const },
    ],
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: BADGE_W } });
  return Buffer.from(resvg.render().asPng());
}
