/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF7F0",
        ink: "#1C1F26",
        teal: "#0E6B62",
        amber: "#E8A33D",
        clay: "#C4432B",
        moss: "#3F7A4E",
        "paper-2": "#F1E9DA",
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        brut: "6px 6px 0 #1C1F26",
        "brut-sm": "4px 4px 0 #1C1F26",
        "brut-lg": "10px 10px 0 #1C1F26",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 180ms ease-out both",
        "slide-in": "slide-in 180ms ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
