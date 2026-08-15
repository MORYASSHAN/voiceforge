/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        voiceforge: {
          bg: '#070a13',
          surface: '#0f1219',
          accent: '#06b6d4',
        },
      },
    },
  },
  plugins: [],
};
