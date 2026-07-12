/** @type {import('tailwindcss').Config} */
// NOTE: Tailwind v4 sources all tokens from @theme in index.css.
// This file is intentionally minimal — it only provides the content scanner.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  plugins: [],
}