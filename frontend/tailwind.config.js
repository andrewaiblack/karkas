/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          400: "#7c9bff",
          500: "#5b7fff",
          600: "#3d5fe0",
          700: "#2a46c0",
        },
        dark: {
          900: "#060b14",
          800: "#0d1425",
          700: "#131d35",
          600: "#1a2845",
          500: "#243358",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease forwards",
        "slide-up": "slideUp 0.5s ease forwards",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: "translateY(20px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(91,127,255,0.3)" },
          "50%":       { boxShadow: "0 0 40px rgba(91,127,255,0.6)" },
        },
      },
    },
  },
  plugins: [],
};
