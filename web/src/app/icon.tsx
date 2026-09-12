import { ImageResponse } from "next/og";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
// The Kept mark: a square with a check. Same geometry as components/Logo.tsx.
export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0b", borderRadius: 14 }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
          <rect x="1" y="1" width="22" height="22" rx="6" stroke="#7fd8be" strokeWidth="1.8" />
          <path d="M7 12.5l3.2 3.2L17 9" stroke="#7fd8be" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ), size);
}
