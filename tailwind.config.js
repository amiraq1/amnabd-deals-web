/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      minHeight: { offer: '46rem' },
      borderRadius: { card: '1rem', control: '0.75rem' },
      spacing: { section: '2rem', card: '1.25rem' },
      colors: {
        ink: { DEFAULT: '#f8fafc', secondary: '#cbd5e1', muted: '#94a3b8' },
        identity: {
          0: { ink: '#a7f3d0', surface: '#064e3b', line: '#047857' },
          1: { ink: '#bae6fd', surface: '#0c4a6e', line: '#0369a1' },
          2: { ink: '#ddd6fe', surface: '#4c1d95', line: '#6d28d9' },
          3: { ink: '#fde68a', surface: '#78350f', line: '#92400e' },
          4: { ink: '#fecdd3', surface: '#881337', line: '#9f1239' },
          5: { ink: '#cbd5e1', surface: '#1e293b', line: '#475569' },
        },
        line: { DEFAULT: '#334155', subtle: '#1e293b', control: '#64748b' },
        surface: {
          DEFAULT: '#020617',
          raised: '#0f172a',
          overlay: '#1e293b',
        },
        brand: {
          DEFAULT: '#10b981',
          soft: '#34d399',
          dim: '#059669',
        },
        gold: {
          DEFAULT: '#f59e0b',
          soft: '#fbbf24',
          dim: '#d97706',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
