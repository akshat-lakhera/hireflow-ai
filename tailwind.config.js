/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Human-Centric B2B SaaS Palette (Ashby / Lever / Gem Benchmark)
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          500: '#6366F1',
          600: '#4F46E5', // Primary Action Accent
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        surface: {
          canvas: '#F8FAFC',  // Clean Soft Slate Background
          card: '#FFFFFF',    // Solid White Card Surface
          subtle: '#F1F5F9',  // Subtle Hover / Nested Surface
          border: '#E2E8F0',  // Crisp 1px Border
          borderHover: '#CBD5E1',
        },
        textPrimary: '#0F172A',   // High-Contrast Dark Slate
        textSecondary: '#475569', // Slate-600 Body
        textMuted: '#94A3B8',     // Slate-400 Captions
        
        // Accessible Semantic Badges (AAA contrast)
        status: {
          verifiedBg: '#DCFCE7',
          verifiedText: '#15803D',
          verifiedBorder: '#BBF7D0',

          validationBg: '#FEF3C7',
          validationText: '#B45309',
          validationBorder: '#FDE68A',

          riskBg: '#FFE4E6',
          riskText: '#9F1239',
          riskBorder: '#FECDD3',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
