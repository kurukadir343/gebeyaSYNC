import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f2f4ee",
        ink: "#14231b",
        sage: "#dde7dc",
        brand: { DEFAULT: "#0b6b3a", dark: "#084d2a", light: "#dcefe3" },
        sun: { DEFAULT: "#f2b705", light: "#fdf0c4", dark: "#8a6a00" },
        brick: { DEFAULT: "#c8372d", light: "#f9e1de", dark: "#8f2119" },
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-ethiopic)", "sans-serif"],
        sans: ["var(--font-body)", "var(--font-ethiopic)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
