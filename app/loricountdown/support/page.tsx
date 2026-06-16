import type { Metadata } from 'next';
import { loriCountdownCss } from '../styles';

export const metadata: Metadata = {
  title: { absolute: 'LoriCountdown — Support' },
  description: 'Help, FAQ, and privacy policy for LoriCountdown, the Mac countdown widget app.',
  robots: { index: false, follow: false },
};

export default function LoriCountdownSupportPage() {
  return (
    <div className="lc-scope support" dir="ltr" lang="en">
      <style dangerouslySetInnerHTML={{ __html: loriCountdownCss }} />

      <header>
        <div className="wrap">
          <a className="brand" href="/loricountdown">
            <span className="dot" /> LoriCountdown
          </a>
        </div>
      </header>

      <main className="wrap">
        <h1>Support</h1>
        <p className="lede">Quick answers and how to get in touch.</p>

        <section>
          <div className="contact-card">
            <p style={{ margin: 0 }}>
              Need help, found a bug, or have a feature request? Email us — we usually reply within a
              day or two.
            </p>
            <p style={{ margin: '12px 0 0' }}>
              <a href="mailto:lorin@example.com">lorin@example.com</a>
            </p>
          </div>
        </section>

        <section>
          <h2>Frequently asked questions</h2>
          <div className="faq">
            <details open>
              <summary>Where is the app after I open it?</summary>
              <p>
                LoriCountdown is a menu bar app — it has no Dock icon. Look for the timer / hourglass
                icon in the menu bar at the top-right of your screen. Click it to open the panel.
              </p>
            </details>
            <details>
              <summary>How do I add a countdown?</summary>
              <p>
                Click the menu bar icon, then tap &quot;+&quot;. Give your event a name, pick a date
                and time, and choose a theme. A widget appears on your desktop instantly.
              </p>
            </details>
            <details>
              <summary>How do I move or remove a widget?</summary>
              <p>
                Drag a widget anywhere on your desktop to reposition it. Right-click a widget (or use
                the menu bar panel) to Edit, Hide, or Delete it.
              </p>
            </details>
            <details>
              <summary>Does it support Hebrew and other right-to-left languages?</summary>
              <p>
                Yes. LoriCountdown fully supports right-to-left (RTL) layouts. Event names in Hebrew,
                Arabic, and other RTL languages display and align correctly throughout the app.
              </p>
            </details>
            <details>
              <summary>Where is my data stored?</summary>
              <p>
                All countdowns are stored locally on your Mac using Apple&apos;s SwiftData. The app
                has no network access — nothing is uploaded, and there are no accounts.
              </p>
            </details>
            <details>
              <summary>Which macOS versions are supported?</summary>
              <p>LoriCountdown supports macOS 14 (Sonoma) and later.</p>
            </details>
          </div>
        </section>

        <section id="privacy">
          <h2>Privacy Policy</h2>
          <p>LoriCountdown does not collect, transmit, or share any personal data.</p>
          <ul>
            <li>All countdown events are stored locally on your Mac using Apple&apos;s SwiftData framework.</li>
            <li>The app does not use analytics, advertising, tracking, or network connectivity.</li>
            <li>There are no accounts and no sign-in. Your data never leaves your device.</li>
          </ul>
          <p>
            If you have any questions about this policy, contact{' '}
            <a
              href="mailto:lorin@example.com"
              style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 600 }}
            >
              lorin@example.com
            </a>
            .
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Last updated: May 2026</p>
        </section>

        <a className="back" href="/loricountdown">
          ← Back to home
        </a>
      </main>

      <footer>
        <div className="wrap">© 2026 Lorin Totah. All rights reserved.</div>
      </footer>
    </div>
  );
}
