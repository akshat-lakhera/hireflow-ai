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
        case: {
          bg: '#0B1020',
          bgAlt: '#0E1324',
          surface: '#121A2E',
          surfaceLight: '#162038',
          surfaceElevated: '#1A2644',
          border: 'rgba(255, 255, 255, 0.08)',
          borderSubtle: '#1D2844',
          borderLight: '#263456',
        },
        accent: {
          blue: '#4DA3FF',
          blueHover: '#3B8FE6',
          violet: '#8B7CFF', // focus states only
          green: '#55D38A',  // verified / strong fit
          amber: '#F4B860',  // warning / needs validation
          red: '#E26D6D',    // risk / missing
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
