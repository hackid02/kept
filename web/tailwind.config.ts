import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0a0a0b", surface: "#111113", "surface-2": "#17171a", "surface-3": "#1f1f23",
        ink: "#f2f2f0", "ink-2": "#a3a3a0", "ink-3": "#6b6b68",
        accent: "#7fd8be", amber: "#d9a441", rose: "#d96c6c", user: "#2f6bff",
      },
      borderColor: { hairline: "rgba(255,255,255,.08)", "hairline-strong": "rgba(255,255,255,.14)" },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], serif: ["var(--font-serif)", "Georgia", "serif"], mono: ["var(--font-mono)", "ui-monospace", "monospace"] },
      maxWidth: { page: "1120px" },
      transitionTimingFunction: { out: "cubic-bezier(.23,1,.32,1)", "in-out": "cubic-bezier(.77,0,.175,1)" },
    },
  },
  plugins: [],
};
export default config;
