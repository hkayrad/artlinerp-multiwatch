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
        ninja: {
          950: '#070a0f',
          900: '#0d131d',
          800: '#161f2e',
          700: '#222f44',
          600: '#334460',
        },
        konoha: {
          DEFAULT: '#10b981',
          dark: '#059669',
          light: '#34d399',
        },
        suna: {
          DEFAULT: '#eab308',
          dark: '#ca8a04',
          light: '#fde047',
        },
        kick: '#53fc18',
        twitch: '#a970ff',
      },
    },
  },
  plugins: [],
}
