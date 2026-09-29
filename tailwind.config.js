/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0A0A0A',
        // Акцент: DEFAULT — заливки и крупный текст; dark — мелкий текст на белом (контраст ≥ 4.5:1);
        // soft — подложки и кольца.
        accent: {
          DEFAULT: '#D97706',
          dark: '#B45309',
          soft: '#FEF3C7',
        },
      },
    },
  },
  plugins: [],
}
