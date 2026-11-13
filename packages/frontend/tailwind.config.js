/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { carbon: "#0B0B0E", card: "#141417", avax: "#E84142" },
    },
  },
  plugins: [],
};
