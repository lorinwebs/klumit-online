/* Render reveal SVG for f=24 but with parts stripped to bisect. */
import { promises as fs } from 'fs';
import path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { DEMO_CONFIG, REPO_ROOT } from './config';
import { rtl } from './bidi';

const W = 1920;
const H = 1080;
const QUIZ_BG = 'radial-gradient(circle at 50% 40%, #312e81 0%, #1e1b4b 60%, #0c0a1f 100%)';
const LOGO_AR = 538 / 464;
const REVEAL_FRAME = 24;
const REVEAL_TOTAL = 36;

const CONFETTI_COLORS = ['#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#c084fc', '#fb923c', '#f87171'];

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

function CheckIcon({ size, color }: { size: number; color: string }) {
  const sw = Math.max(2, Math.round(size * 0.16));
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path d="M5 12.5l4.5 4.5L19 7" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function CornerLogos({ src, height, opacity }: { src: string; height: number; opacity: number }) {
  const width = Math.round(height * LOGO_AR);
  return (
    <>
      <img src={src} width={width} height={height} style={{ position: 'absolute', top: 30, left: 30, opacity }} />
      <img src={src} width={width} height={height} style={{ position: 'absolute', top: 30, right: 30, opacity }} />
    </>
  );
}

function Confetti({ frame, totalFrames }: { frame: number; totalFrames: number }) {
  const progress = frame / Math.max(1, totalFrames - 1);
  const particles = Array.from({ length: 48 }, (_, i) => {
    const seed = i * 7919 + 17;
    const x = (seed * 13) % 1920;
    const fall = progress * 520 + (seed % 180);
    const y = -40 + fall + Math.sin((frame + i) * 0.7) * 18;
    const w = 6 + (seed % 10);
    const h = 10 + (seed % 14);
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    const rot = (seed * 5 + frame * 22) % 360;
    const opacity = Math.min(1, 0.35 + progress * 0.65);
    return { x, y, w, h, color, rot, opacity };
  });
  return (
    <>
      {particles.map((p, i) => (
        <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, width: p.w, height: p.h, background: p.color, opacity: p.opacity, borderRadius: i % 3 === 0 ? p.w : 2, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </>
  );
}

function OptionCard({ letter, text, isCorrect, revealProgress }: { letter: string; text: string; isCorrect: boolean; revealProgress: number }) {
  const highlight = isCorrect;
  const dim = !isCorrect;
  const scale = highlight ? 1 + 0.14 * easeOutBack(Math.min(1, revealProgress * 1.2)) : 1;
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'row', alignItems: 'center',
      padding: highlight ? '28px 36px' : '24px 32px', gap: 22, borderRadius: 24,
      border: highlight ? '4px solid #34d399' : dim ? '2px solid rgba(255,255,255,0.08)' : '2px solid rgba(255,255,255,0.2)',
      background: highlight ? 'rgba(52,211,153,0.22)' : dim ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
      color: dim ? 'rgba(255,255,255,0.45)' : 'white',
      boxShadow: highlight ? `0 0 ${60 + revealProgress * 40}px rgba(52,211,153,${0.45 + revealProgress * 0.35})` : 'none',
      transform: `scale(${scale})`,
    }}>
      {highlight && <CheckIcon size={48} color="#6ee7b7" />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 22 }}>
        <div style={{ fontSize: 46, fontWeight: 700, display: 'flex' }}>{rtl(text)}</div>
        <div style={{ width: 60, height: 60, borderRadius: 30, background: highlight ? '#34d399' : 'rgba(255,255,255,0.15)', color: highlight ? '#064e3b' : 'white', fontSize: 30, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{letter}</div>
      </div>
    </div>
  );
}

async function loadFonts() {
  const [regular, bold, black] = await Promise.all([
    fs.readFile(path.join(__dirname, 'assets', 'Heebo-Regular.ttf')),
    fs.readFile(path.join(__dirname, 'assets', 'Heebo-Bold.ttf')),
    fs.readFile(path.join(__dirname, 'assets', 'Heebo-Black.ttf')),
  ]);
  return { regular, bold, black };
}

async function loadLogo() {
  const buf = await fs.readFile(DEMO_CONFIG.logoPath);
  return `data:image/png;base64,${buf.toString('base64')}`;
}

async function render(label: string, jsx: any) {
  const fonts = await loadFonts();
  const svg = await satori(jsx, {
    width: W, height: H,
    fonts: [
      { name: 'Heebo', data: new Uint8Array(fonts.regular), weight: 400, style: 'normal' },
      { name: 'Heebo', data: new Uint8Array(fonts.bold), weight: 700, style: 'normal' },
      { name: 'Heebo', data: new Uint8Array(fonts.black), weight: 900, style: 'normal' },
    ],
  });
  // Always dump SVG before resvg, because resvg panic aborts the process.
  const dump = path.join(REPO_ROOT, '.reunion-movie-work', `_dbg_${label}.svg`);
  await fs.writeFile(dump, svg);
  process.stdout.write(`${label}: svg ${svg.length}b dumped, resvg... `);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
  process.stdout.write(`ok ${png.length}b\n`);
}

const LETTERS = ['א', 'ב', 'ג', 'ד'];
const quiz = DEMO_CONFIG.quizzes[0];
const revealProgress = REVEAL_FRAME / Math.max(1, REVEAL_TOTAL - 1);
const bannerScale = 0.92 + 0.08 * easeOutBack(Math.min(1, revealProgress * 1.4));

async function main() {
  const logoSrc = await loadLogo();

  // Test A: full QuizFrame WITHOUT Confetti
  await render('no_confetti', (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: QUIZ_BG, fontFamily: 'Heebo', position: 'relative', overflow: 'hidden' }}>
      <CornerLogos src={logoSrc} height={100} opacity={0.5} />
      <div style={{ fontSize: 26, color: '#c4b5fd', fontWeight: 700, letterSpacing: 10, marginBottom: 14 }}>{rtl('חידון')}</div>
      <div style={{ fontSize: 92, fontWeight: 900, color: 'white', marginBottom: 46, textAlign: 'center' }}>{rtl(quiz.question)}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: 1100 }}>
        {[0,1].map(row => (
          <div key={row} style={{ display: 'flex', flexDirection: 'row', gap: 18 }}>
            {[1,0].map(col => {
              const i = row*2+col;
              return <OptionCard key={i} letter={LETTERS[i]} text={quiz.options[i]} isCorrect={i === quiz.correctIndex} revealProgress={revealProgress} />;
            })}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '20px 48px', borderRadius: 60, background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', boxShadow: '0 18px 50px rgba(16,185,129,0.45)', color: 'white', fontSize: 54, fontWeight: 900, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 18, transform: `scale(${bannerScale})` }}>
          <div style={{ display: 'flex' }}>{rtl('תשובה נכונה')}</div>
          <CheckIcon size={56} color="#ffffff" />
        </div>
      </div>
    </div>
  ));

  // Test B: just confetti
  await render('only_confetti', (
    <div style={{ width: W, height: H, display: 'flex', background: QUIZ_BG, position: 'relative' }}>
      <Confetti frame={REVEAL_FRAME} totalFrames={REVEAL_TOTAL} />
    </div>
  ));

  // Test C: full
  await render('full', (
    <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: QUIZ_BG, fontFamily: 'Heebo', position: 'relative', overflow: 'hidden' }}>
      <Confetti frame={REVEAL_FRAME} totalFrames={REVEAL_TOTAL} />
      <CornerLogos src={logoSrc} height={100} opacity={0.5} />
      <div style={{ fontSize: 26, color: '#c4b5fd', fontWeight: 700, letterSpacing: 10, marginBottom: 14 }}>{rtl('חידון')}</div>
      <div style={{ fontSize: 92, fontWeight: 900, color: 'white', marginBottom: 46, textAlign: 'center' }}>{rtl(quiz.question)}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: 1100 }}>
        {[0,1].map(row => (
          <div key={row} style={{ display: 'flex', flexDirection: 'row', gap: 18 }}>
            {[1,0].map(col => {
              const i = row*2+col;
              return <OptionCard key={i} letter={LETTERS[i]} text={quiz.options[i]} isCorrect={i === quiz.correctIndex} revealProgress={revealProgress} />;
            })}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ padding: '20px 48px', borderRadius: 60, background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', boxShadow: '0 18px 50px rgba(16,185,129,0.45)', color: 'white', fontSize: 54, fontWeight: 900, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 18, transform: `scale(${bannerScale})` }}>
          <div style={{ display: 'flex' }}>{rtl('תשובה נכונה')}</div>
          <CheckIcon size={56} color="#ffffff" />
        </div>
      </div>
    </div>
  ));
}

main().catch(e => { console.error(e); process.exit(1); });
