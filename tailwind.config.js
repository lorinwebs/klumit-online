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
      },
      fontFamily: {
        sans: ['var(--font-assistant)', 'Assistant', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      screens: {
        'landscape': { 'raw': '(orientation: landscape) and (max-height: 500px)' },
      },
    },
  },
  plugins: [],
}

