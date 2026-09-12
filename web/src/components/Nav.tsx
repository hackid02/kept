"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import BackendBadge from "./BackendBadge";

const links = [
  { href: "/", label: "Demo" },
  { href: "/receipts", label: "Receipts" },
  { href: "/board", label: "Board" },
  { href: "/console", label: "Console" },
  { href: "/how", label: "How it works" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <>
    <header className="sticky top-0 z-40 border-b border-hairline bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-page items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center" aria-label="Kept home"><Logo /></Link>
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href}
                className={`h-8 rounded-md px-3 text-[13px] leading-8 transition-colors duration-150 ${active ? "bg-white/[.06] text-ink" : "text-ink-2 hover:text-ink"}`}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <BackendBadge />
      </div>
    </header>
      {/* Phones: primary nav is a bottom bar within thumb reach. Sibling of the header, not a child:
          backdrop-filter would otherwise become the containing block for position:fixed. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden" aria-label="Primary">
        <ul className="grid h-14 grid-cols-5">
          {links.map((l) => {
            const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link href={l.href} className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] transition-colors ${active ? "text-ink" : "text-ink-3 active:text-ink-2"}`} aria-current={active ? "page" : undefined}>
                  <span className={`h-1 w-1 rounded-full ${active ? "bg-accent" : "bg-transparent"}`} aria-hidden />
                  {l.label === "How it works" ? "How" : l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
