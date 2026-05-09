/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        bg: "#0f0f0f",
        surface: "#1a1a1a",
        border: "#2a2a2a",
        muted: "#555",
        accent: "#e2b714",     // monkeytype yellow
        correct: "#4ade80",    // green
        wrong: "#f87171",      // red
        cursor: "#e2b714",
      },
    },
  },
  plugins: [],
};
