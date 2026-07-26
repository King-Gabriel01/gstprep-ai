/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14231F',
        paper: '#F7F5F0',
        moss: {
          50: '#EEF3EC',
          100: '#D6E4D1',
          300: '#93B889',
          500: '#4F7A46',
          600: '#3D6135',
          700: '#2D4A28',
          900: '#152318',
        },
        clay: '#C1622D',
        gold: '#C99A3D',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
