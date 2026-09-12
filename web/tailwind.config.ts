import type { Config } from "tailwindcss";

/** Colours resolve to CSS variables so both themes share one utility set; `<alpha-value>` keeps /50 modifiers working. */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: v("canvas"), surface: v("surface"), "surface-2": v("surface-2"), "surface-3": v("surface-3"),
        ink: v("ink"), "ink-2": v("ink-2"), "ink-3": v("ink-3"),
        accent: v("accent"), "accent-ink": v("accent-ink"), amber: v("amber"), rose: v("rose"), user: v("user"), wash: v("wash"),
      },
      borderColor: { hairline: "var(--hairline)", "hairline-strong": "var(--hairline-strong)" },
      backgroundColor: { hairline: "var(--hairline)" },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], serif: ["var(--font-serif)", "Georgia", "serif"], mono: ["var(--font-mono)", "ui-monospace", "monospace"] },
      maxWidth: { page: "1120px" },
      transitionTimingFunction: { out: "cubic-bezier(.23,1,.32,1)", "in-out": "cubic-bezier(.77,0,.175,1)" },
    },
  },
  plugins: [],
};
export default config;
