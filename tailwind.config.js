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
        // Daniel Yona–style minimal palette (white / black)
        espresso: {
          DEFAULT: '#111111',
          light: '#2a2a2a',
        },
        stone: {
          DEFAULT: '#888888',
          light: '#b0b0b0',
          dark: '#666666',
        },
        cream: {
          DEFAULT: '#F5F5F5',
          warm: '#fafafa',
          deep: '#eeeeee',
        },
        terracotta: {
          DEFAULT: '#111111',
          light: '#333333',
          dark: '#000000',
        },
        sand: {
          DEFAULT: '#e5e5e5',
          light: '#f0f0f0',
          dark: '#d4d4d4',
        },
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
        sans: ['var(--font-assistant)', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
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
