/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        noc: {
          bg: '#080d1a',
          card: '#0f172a',
          cardHover: '#1e293b',
          border: '#1e293b',
          borderBright: '#334155',
          accent: '#06b6d4',
          accentGlow: 'rgba(6, 182, 212, 0.15)',
        },
        algo: {
          reno: '#38bdf8',      // Sky blue
          newreno: '#a855f7',   // Purple
          cubic: '#06b6d4',     // Cyan
          bbr: '#10b981',       // Emerald green
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
