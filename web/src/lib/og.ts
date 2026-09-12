import { readFile } from "node:fs/promises";
import path from "node:path";
/** Fonts for satori (next/og). Bundled locally under web/assets/fonts — no network at render time. */
export async function ogFonts() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  const [serif, sans, sansMed, mono] = await Promise.all(["Newsreader-Italic.woff", "Inter-Regular.woff", "Inter-Medium.woff", "JetBrainsMono-Regular.woff"].map((f) => readFile(path.join(dir, f))));
  return [
    { name: "Newsreader", data: serif, style: "italic" as const, weight: 400 as const },
    { name: "Inter", data: sans, style: "normal" as const, weight: 400 as const },
    { name: "Inter", data: sansMed, style: "normal" as const, weight: 500 as const },
    { name: "JetBrains Mono", data: mono, style: "normal" as const, weight: 400 as const },
  ];
}
export const OG = { canvas: "#0a0a0b", surface: "#111113", hair: "rgba(255,255,255,.1)", ink: "#f2f2f0", ink2: "#a3a3a0", ink3: "#7d7d79", accent: "#7fd8be", amber: "#d9a441", rose: "#d96c6c" };
