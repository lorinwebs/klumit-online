/**
 * Render a reunion slideshow movie (MP4) using satori (for the polished
 * intro + quiz frames) and ffmpeg (for photo crossfades, Ken Burns, and
 * composition). No browser required.
 *
 * Usage:  npx tsx scripts/reunion-movie/render.ts
 */
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { DEMO_CONFIG, REPO_ROOT, type MovieConfig } from './config';
import { writeIntroFrames, writeQuizFrames } from './frames';

const WORK_DIR = path.join(REPO_ROOT, '.reunion-movie-work');

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('exit', code => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
    p.on('error', reject);
  });
}

/**
 * Build a photo clip with Ken Burns zoom + blurred-fill background + the
 * reunion logo overlaid in both top corners.
 *
 * The photo input is fed as a single PNG frame (no -loop, no -t). zoompan
 * itself produces totalFrames output frames at FPS, giving the desired
 * clip duration. Looped inputs for blurred bg and the two logo overlays
 * are explicitly framed so all streams in the overlay graph share length.
 */
async function buildPhotoClip(
  config: MovieConfig,
  imgPath: string,
  durationSec: number,
  outPath: string,
) {
  const W = config.width;
  const H = config.height;
  const FPS = config.fps;
  const totalFrames = Math.round(durationSec * FPS);
  const zoomExpr = `min(1+0.0008*on\\,1.15)`;
  const logoSize = 160;
  const pad = 36;

  const filter = [
    // Blurred background fill (looped image at FPS, scaled+cropped+blurred).
    `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=30:2,eq=brightness=-0.18,setsar=1,fps=${FPS}[bgb]`,
    // Foreground: Ken Burns via zoompan on a single PNG frame.
    `[1:v]scale=-2:${H * 2},zoompan=z='${zoomExpr}':d=${totalFrames}:fps=${FPS}:s=${W}x${H}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'[fgz]`,
    `[bgb][fgz]overlay=(W-w)/2:(H-h)/2:shortest=1[base]`,
    `[2:v]scale=${logoSize}:${logoSize},fps=${FPS}[lg]`,
    `[base][lg]overlay=${pad}:${pad}:shortest=1[withL]`,
    `[3:v]scale=${logoSize}:${logoSize},fps=${FPS}[rg]`,
    `[withL][rg]overlay=W-w-${pad}:${pad}:shortest=1,format=yuv420p`,
  ].join(';');

  await run('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    // input 0: image, looped for blurred bg (must have fixed duration)
    '-loop', '1', '-framerate', String(FPS), '-t', String(durationSec), '-i', imgPath,
    // input 1: image, single frame for zoompan to multiply
    '-i', imgPath,
    // inputs 2 & 3: logo, looped for corner overlays
    '-loop', '1', '-framerate', String(FPS), '-t', String(durationSec), '-i', config.logoPath,
    '-loop', '1', '-framerate', String(FPS), '-t', String(durationSec), '-i', config.logoPath,
    '-filter_complex', filter,
    '-frames:v', String(totalFrames),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '20',
    '-r', String(FPS),
    outPath,
  ]);
}

/** Build a fixed-duration clip from a full-bleed PNG (intro frames, quiz reveal). */
async function fullBleedToClip(
  config: MovieConfig,
  imgPath: string,
  durationSec: number,
  outPath: string,
) {
  await run('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    '-loop', '1',
    '-t', String(durationSec),
    '-i', imgPath,
    '-vf', `scale=${config.width}:${config.height},format=yuv420p,fps=${config.fps}`,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '20',
    '-r', String(config.fps),
    outPath,
  ]);
}

/**
 * Quiz clip: intro splash ("חידון! מוכנים?") + countdown frames + reveal.
 * Each sub-clip is rendered with exact duration, then concatenated losslessly.
 */
async function buildQuizClip(
  config: MovieConfig,
  introPng: string,
  introSec: number,
  countdownPngs: string[],
  revealPngs: string[],
  revealSec: number,
  prefix: string,
  outPath: string,
) {
  const subs: string[] = [];

  const introSub = path.join(WORK_DIR, `${prefix}_sub_intro.mp4`);
  await fullBleedToClip(config, introPng, introSec, introSub);
  subs.push(introSub);

  for (let i = 0; i < countdownPngs.length; i++) {
    const sub = path.join(WORK_DIR, `${prefix}_sub_c${i}.mp4`);
    await fullBleedToClip(config, countdownPngs[i], 1, sub);
    subs.push(sub);
  }

  const revealFrameDur = revealSec / revealPngs.length;
  for (let i = 0; i < revealPngs.length; i++) {
    const sub = path.join(WORK_DIR, `${prefix}_sub_reveal_${i}.mp4`);
    await fullBleedToClip(config, revealPngs[i], revealFrameDur, sub);
    subs.push(sub);
  }

  const concatFile = path.join(WORK_DIR, `${prefix}_concat.txt`);
  await fs.writeFile(
    concatFile,
    subs.map(s => `file '${s.replace(/'/g, "'\\''")}'`).join('\n'),
  );

  await run('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFile,
    '-c', 'copy',
    outPath,
  ]);
}

/**
 * Intro clip: logo holds alone, then text reveals one letter at a time
 * (letters[0] is logo-only, letters[N] is full text), then full text holds.
 * Returns the total duration in seconds.
 */
async function buildIntroClip(
  config: MovieConfig,
  letterPngs: string[],
  outPath: string,
): Promise<number> {
  if (letterPngs.length === 0) throw new Error('no intro letter frames');
  const subs: string[] = [];

  const logoSub = path.join(WORK_DIR, 'intro_sub_logo.mp4');
  await fullBleedToClip(config, letterPngs[0], config.intro.logoHoldSec, logoSub);
  subs.push(logoSub);

  const letterDur = 1 / config.intro.letterFps;
  for (let i = 1; i < letterPngs.length; i++) {
    const sub = path.join(WORK_DIR, `intro_sub_letter_${String(i).padStart(2, '0')}.mp4`);
    await fullBleedToClip(config, letterPngs[i], letterDur, sub);
    subs.push(sub);
  }

  const holdSub = path.join(WORK_DIR, 'intro_sub_hold.mp4');
  await fullBleedToClip(config, letterPngs[letterPngs.length - 1], config.intro.holdSec, holdSub);
  subs.push(holdSub);

  const concatFile = path.join(WORK_DIR, 'intro_concat.txt');
  await fs.writeFile(
    concatFile,
    subs.map(s => `file '${s.replace(/'/g, "'\\''")}'`).join('\n'),
  );

  await run('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatFile,
    '-c', 'copy',
    outPath,
  ]);

  const revealSec = (letterPngs.length - 1) * letterDur;
  return config.intro.logoHoldSec + revealSec + config.intro.holdSec;
}

interface Clip {
  path: string;
  durationSec: number;
}

async function composeWithXfade(
  config: MovieConfig,
  clips: Clip[],
  xfadeSec: number,
  outPath: string,
) {
  if (clips.length === 0) throw new Error('no clips');
  if (clips.length === 1) {
    await fs.copyFile(clips[0].path, outPath);
    return;
  }

  const inputs: string[] = [];
  for (const c of clips) inputs.push('-i', c.path);

  const filterParts: string[] = [];
  let prevLabel = `[0:v]`;
  let cumOffset = clips[0].durationSec - xfadeSec;
  for (let i = 1; i < clips.length; i++) {
    const isLast = i === clips.length - 1;
    const outLabel = isLast ? '[outv]' : `[v${i}]`;
    filterParts.push(
      `${prevLabel}[${i}:v]xfade=transition=fade:duration=${xfadeSec}:offset=${cumOffset.toFixed(3)}${outLabel}`,
    );
    prevLabel = outLabel;
    if (!isLast) cumOffset += clips[i].durationSec - xfadeSec;
  }

  await run('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    ...inputs,
    '-filter_complex', filterParts.join(';'),
    '-map', '[outv]',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '20',
    '-r', String(config.fps),
    '-movflags', '+faststart',
    outPath,
  ]);
}

/**
 * Concatenate clips with no transitions using ffmpeg's concat demuxer.
 * Used when the clip count makes xfade impractical. All input clips must
 * share the same codec/resolution/fps — they do, since we built them.
 */
async function composeWithConcat(clips: Clip[], outPath: string) {
  if (clips.length === 0) throw new Error('no clips');
  if (clips.length === 1) {
    await fs.copyFile(clips[0].path, outPath);
    return;
  }
  const listFile = path.join(WORK_DIR, 'final_concat.txt');
  await fs.writeFile(
    listFile,
    clips.map(c => `file '${c.path.replace(/'/g, "'\\''")}'`).join('\n'),
  );
  await run('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    '-f', 'concat',
    '-safe', '0',
    '-i', listFile,
    '-c', 'copy',
    '-movflags', '+faststart',
    outPath,
  ]);
}

const IMG_EXT_RE = /\.(jpe?g|png)$/i;
const PHOTO_PARALLELISM = 6;

async function resolvePhotos(config: MovieConfig): Promise<string[]> {
  if (config.photos) return config.photos;
  const all = await fs.readdir(config.photosFolder);
  return all.filter(n => IMG_EXT_RE.test(n) && !n.startsWith('.')).sort();
}

async function buildPhotoClipsParallel(
  config: MovieConfig,
  photos: string[],
): Promise<string[]> {
  const out: string[] = new Array(photos.length);
  let done = 0;
  let lastLogged = -1;
  const counter = { value: 0 };
  const worker = async () => {
    while (true) {
      const i = counter.value++;
      if (i >= photos.length) return;
      const src = path.join(config.photosFolder, photos[i]);
      const dst = path.join(WORK_DIR, `clip_photo_${String(i).padStart(5, '0')}.mp4`);
      try {
        // Skip rebuild if cached file exists and is non-empty.
        const st = await fs.stat(dst).catch(() => null);
        if (!st || st.size < 1024) {
          await buildPhotoClip(config, src, config.photoDurationSec, dst);
        }
      } catch (e) {
        console.error(`\nphoto ${i + 1} (${photos[i]}) failed:`, e);
        throw e;
      }
      out[i] = dst;
      done++;
      // Throttle log lines.
      if (done - lastLogged >= 20 || done === photos.length) {
        process.stdout.write(`  photo ${done}/${photos.length}\n`);
        lastLogged = done;
      }
    }
  };
  await Promise.all(Array.from({ length: PHOTO_PARALLELISM }, worker));
  return out;
}

async function main() {
  const config = DEMO_CONFIG;
  console.log('• Working dir:', WORK_DIR);
  await fs.mkdir(WORK_DIR, { recursive: true });

  const photos = await resolvePhotos(config);
  console.log(`• ${photos.length} photos found in ${config.photosFolder}`);

  console.log('• Rendering intro PNGs...');
  const intro = await writeIntroFrames(config, WORK_DIR);

  console.log('• Rendering quiz PNGs...');
  const quizFrames = new Map<number, { intro: string; countdown: string[]; reveal: string[] }>();
  for (const quiz of config.quizzes) {
    const f = await writeQuizFrames(config, quiz, WORK_DIR, `quiz_after${quiz.afterPhotoIndex}`);
    quizFrames.set(quiz.afterPhotoIndex, f);
  }

  console.log('• Building intro clip (letter-by-letter reveal)...');
  const introClip = path.join(WORK_DIR, 'clip_intro.mp4');
  const introDurationSec = await buildIntroClip(config, intro.letters, introClip);

  console.log(`• Building ${photos.length} photo clips (${PHOTO_PARALLELISM}-way parallel)...`);
  const photoClips = await buildPhotoClipsParallel(config, photos);

  console.log('• Building quiz clips...');
  const quizClips = new Map<number, { path: string; durationSec: number }>();
  for (const quiz of config.quizzes) {
    const frames = quizFrames.get(quiz.afterPhotoIndex)!;
    const prefix = `quiz_after${quiz.afterPhotoIndex}`;
    const out = path.join(WORK_DIR, `clip_${prefix}.mp4`);
    await buildQuizClip(
      config,
      frames.intro,
      quiz.introSec,
      frames.countdown,
      frames.reveal,
      quiz.revealSec,
      prefix,
      out,
    );
    quizClips.set(quiz.afterPhotoIndex, {
      path: out,
      durationSec: quiz.introSec + quiz.countdownSec + quiz.revealSec,
    });
  }

  console.log('• Composing final movie...');
  const clips: Clip[] = [
    { path: introClip, durationSec: introDurationSec },
  ];
  for (let i = 0; i < photoClips.length; i++) {
    clips.push({ path: photoClips[i], durationSec: config.photoDurationSec });
    const q = quizClips.get(i);
    if (q) clips.push(q);
  }

  // xfade is O(N) filter graph; for many clips it explodes. Use concat-demuxer
  // (zero re-encode) above a threshold. Quality difference is negligible since
  // Ken Burns motion masks the hard cuts.
  if (clips.length > 30) {
    console.log(`  ${clips.length} clips — using concat-demuxer (no xfade)`);
    await composeWithConcat(clips, config.outputPath);
  } else {
    await composeWithXfade(config, clips, config.crossfadeSec, config.outputPath);
  }
  console.log(`✓ Done: ${config.outputPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
