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
        cyber: {
          cyan: '#00f0ff',
          green: '#00ff66',
          pink: '#ff0055',
        },
      },
      fontFamily: {
        cyber: ['Orbitron', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace', 'Courier New'],
        bebas: ['"Bebas Neue"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
