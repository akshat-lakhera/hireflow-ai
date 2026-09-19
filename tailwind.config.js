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
        // High-End Executive Dossier / Mineral Obsidian Palette (No generic blue AI slop)
        ink: {
          950: '#06080C', // deepest onyx void
          900: '#0A0D13', // primary screen background
          850: '#0F131B', // elevated base
          800: '#141924', // card background
          750: '#1A212E', // card hover / elevated
          700: '#222B3C', // card active
          border: 'rgba(255, 255, 255, 0.07)',
          borderHover: 'rgba(255, 255, 255, 0.16)',
          borderSubtle: '#18202D',
        },
        // Warm Champagne Amber Gold Accent (Classified dossier aesthetic)
        gold: {
          500: '#E5A93C', // primary brand accent
          400: '#F3BA54', // hover / highlight
          600: '#C88D27', // active
          glow: 'rgba(229, 169, 60, 0.20)',
          subtle: 'rgba(229, 169, 60, 0.10)',
          border: 'rgba(229, 169, 60, 0.35)',
        },
        // Grounded Status Colors
        verified: {
          500: '#10B981', // emerald green (verified evidence)
          400: '#34D399',
          subtle: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.30)',
        },
        caution: {
          500: '#F59E0B', // warm amber (needs validation)
          subtle: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.30)',
        },
        flag: {
          500: '#F87171', // coral crimson (risk / missing)
          subtle: 'rgba(248, 113, 113, 0.12)',
          border: 'rgba(248, 113, 113, 0.30)',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
