import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { mint: "#34d399", amber: "#fbbf24", rose: "#f87171", sky: "#60a5fa", ink: "#0b0c10", panel: "#14151b" },
      fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
