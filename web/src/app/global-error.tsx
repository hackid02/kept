"use client";
// Last resort: replaces the root layout when it throws. Inline styles because globals.css may not have loaded.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en" data-theme="dark">
      <body style={{ margin: 0, background: "#0a0a0b", color: "#f2f2f0", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#7d7d79", margin: 0 }}>Error</p>
          <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: 32, margin: "12px 0 8px" }}>Kept couldn't render.</h1>
          <p style={{ color: "#a3a3a0", fontSize: 14, lineHeight: 1.55 }}>Your receipts are on GenLayer and unaffected.</p>
          <button onClick={reset} style={{ marginTop: 20, height: 38, padding: "0 16px", borderRadius: 8, border: 0, background: "#7fd8be", color: "#06231b", fontWeight: 500, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
