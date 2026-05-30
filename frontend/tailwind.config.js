/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-container-lowest": "#0e0e0e",
        "surface": "#131313",
        "on-surface": "#e5e2e1",
        "on-surface-variant": "#bbcbb2",
        "background": "#131313",
        "primary": "#3de530",
        "primary-container": "#00c805",
        "on-primary": "#003a00",
      },
      fontFamily: {
        "label-sm": ["Work Sans", "sans-serif"],
        "h2": ["Inter", "sans-serif"],
        "data-mono": ["Work Sans", "monospace"],
        "body-md": ["Inter", "sans-serif"],
        "h1": ["Inter", "sans-serif"]
      },
      spacing: {
        "sm": "8px",
        "md": "16px",
        "lg": "24px",
        "xl": "48px",
        "xs": "4px",
        "base": "4px",
      }
    },
  },
  plugins: [],
}