/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        luxury: {
          gold: '#111111',
          dark: '#111111',
          light: '#f5f5f5',
        },
        // Warm Italian palette: white page, espresso ink, ivory accent sections, one cognac-leather accent.
        // Text-safe pairs (WCAG AA): espresso / stone / stone-dark / terracotta on cream and cream-deep;
        // cream and terracotta-light on espresso.
        espresso: {
          DEFAULT: '#2B211B', // ink + dark surfaces
          light: '#4A3A30',
        },
        stone: {
          DEFAULT: '#74685E', // muted text
          light: '#A89F96', // decorative only (fails AA as text)
          dark: '#5E534A',
        },
        cream: {
          // Page background. Pure white on purpose: product photos are shot on white,
          // so they blend into the page instead of sitting in visible boxes.
          DEFAULT: '#FFFFFF',
          warm: '#FFFDFA',
          deep: '#F2ECE3', // alternate section background
        },
        terracotta: {
          DEFAULT: '#9A5A32', // cognac accent
          light: '#D9A77C', // accent on dark surfaces
          dark: '#7A4322',
        },
        sand: {
          DEFAULT: '#E5DDD1', // hairlines
          light: '#EEE8DE',
          dark: '#D3C8B9',
        },
        sale: '#B3261E',
        // Homepage tokens mapped to same minimal system
        biasia: {
          bg: '#F5F5F5',
          'bg-alt': '#fafafa',
          ink: '#111111',
          muted: '#666666',
          accent: '#111111',
          line: 'rgba(17, 17, 17, 0.12)',
        },
      },
      fontFamily: {
        // Both families cover Hebrew and Latin, so mixed lines never fall back to a second font.
        sans: ['var(--font-assistant)', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['var(--font-frank)', 'var(--font-assistant)', 'Georgia', 'serif'],
        display: ['var(--font-frank)', 'var(--font-assistant)', 'Georgia', 'serif'],
      },
      screens: {
        'landscape': { 'raw': '(orientation: landscape) and (max-height: 500px)' },
      },
      letterSpacing: {
        'editorial': '0.2em',
        'luxury': '0.15em',
        'wide-plus': '0.08em',
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'reveal-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'reveal-fade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'line-expand': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'marquee-slide': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'hero-slow-zoom': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.06)' },
        },
      },
      animation: {
        'reveal-up': 'reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'reveal-fade': 'reveal-fade 1s ease-out forwards',
        'line-expand': 'line-expand 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'marquee-slide': 'marquee-slide 40s linear infinite',
        'hero-slow-zoom': 'hero-slow-zoom 18s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
}
