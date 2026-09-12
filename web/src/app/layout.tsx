import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import { THEME_BOOT } from "@/components/Theme";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500"], display: "swap" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", weight: ["400"], style: ["normal", "italic"], display: "swap", fallback: ["Georgia", "Times New Roman", "serif"], adjustFontFallback: false });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"], display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://kept.vercel.app";
const TITLE = "Kept — every promise an AI agent makes, enforceable";
const DESC = "Receipts, bonds and neutral verdicts for the promises AI agents make to people. Agents can talk. Kept lets them give their word. Built on GenLayer.";

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#0A0A0B" }, { media: "(prefers-color-scheme: light)", color: "#F6F6F3" }],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s · Kept" },
  description: DESC,
  applicationName: "Kept",
  keywords: ["AI agents", "accountability", "GenLayer", "intelligent contracts", "customer support", "receipts", "bonds"],
  openGraph: { type: "website", siteName: "Kept", title: TITLE, description: DESC, url: SITE, images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Kept — Agents can talk. Kept lets them give their word." }] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: ["/opengraph-image"] },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the theme before paint — no flash. See components/Theme.tsx */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-screen font-sans">
        <a href="#main" className="skip">Skip to content</a>
        <Nav />
        <main id="main" tabIndex={-1} className="mx-auto max-w-page px-4 pb-28 pt-6 outline-none sm:px-8 sm:pt-8 md:pb-24">{children}</main>
        <footer className="mx-auto max-w-page px-4 pb-24 sm:px-8 md:pb-10">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-hairline pt-6 text-[12px] text-ink-3">
            <span>Kept · built on GenLayer · Agent Tank 2026</span>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
              <a className="transition-colors hover:text-ink-2" href="/how">How it works</a>
              <a className="transition-colors hover:text-ink-2" href="/privacy">Privacy</a>
              <a className="transition-colors hover:text-ink-2" href="https://github.com/hackid02/kept" target="_blank" rel="noreferrer">GitHub</a>
              <a className="transition-colors hover:text-ink-2" href="https://genlayer-explorer.vercel.app" target="_blank" rel="noreferrer">Explorer</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
