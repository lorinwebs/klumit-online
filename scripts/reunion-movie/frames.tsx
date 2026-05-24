import { promises as fs } from 'fs';
import path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import type { MovieConfig, QuizConfig } from './config';
import { rtl } from './bidi';

const FONT_REG = path.join(__dirname, 'assets', 'Heebo-Regular.ttf');
const FONT_BOLD = path.join(__dirname, 'assets', 'Heebo-Bold.ttf');
const FONT_BLACK = path.join(__dirname, 'assets', 'Heebo-Black.ttf');

// Natural aspect ratio of the supplied logo file (538×464).
const LOGO_AR = 538 / 464;

let cachedFonts: { regular: Buffer; bold: Buffer; black: Buffer } | null = null;
let cachedLogo: { dataUrl: string } | null = null;

async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const [regular, bold, black] = await Promise.all([
    fs.readFile(FONT_REG),
    fs.readFile(FONT_BOLD),
    fs.readFile(FONT_BLACK),
  ]);
  cachedFonts = { regular, bold, black };
  return cachedFonts;
}

async function loadLogo(logoPath: string) {
  if (cachedLogo) return cachedLogo;
  const buf = await fs.readFile(logoPath);
  cachedLogo = { dataUrl: `data:image/png;base64,${buf.toString('base64')}` };
  return cachedLogo;
}

async function jsxToPng(
  node: React.ReactNode,
  width: number,
  height: number,
): Promise<Buffer> {
  const fonts = await loadFonts();
  const svg = await satori(node as any, {
    width,
    height,
    fonts: [
      { name: 'Heebo', data: fonts.regular, weight: 400, style: 'normal' },
      { name: 'Heebo', data: fonts.bold, weight: 700, style: 'normal' },
      { name: 'Heebo', data: fonts.black, weight: 900, style: 'normal' },
    ],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
  return Buffer.from(png);
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** SVG checkmark — used instead of the ✓ glyph (Heebo lacks it). */
function CheckIcon({ size, color }: { size: number; color: string }) {
  const sw = Math.max(2, Math.round(size * 0.16));
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'flex' }}>
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function CornerLogos({
  src,
  height,
  opacity,
}: {
  src: string;
  height: number;
  opacity: number;
}) {
  const width = Math.round(height * LOGO_AR);
  return (
    <>
      <img
        src={src}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 30, left: 30, opacity }}
      />
      <img
        src={src}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 30, right: 30, opacity }}
      />
    </>
  );
}

const INTRO_BG =
  'radial-gradient(circle at 50% 40%, #ffffff 0%, #faf5ff 60%, #f3e8ff 100%)';

const QUIZ_BG =
  'radial-gradient(circle at 50% 40%, #312e81 0%, #1e1b4b 60%, #0c0a1f 100%)';

// ─── Intro frames ──────────────────────────────────────────────────────────
// Both phases share an identical logo position/size so the crossfade animates
// only the text — the logo image itself never appears to switch.

const INTRO_LOGO_H = 620;
const INTRO_LOGO_TOP = 110;
const INTRO_TEXT_BOTTOM = 90;

function IntroFrame({
  config,
  logoSrc,
  revealedCount,
}: {
  config: MovieConfig;
  logoSrc: string;
  /** Number of LOGICAL chars revealed across title (then year). */
  revealedCount: number;
}) {
  const w = Math.round(INTRO_LOGO_H * LOGO_AR);
  const title = config.intro.title;
  const year = config.intro.year;
  const titleShown = title.slice(0, Math.min(revealedCount, title.length));
  const yearShown =
    revealedCount > title.length
      ? year.slice(0, Math.min(revealedCount - title.length, year.length))
      : '';
  return (
    <div
      style={{
        width: config.width,
        height: config.height,
        display: 'flex',
        background: INTRO_BG,
        fontFamily: 'Heebo',
        position: 'relative',
      }}
    >
      <img
        src={logoSrc}
        width={w}
        height={INTRO_LOGO_H}
        style={{
          position: 'absolute',
          top: INTRO_LOGO_TOP,
          left: (config.width - w) / 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: INTRO_TEXT_BOTTOM,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: '#4c1d95',
            letterSpacing: -2,
            display: 'flex',
            // Reserve full line height so logo doesn't shift even when empty.
            minHeight: 110,
          }}
        >
          {rtl(titleShown)}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 56,
            fontWeight: 700,
            color: '#7c3aed',
            letterSpacing: 4,
            display: 'flex',
            minHeight: 70,
          }}
        >
          {yearShown}
        </div>
      </div>
    </div>
  );
}

export function introTotalLetters(config: MovieConfig): number {
  return config.intro.title.length + config.intro.year.length;
}

// ─── Quiz ──────────────────────────────────────────────────────────────────
// Satori renders LTR only (no dir="rtl"). Per hebrew-rtl-best-practices: never
// use flex row-reverse; place nodes in physical order instead.

const LETTERS = ['א', 'ב', 'ג', 'ד'] as const;

type QuizState =
  | { kind: 'intro' }
  | { kind: 'countdown'; number: number }
  | { kind: 'reveal'; frame: number; totalFrames: number };

const REVEAL_ANIM_FPS = 12;

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

const CONFETTI_COLORS = ['#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#c084fc', '#fb923c', '#f87171'];

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
        <div
          key={i}
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y,
            width: p.w,
            height: p.h,
            background: p.color,
            opacity: p.opacity,
            borderRadius: i % 3 === 0 ? p.w : 2,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </>
  );
}

/** Splash card shown before the question. */
function QuizIntroFrame({ config, logoSrc }: { config: MovieConfig; logoSrc: string }) {
  return (
    <div
      style={{
        width: config.width,
        height: config.height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: QUIZ_BG,
        fontFamily: 'Heebo',
        position: 'relative',
      }}
    >
      <CornerLogos src={logoSrc} height={110} opacity={0.5} />

      <div
        style={{
          fontSize: 200,
          fontWeight: 900,
          color: 'white',
          letterSpacing: -4,
          lineHeight: 1,
          textShadow: '0 8px 40px rgba(192,38,211,0.6)',
        }}
      >
        {rtl('חידון!')}
      </div>
      <div
        style={{
          marginTop: 30,
          fontSize: 92,
          fontWeight: 700,
          color: '#f0abfc',
        }}
      >
        {rtl('מוכנים?')}
      </div>
    </div>
  );
}

function QuizFrame({
  config,
  quiz,
  state,
  logoSrc,
}: {
  config: MovieConfig;
  quiz: QuizConfig;
  state: Exclude<QuizState, { kind: 'intro' }>;
  logoSrc: string;
}) {
  const revealed = state.kind === 'reveal';
  const revealProgress =
    state.kind === 'reveal'
      ? state.frame / Math.max(1, state.totalFrames - 1)
      : 0;
  const bannerScale = revealed ? 0.92 + 0.08 * easeOutBack(Math.min(1, revealProgress * 1.4)) : 1;

  return (
    <div
      style={{
        width: config.width,
        height: config.height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: QUIZ_BG,
        fontFamily: 'Heebo',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {revealed && (
        <Confetti frame={state.kind === 'reveal' ? state.frame : 0} totalFrames={state.kind === 'reveal' ? state.totalFrames : 1} />
      )}
      <CornerLogos src={logoSrc} height={100} opacity={0.5} />

      <div
        style={{
          fontSize: 26,
          color: '#c4b5fd',
          fontWeight: 700,
          letterSpacing: 10,
          marginBottom: 14,
        }}
      >
        {rtl('חידון')}
      </div>

      <div
        style={{
          fontSize: 92,
          fontWeight: 900,
          color: 'white',
          marginBottom: 46,
          textAlign: 'center',
        }}
      >
        {rtl(quiz.question)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: 1100 }}>
        {[0, 1].map(row => (
          <div key={row} style={{ display: 'flex', flexDirection: 'row', gap: 18 }}>
            {[1, 0].map(col => {
              const i = row * 2 + col;
              return (
                <OptionCard
                  key={i}
                  letter={LETTERS[i]}
                  text={quiz.options[i]}
                  isCorrect={i === quiz.correctIndex}
                  revealed={revealed}
                  revealProgress={revealProgress}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom: countdown number OR reveal callout — never overlaps options. */}
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {state.kind === 'countdown' ? (
          <div
            style={{
              width: 150,
              height: 150,
              borderRadius: 75,
              background:
                'radial-gradient(circle at 30% 30%, #f0abfc 0%, #c026d3 60%, #86198f 100%)',
              boxShadow: '0 18px 50px rgba(192,38,211,0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 110,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {state.number}
          </div>
        ) : (
          <div
            style={{
              padding: '20px 48px',
              borderRadius: 60,
              background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
              boxShadow: '0 18px 50px rgba(16,185,129,0.45)',
              color: 'white',
              fontSize: 54,
              fontWeight: 900,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 18,
              transform: `scale(${bannerScale})`,
            }}
          >
            <div style={{ display: 'flex' }}>{rtl('תשובה נכונה')}</div>
            <CheckIcon size={56} color="#ffffff" />
          </div>
        )}
      </div>
    </div>
  );
}

function OptionCard({
  letter,
  text,
  isCorrect,
  revealed,
  revealProgress,
}: {
  letter: string;
  text: string;
  isCorrect: boolean;
  revealed: boolean;
  revealProgress: number;
}) {
  const highlight = revealed && isCorrect;
  const dim = revealed && !isCorrect;
  const scale = highlight ? 1 + 0.14 * easeOutBack(Math.min(1, revealProgress * 1.2)) : 1;
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: highlight ? '28px 36px' : '24px 32px',
        gap: 22,
        borderRadius: 24,
        border: highlight
          ? '4px solid #34d399'
          : dim
            ? '2px solid rgba(255,255,255,0.08)'
            : '2px solid rgba(255,255,255,0.2)',
        background: highlight
          ? 'rgba(52,211,153,0.22)'
          : dim
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(255,255,255,0.08)',
        color: dim ? 'rgba(255,255,255,0.45)' : 'white',
        // Keep blur radius modest — resvg's gaussian-blur filter region
        // explodes (and panics) when blur+transform produces a region larger
        // than ~30x the element. 30px is plenty for the glow effect.
        boxShadow: highlight
          ? `0 0 30px rgba(52,211,153,${0.5 + revealProgress * 0.3})`
          : 'none',
        transform: `scale(${scale})`,
      }}
    >
      {highlight && <CheckIcon size={48} color="#6ee7b7" />}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 22,
        }}
      >
        <div style={{ fontSize: 46, fontWeight: 700, display: 'flex' }}>{rtl(text)}</div>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            background: highlight ? '#34d399' : 'rgba(255,255,255,0.15)',
            color: highlight ? '#064e3b' : 'white',
            fontSize: 30,
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {letter}
        </div>
      </div>
    </div>
  );
}

export function revealFrameCount(quiz: QuizConfig): number {
  return Math.max(8, Math.round(quiz.revealSec * REVEAL_ANIM_FPS));
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function renderIntroLetterPng(
  config: MovieConfig,
  revealedCount: number,
): Promise<Buffer> {
  const logo = await loadLogo(config.logoPath);
  return jsxToPng(
    <IntroFrame config={config} logoSrc={logo.dataUrl} revealedCount={revealedCount} />,
    config.width,
    config.height,
  );
}

export async function renderQuizIntroPng(config: MovieConfig): Promise<Buffer> {
  const logo = await loadLogo(config.logoPath);
  return jsxToPng(<QuizIntroFrame config={config} logoSrc={logo.dataUrl} />, config.width, config.height);
}

export async function renderQuizPng(
  config: MovieConfig,
  quiz: QuizConfig,
  state: Exclude<QuizState, { kind: 'intro' }>,
): Promise<Buffer> {
  const logo = await loadLogo(config.logoPath);
  return jsxToPng(
    <QuizFrame config={config} quiz={quiz} state={state} logoSrc={logo.dataUrl} />,
    config.width,
    config.height,
  );
}

export async function writeQuizFrames(
  config: MovieConfig,
  quiz: QuizConfig,
  outDir: string,
  prefix: string,
): Promise<{ intro: string; countdown: string[]; reveal: string[] }> {
  await fs.mkdir(outDir, { recursive: true });
  const introPath = path.join(outDir, `${prefix}_intro.png`);
  await fs.writeFile(introPath, await renderQuizIntroPng(config));
  const countdown: string[] = [];
  for (let n = quiz.countdownSec; n >= 1; n--) {
    const p = path.join(outDir, `${prefix}_c${n}.png`);
    await fs.writeFile(p, await renderQuizPng(config, quiz, { kind: 'countdown', number: n }));
    countdown.push(p);
  }
  const totalFrames = revealFrameCount(quiz);
  const reveal: string[] = [];
  for (let f = 0; f < totalFrames; f++) {
    const p = path.join(outDir, `${prefix}_reveal_${f}.png`);
    await fs.writeFile(
      p,
      await renderQuizPng(config, quiz, { kind: 'reveal', frame: f, totalFrames }),
    );
    reveal.push(p);
  }
  return { intro: introPath, countdown, reveal };
}

export async function writeIntroFrames(
  config: MovieConfig,
  outDir: string,
): Promise<{ letters: string[] }> {
  await fs.mkdir(outDir, { recursive: true });
  const total = introTotalLetters(config);
  const letters: string[] = [];
  for (let i = 0; i <= total; i++) {
    const p = path.join(outDir, `intro_letter_${String(i).padStart(2, '0')}.png`);
    await fs.writeFile(p, await renderIntroLetterPng(config, i));
    letters.push(p);
  }
  return { letters };
}
