import { ImageResponse } from "next/og";
import { ogFonts, OG } from "@/lib/og";
export const runtime = "nodejs";
export const alt = "Kept — Agents can talk. Kept lets them give their word.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: OG.canvas, color: OG.ink, fontFamily: "Inter" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><rect x="1" y="1" width="22" height="22" rx="6" stroke={OG.accent} strokeWidth="1.6" /><path d="M7 12.5l3.2 3.2L17 9" stroke={OG.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span style={{ fontFamily: "Newsreader", fontStyle: "italic", fontSize: 34 }}>Kept</span>
          <span style={{ marginLeft: "auto", fontFamily: "JetBrains Mono", fontSize: 18, color: OG.ink3, letterSpacing: 1 }}>LIVE ON GENLAYER</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontFamily: "Newsreader", fontStyle: "italic", fontSize: 78, lineHeight: 1.05, letterSpacing: -1.5, display: "flex", flexDirection: "column" }}>
            <span>Agents can talk.</span><span style={{ color: OG.ink2 }}>Kept lets them give their word.</span>
          </div>
          <div style={{ fontSize: 24, color: OG.ink2, maxWidth: 900, lineHeight: 1.4 }}>Every promise an AI agent makes to a person becomes a receipt backed by a bond — checked before it's sent, paid if it's broken.</div>
        </div>
        <div style={{ display: "flex", gap: 40, fontFamily: "JetBrains Mono", fontSize: 18, color: OG.ink3 }}>
          <span style={{ color: OG.amber }}>● Open</span><span style={{ color: OG.rose }}>● Blocked</span><span style={{ color: OG.accent }}>● Upheld</span><span style={{ marginLeft: "auto" }}>kept · agent tank 2026</span>
        </div>
      </div>
    ), { ...size, fonts: await ogFonts() });
}
