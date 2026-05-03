import 'server-only';
import fs from 'fs';
import path from 'path';

let heeboBuf: Buffer | null = null;
let heeboBoldBuf: Buffer | null = null;
let frankBuf: Buffer | null = null;

export async function loadFonts() {
  if (!heeboBuf || !heeboBoldBuf || !frankBuf) {
    const fontsDir = path.join(process.cwd(), 'public/fonts');
    heeboBuf     = fs.readFileSync(path.join(fontsDir, 'Heebo-Regular.ttf'));
    heeboBoldBuf = fs.readFileSync(path.join(fontsDir, 'Heebo-SemiBold.ttf'));
    frankBuf     = fs.readFileSync(path.join(fontsDir, 'FrankRuhlLibre-Bold.ttf'));
  }
  return {
    heebo:     heeboBuf!,
    heeboBold: heeboBoldBuf!,
    frank:     frankBuf!,
  };
}
