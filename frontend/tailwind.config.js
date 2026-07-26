/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces - near-black with a slight green cast, like a desk lamp at night
        ink: {
          DEFAULT: '#0B0F0D',
          raised: '#141B17',
          overlay: '#1C2420',
          border: '#2A342E',
        },
        paper: '#E8E6DE',
        muted: '#8C948C',
        moss: {
          50: '#EEF3EC',
          100: '#D6E4D1',
          300: '#93B889',
          400: '#6BA588',
          500: '#4A9B7F',
          600: '#3A7D66',
          700: '#2D4A28',
          900: '#152318',
        },
        clay: '#C1622D',
        gold: '#D9A441',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        colorWash: {
          '0%': { backgroundColor: 'transparent' },
          '100%': { backgroundColor: 'var(--wash-color)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.3s ease-out both',
        'pulse-glow': 'pulseGlow 1.8s ease-in-out infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
