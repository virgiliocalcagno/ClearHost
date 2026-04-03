/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // We still use @theme in index.css, this config just ensures scanning
    },
  },
  plugins: [],
}
