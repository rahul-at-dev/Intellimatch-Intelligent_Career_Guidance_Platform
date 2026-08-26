import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f6ff",
          100: "#ecebff",
          200: "#d9d6ff",
          300: "#bab3ff",
          400: "#9788ff",
          500: "#7c5cff",
          600: "#6b3ff0",
          700: "#5a30cc",
          800: "#4a28a3",
          900: "#3d2380",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)",
        card: "0 2px 8px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
