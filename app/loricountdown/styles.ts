export const loriCountdownCss = `
.lc-scope {
  direction: ltr;
  text-align: left;
  --brand: #f5519b;
  --brand-soft: #fde4f0;
  --ink: #16121a;
  --muted: #6b6472;
  --bg: #ffffff;
  --card: #faf7fb;
  --border: #ece6ef;
  --radius: 18px;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif;
  color: var(--ink);
  background: var(--bg);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
}
@media (prefers-color-scheme: dark) {
  .lc-scope {
    --ink: #f5f1f7;
    --muted: #a59cad;
    --bg: #0e0b11;
    --card: #181219;
    --border: #2a222e;
    --brand-soft: #2a1320;
  }
}
.lc-scope * { box-sizing: border-box; margin: 0; padding: 0; }
.lc-scope .wrap { max-width: 980px; margin: 0 auto; padding: 0 24px; }
.lc-scope header { padding: 28px 0; }
.lc-scope .brand { display: flex; align-items: center; gap: 9px; font-weight: 600; font-size: 17px; }
.lc-scope .dot { width: 11px; height: 11px; border-radius: 50%; background: var(--brand); }

.lc-scope .hero { text-align: center; padding: 72px 0 56px; }
.lc-scope .hero h1 {
  font-size: clamp(34px, 6vw, 60px);
  line-height: 1.05; letter-spacing: -0.02em; font-weight: 700;
  margin-bottom: 20px;
}
.lc-scope .hero .grad { color: var(--brand); }
.lc-scope .hero p { font-size: clamp(17px, 2.4vw, 21px); color: var(--muted); max-width: 620px; margin: 0 auto 32px; }
.lc-scope .cta {
  display: inline-flex; align-items: center; gap: 10px;
  background: var(--brand); color: #fff; text-decoration: none;
  font-weight: 600; font-size: 16px; padding: 15px 30px; border-radius: 999px;
  transition: transform .15s ease, box-shadow .15s ease;
  box-shadow: 0 10px 28px -10px var(--brand);
}
.lc-scope .cta:hover { transform: translateY(-2px); box-shadow: 0 16px 34px -10px var(--brand); }

.lc-scope .shot { margin: 24px auto 0; max-width: 880px; }
.lc-scope .shot img {
  width: 100%; border-radius: var(--radius);
  border: 1px solid var(--border);
  box-shadow: 0 30px 80px -40px rgba(0,0,0,.45);
}

.lc-scope .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; padding: 64px 0; }
.lc-scope .card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 26px;
}
.lc-scope .card .ic {
  width: 42px; height: 42px; border-radius: 12px;
  background: var(--brand-soft); color: var(--brand);
  display: grid; place-items: center; font-size: 22px; margin-bottom: 14px;
}
.lc-scope .card h3 { font-size: 17px; margin-bottom: 6px; }
.lc-scope .card p { color: var(--muted); font-size: 15px; }

.lc-scope footer { border-top: 1px solid var(--border); padding: 36px 0 56px; color: var(--muted); font-size: 14px; }
.lc-scope .links { display: flex; gap: 22px; flex-wrap: wrap; margin-bottom: 14px; }
.lc-scope .links a { color: var(--ink); text-decoration: none; font-weight: 500; }
.lc-scope .links a:hover { color: var(--brand); }

/* Support page */
.lc-scope.support .wrap { max-width: 720px; }
.lc-scope.support header { border-bottom: 1px solid var(--border); }
.lc-scope.support .brand { text-decoration: none; color: var(--ink); }
.lc-scope.support h1 { font-size: clamp(28px, 5vw, 40px); letter-spacing: -0.02em; margin: 48px 0 8px; }
.lc-scope.support .lede { color: var(--muted); font-size: 18px; margin-bottom: 40px; }
.lc-scope.support section { margin-bottom: 40px; }
.lc-scope.support h2 { font-size: 22px; margin-bottom: 16px; letter-spacing: -0.01em; }
.lc-scope.support .faq {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 6px 22px;
}
.lc-scope.support details { padding: 16px 0; border-bottom: 1px solid var(--border); }
.lc-scope.support details:last-child { border-bottom: none; }
.lc-scope.support summary { font-weight: 600; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; }
.lc-scope.support summary::-webkit-details-marker { display: none; }
.lc-scope.support summary::after { content: "+"; color: var(--brand); font-size: 22px; font-weight: 400; }
.lc-scope.support details[open] summary::after { content: "–"; }
.lc-scope.support details p { color: var(--muted); margin-top: 10px; }
.lc-scope.support .contact-card {
  background: var(--card); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 24px;
}
.lc-scope.support .contact-card a { color: var(--brand); text-decoration: none; font-weight: 600; }
.lc-scope.support p { margin-bottom: 12px; }
.lc-scope.support ul { margin: 0 0 12px 20px; color: var(--muted); }
.lc-scope.support a.back { color: var(--brand); text-decoration: none; font-weight: 500; }
.lc-scope.support footer { padding: 32px 0 56px; margin-top: 24px; }
`;
