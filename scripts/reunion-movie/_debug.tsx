/* Dump SVGs for working/failing frames. */
import { promises as fs } from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import { DEMO_CONFIG, REPO_ROOT } from './config';
import { renderQuizSvg } from './frames';

async function main() {
  const config = DEMO_CONFIG;
  const quiz = config.quizzes[0];
  const dir = path.join(REPO_ROOT, '.reunion-movie-work');

  for (const frame of [23, 24]) {
    const svg = await renderQuizSvg(config, quiz, { kind: 'reveal', frame, totalFrames: 36 });
    const out = path.join(dir, `_dbg_reveal_${frame}.svg`);
    await fs.writeFile(out, svg);
    console.log(`wrote ${out}  (${svg.length}b)`);
    try {
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: config.width } }).render().asPng();
      console.log(`  resvg ok: ${png.length}b`);
    } catch (e) {
      console.log(`  resvg FAILED`, e);
    }
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
