/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Clash Grotesk"', '"Public Sans"', "system-ui", "sans-serif"],
        body: ['"Public Sans"', "system-ui", "sans-serif"],
        mono: ['"Public Sans"', "ui-monospace", "monospace"],
      },
      colors: {
        navy: "#0C101B",
        "navy-mid": "#111827",
        "navy-light": "#1a2438",
        blue: { DEFAULT: "#427AB5", deep: "#406AAF" },
        gold: { DEFAULT: "#F7DD7D", light: "#FFE8BE" },
      },
      boxShadow: {
        "glow-blue": "0 0 40px rgba(66,122,181,0.3)",
        "glow-gold":  "0 0 28px rgba(247,221,125,0.25)",
      },
    },
  },
  plugins: [],
};
