/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: { card: '0.75rem', control: '0.5rem' },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
      },
      spacing: { section: '2.5rem', card: '1.25rem' },
      colors: {
        ink: {
          DEFAULT: '#f5f5f4', // Warm white (Stone-100)
          secondary: '#a8a29e', // Stone-400
          muted: '#94a3b8', // AA compliant against raised surface (7.18:1)
        },
        identity: {
          0: { ink: '#a7f3d0', surface: '#064e3b', line: '#047857' },
          1: { ink: '#bae6fd', surface: '#0c4a6e', line: '#0369a1' },
          2: { ink: '#ddd6fe', surface: '#4c1d95', line: '#6d28d9' },
          3: { ink: '#fde68a', surface: '#78350f', line: '#92400e' },
          4: { ink: '#fecdd3', surface: '#881337', line: '#9f1239' },
          5: { ink: '#cbd5e1', surface: '#1e293b', line: '#475569' },
        },
        line: {
          DEFAULT: 'var(--border, rgba(148, 163, 184, 0.23))', // Unified crisp border
          card: 'var(--border, rgba(148, 163, 184, 0.23))', // Card border
          'card-hover': 'var(--border-hover, rgba(148, 163, 184, 0.35))',
          subtle: '#142025',
          hover: 'var(--border-hover, rgba(148, 163, 184, 0.35))', // Interactive hover border
          control: '#64748b', // AA non-text contrast >= 3:1 against bg & raised
        },
        surface: {
          DEFAULT: '#0b0b0a', // Editorial warm charcoal canvas
          card: 'var(--surface-1, #12242a)', // Elevated card surface (1.23:1 vs #0b0b0a)
          'card-inner': 'var(--surface-2, rgba(255, 255, 255, 0.04))', // Inner section/facts
          raised: '#12242a', // Elevated editorial surface (Variant C emerald tint)
          overlay: '#162e36', // Top overlays / menus / buttons / sub-panels
        },
        brand: {
          DEFAULT: '#10b981', // Emerald-500 reserved for verified badges & affirmative actions
          soft: '#34d399',
          dim: '#059669',
        },
        gold: {
          DEFAULT: '#d97706', // Reserved for alerts & deadlines
          soft: '#f59e0b',
          dim: '#b45309',
        },
      },
      fontFamily: {
        sans: [
          'IBM Plex Sans Arabic',
          'Readex Pro',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI Arabic',
          'Segoe UI',
          'Arial',
          'sans-serif',
        ],
        heading: [
          'IBM Plex Sans Arabic',
          'Readex Pro',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI Arabic',
          'Segoe UI',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
