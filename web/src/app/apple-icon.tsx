import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0b" }}>
        <svg width="124" height="124" viewBox="0 0 24 24" fill="none">
          <rect x="1" y="1" width="22" height="22" rx="6" stroke="#7fd8be" strokeWidth="1.6" />
          <path d="M7 12.5l3.2 3.2L17 9" stroke="#7fd8be" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ), size);
}
