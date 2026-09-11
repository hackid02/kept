"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import BackendBadge from "./BackendBadge";

const links = [
  { href: "/", label: "Demo" },
  { href: "/receipts", label: "Receipts" },
  { href: "/leaderboard", label: "Kept-rate" },
  { href: "/console", label: "Company console" },
  { href: "/how", label: "How it works" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center"><Logo /></Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`rounded-lg px-3 py-1.5 text-sm ${path === l.href ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <BackendBadge />
      </div>
    </header>
  );
}
