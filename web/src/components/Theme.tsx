"use client";
import { useEffect, useState } from "react";

type Pref = "system" | "light" | "dark";
const KEY = "kept-theme";

/**
 * Inline, blocking, before first paint: applies the stored preference (or the OS one)
 * so there is never a flash of the wrong theme. Kept tiny on purpose.
 */
export const THEME_BOOT = `(function(){try{var p=localStorage.getItem("${KEY}");var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var t=p==="light"||p==="dark"?p:(d?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","dark")}})();`;

function apply(pref: Pref) {
  const sys = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const t = pref === "system" ? sys : pref;
  document.documentElement.setAttribute("data-theme", t);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#0A0A0B" : "#F6F6F3");
}

export function useTheme() {
  const [pref, setPref] = useState<Pref>("system");
  const [resolved, setResolved] = useState<"light" | "dark" | null>(null); // null until mounted → no wrong label on first paint
  useEffect(() => {
    const p = (localStorage.getItem(KEY) as Pref) || "system";
    setPref(p);
    setResolved(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSys = () => { if ((localStorage.getItem(KEY) || "system") === "system") { apply("system"); setResolved(mq.matches ? "dark" : "light"); } };
    mq.addEventListener("change", onSys);
    return () => mq.removeEventListener("change", onSys);
  }, []);
  const set = (p: Pref) => {
    if (p === "system") localStorage.removeItem(KEY); else localStorage.setItem(KEY, p);
    setPref(p); apply(p);
    setResolved(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
  };
  return { pref, resolved, set };
}

/** One button. Click toggles light/dark; the label announces what it will do. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolved, set } = useTheme();
  if (!resolved) return <span className={`btn btn-icon opacity-0 ${className}`} aria-hidden />;
  const next = resolved === "dark" ? "light" : "dark";
  return (
    <button type="button" onClick={() => set(next)} className={`btn btn-ghost btn-icon ${className}`} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`}>
      <span className="relative block h-4 w-4">
        {/* sun */}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={`absolute inset-0 transition-all duration-200 ease-out ${resolved === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"}`} aria-hidden>
          <circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
        </svg>
        {/* moon */}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`absolute inset-0 transition-all duration-200 ease-out ${resolved === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0"}`} aria-hidden>
          <path d="M13.5 9.5A6 6 0 0 1 6.5 2.5a6 6 0 1 0 7 7Z" />
        </svg>
      </span>
    </button>
  );
}
