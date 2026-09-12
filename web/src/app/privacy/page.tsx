import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy", description: "What Kept stores, where, and what is public." };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="serif text-[34px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px]">Privacy</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">This is a hackathon demo. It is deliberately simple about data, and everything below is checkable in the <a className="text-ink underline decoration-hairline-strong underline-offset-4 hover:decoration-ink" href="https://github.com/hackid02/kept" target="_blank" rel="noreferrer">source</a>.</p>
      </header>
      {[
        ["What is public", "Every receipt is written to the Kept contract on GenLayer's public testnet: the promise text, amount, due date, company, status, the chat transcript that produced it, and any proof, evidence or verdict reasoning. Treat anything you type into the demo chat as public and permanent. Don't paste real personal or financial details."],
        ["Your identity", "The site sets one cookie, kept_visitor: a random id. The server derives a demo wallet from it so that only your browser can claim your receipts. It contains no personal data, is not shared with anyone, and expires after a year. Clearing it gives you a fresh identity — and no way back to old receipts."],
        ["No tracking", "There is no analytics, no advertising, no fingerprinting, and no third-party script. Fonts are served by Google Fonts through Next.js's self-hosting, so no request goes to Google from your browser."],
        ["Chat contents", "Messages are sent to the demo agent (an LLM if one is configured, otherwise a scripted agent) and to GenLayer validators for checking and rulings. We keep no server-side log of them beyond what lands on-chain."],
        ["Testnet", "GenLayer Studio is a test network. Balances, bonds and payouts are test units with no monetary value. The network may be reset at any time by its operators, which would erase receipts."],
      ].map(([h, p]) => (
        <section key={h}><h2 className="serif text-[22px] text-ink">{h}</h2><p className="mt-2 text-[14px] leading-[1.65] text-ink-2">{p}</p></section>
      ))}
      <p className="border-t border-hairline pt-6 text-[12.5px] text-ink-3">Questions: open an issue on the repository.</p>
    </article>
  );
}
