import { ImageResponse } from "next/og";
import { kept } from "@/lib/kept";
import { ogFonts, OG } from "@/lib/og";
import { STATUS_WORD } from "@/components/Status";
export const runtime = "nodejs";
export const alt = "Kept receipt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const tone: Record<string, string> = { ACTIVE: OG.amber, BLOCKED: OG.rose, FULFILLED: OG.accent, UPHELD: OG.accent, DISMISSED: OG.ink3 };

export default async function Image({ params }: { params: { id: string } }) {
  const r = await kept.getReceipt(params.id).catch(() => null);
  const fonts = await ogFonts();
  if (!r) return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: OG.canvas, color: OG.ink2, fontFamily: "Newsreader", fontStyle: "italic", fontSize: 48 }}>No such receipt.</div>, { ...size, fonts });
  const promise = r.promise.length > 150 ? r.promise.slice(0, 147) + "…" : r.promise;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", padding: 56, background: OG.canvas, fontFamily: "Inter", color: OG.ink }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 52, background: OG.surface, border: `1px solid ${OG.hair}`, borderLeft: `6px solid ${tone[r.status]}`, borderRadius: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><rect x="1" y="1" width="22" height="22" rx="6" stroke={OG.accent} strokeWidth="1.6" /><path d="M7 12.5l3.2 3.2L17 9" stroke={OG.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 22, color: OG.ink2 }}>{r.id}</span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10, fontSize: 20, color: tone[r.status], border: `1px solid ${tone[r.status]}55`, borderRadius: 999, padding: "6px 16px" }}>● {STATUS_WORD[r.status]}</span>
          </div>
          <div style={{ fontFamily: "Newsreader", fontStyle: "italic", fontSize: promise.length > 90 ? 42 : 52, lineHeight: 1.2, letterSpacing: -0.5 }}>{promise}</div>
          <div style={{ display: "flex", gap: 56, fontFamily: "JetBrains Mono" }}>
            {[["Value", r.amount ? `$${r.amount.toLocaleString("en-US")}` : "—"], ["Due", r.due], ["From", r.company_name], ["Ruled by", "GenLayer validators"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", gap: 6 }}><span style={{ fontSize: 14, color: OG.ink3, letterSpacing: 2 }}>{k.toUpperCase()}</span><span style={{ fontSize: 22 }}>{v}</span></div>
            ))}
          </div>
        </div>
      </div>
    ), { ...size, fonts });
}
