/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
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
        sans: ['Inter', 'Tajawal', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
