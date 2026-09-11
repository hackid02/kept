import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Kept — every promise an AI agent makes, enforceable",
  description: "Receipts, bonds and neutral verdicts for promises AI agents make to humans. Built on GenLayer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">{children}</main>
      </body>
    </html>
  );
}
