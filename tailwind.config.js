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
        obsidian: {
          950: '#080a0f',
          900: '#0d1117',
          850: '#121720',
          800: '#171e2b',
          700: '#20293a',
          600: '#2c374d',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-light': 'rgba(255, 255, 255, 0.16)',
        },
        // Anti-Slop Warm Champagne & Titanium Gold Palette (No generic purple)
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#e5a93c',
          DEFAULT: '#e5a93c',
          600: '#d97706',
          700: '#b45309',
        },
        steel: {
          50: '#f8fafc',
          100: '#f1f5f9',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
        },
        accent: {
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#e5a93c',
          cyan: '#38bdf8',
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
