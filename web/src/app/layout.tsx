import type { Metadata, Viewport } from "next";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", weight: ["400", "500"], display: "swap" });
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif", weight: ["400"], style: ["normal", "italic"], display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"], display: "swap" });

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0A0A0B" };

export const metadata: Metadata = {
  title: "Kept — every promise an AI agent makes, enforceable",
  description: "Receipts, bonds and neutral verdicts for the promises AI agents make to people. Built on GenLayer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <Nav />
        <main className="mx-auto max-w-page px-4 pb-28 pt-6 sm:px-8 sm:pt-8 md:pb-24">{children}</main>
        <footer className="mx-auto max-w-page px-4 pb-24 sm:px-8 md:pb-10">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-6 text-[12px] text-ink-3">
            <span>Kept · built on GenLayer · Agent Tank 2026</span>
            <a className="hover:text-ink-2" href="https://github.com/hackid02/kept" target="_blank" rel="noreferrer">github.com/hackid02/kept</a>
          </div>
        </footer>
      </body>
    </html>
  );
}
