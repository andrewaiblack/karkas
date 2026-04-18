/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["\"Space Grotesk\"", "system-ui", "sans-serif"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: "#0b0f14",
        ember: "#ff6b3d",
        copper: "#ffb37c",
        haze: "#f4f4f5",
      },
      boxShadow: {
        glow: "0 0 35px rgba(255, 107, 61, 0.35)",
      },
    },
  },
  plugins: [],
};
