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
  );
}
