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
          gold: '#D4AF37',
          dark: '#1a1a1a',
          light: '#f5f5f5',
        },
        // Modern editorial palette
        espresso: {
          DEFAULT: '#2C2420',
          light: '#3D332E',
        },
        stone: {
          DEFAULT: '#A69585',
          light: '#C4B5A7',
          dark: '#8C7E73',
        },
        cream: {
          DEFAULT: '#F7F4F0',
          warm: '#F2ECE4',
          deep: '#EDE6DC',
        },
        terracotta: {
          DEFAULT: '#C4956A',
          light: '#D4AD88',
          dark: '#A67B52',
        },
        sand: {
          DEFAULT: '#E8E2DB',
          light: '#F0ECE7',
          dark: '#D5CCC2',
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
      },
      animation: {
        'reveal-up': 'reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'reveal-fade': 'reveal-fade 1s ease-out forwards',
        'line-expand': 'line-expand 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}
