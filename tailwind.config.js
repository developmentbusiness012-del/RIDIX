/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Fraunces", "Georgia", "serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
      colors: {
        ink: "#0F1B2B",
        gold: { DEFAULT: "#D4A017", bright: "#E9B830" },
        forest: { DEFAULT: "#1E5F4A", bright: "#2C8C6B" },
        cream: { DEFAULT: "#FFFCF6", deep: "#FBF2DF" },
      },
    },
  },
  plugins: [],
};
