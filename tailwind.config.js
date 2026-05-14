/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Sora"', "sans-serif"],
        body: ['"Manrope"', "sans-serif"],
      },
      colors: {
        surface: "var(--surface)",
        panel: "var(--panel)",
        accent: "var(--accent)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
      boxShadow: {
        soft: "0 30px 60px -34px rgba(0, 0, 0, 0.6)",
      },
    },
  },
  plugins: [],
};
