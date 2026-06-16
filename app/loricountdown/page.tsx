import type { Metadata } from 'next';
import { loriCountdownCss } from './styles';

export const metadata: Metadata = {
  title: { absolute: 'LoriCountdown — Beautiful countdown widgets for your Mac' },
  description:
    'LoriCountdown puts beautiful countdown widgets on your Mac desktop. Track flights, vacations, birthdays, and deadlines from a quiet menu bar. Full RTL & Hebrew support.',
  openGraph: {
    title: 'LoriCountdown',
    description: 'Beautiful countdown widgets that float on your Mac desktop.',
    type: 'website',
  },
  robots: { index: false, follow: false },
};

export default function LoriCountdownPage() {
  return (
    <div className="lc-scope" dir="ltr" lang="en">
      <style dangerouslySetInnerHTML={{ __html: loriCountdownCss }} />

      <header>
        <div className="wrap">
          <div className="brand">
            <span className="dot" /> LoriCountdown
          </div>
        </div>
      </header>

      <main className="wrap">
        <section className="hero">
          <h1>
            Count down to what <span className="grad">matters</span>.
          </h1>
          <p>
            Beautiful countdown widgets that float on your Mac desktop. Track flights, vacations,
            birthdays, and deadlines — all from a quiet menu bar.
          </p>
          <div className="shot">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/loricountdown/marketing-1-hero.png" alt="LoriCountdown widgets on a Mac desktop" />
          </div>
        </section>

        <section className="features">
          <div className="card">
            <div className="ic">🖥️</div>
            <h3>Desktop widgets</h3>
            <p>Elegant countdowns float on your desktop or stay on top of your windows. Drag them anywhere.</p>
          </div>
          <div className="card">
            <div className="ic">⏱️</div>
            <h3>Menu bar simple</h3>
            <p>Add, edit, hide, or delete countdowns from a clean menu bar panel. Always one click away.</p>
          </div>
          <div className="card">
            <div className="ic">🌍</div>
            <h3>RTL & Hebrew</h3>
            <p>Full right-to-left layout support. Hebrew, Arabic, and more display and align correctly.</p>
          </div>
          <div className="card">
            <div className="ic">🔒</div>
            <h3>Private by design</h3>
            <p>Everything is stored locally on your Mac. No analytics, no ads, no network, no sign-in.</p>
          </div>
          <div className="card">
            <div className="ic">🎨</div>
            <h3>Tasteful themes</h3>
            <p>Each countdown gets its own color and icon so you can tell your events apart at a glance.</p>
          </div>
          <div className="card">
            <div className="ic">🌓</div>
            <h3>Light & dark</h3>
            <p>Adapts automatically to your system appearance with native macOS materials.</p>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="links">
            <a href="/loricountdown/support">Support</a>
            <a href="/loricountdown/support#privacy">Privacy Policy</a>
            <a href="mailto:lorin@example.com">Contact</a>
          </div>
          <div>© 2026 Lorin Totah. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
