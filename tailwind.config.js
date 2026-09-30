/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vintage: {
          50: '#fdfbf7',
          100: '#f7f3ea',
          200: '#ede4d0',
          300: '#dfcfb0',
          400: '#ceb48c',
          500: '#be9c6e',
          600: '#ad8557',
          700: '#8e6b45',
          800: '#73573c',
          900: '#5e4834',
          950: '#34261b',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'serif'],
      }
    },
  },
  plugins: [],
}

