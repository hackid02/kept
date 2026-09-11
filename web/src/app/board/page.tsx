"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ratePct, rateTone, short, money } from "@/components/Status";
import type { Company, Stats } from "@/lib/types";

export default function Board() {
  const [cs, setCs] = useState<Company[] | null>(null);
  const [st, setSt] = useState<Stats | null>(null);
  useEffect(() => {
    const load = () => { fetch("/api/leaderboard").then((r) => r.json()).then((d) => setCs(d.companies)); fetch("/api/stats").then((r) => r.json()).then((d) => setSt(d.stats ?? d)); };
    load(); const t = setInterval(load, 20000); return () => clearInterval(t);
  }, []);
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="max-w-2xl">
        <h1 className="serif text-[34px] leading-none text-ink">Kept-rate</h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-ink-2">The share of promises each company's agents actually kept, as ruled by GenLayer validators — not by the company. Public, unforgeable, and the only number here a marketing team cannot touch.</p>
      </header>
      {st && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-hairline bg-hairline sm:grid-cols-4">
          {[["Companies", st.companies], ["Receipts", st.receipts], ["Blocked before sending", st.blocked], ["Paid from bonds", money(st.paid_out)]].map(([k, v]) => (
            <div key={k as string} className="bg-surface p-4"><p className="label">{k}</p><p className="mono mt-1.5 text-[24px] text-ink">{v}</p></div>
          ))}
        </div>
      )}
      <div className="surface overflow-hidden">
        <table className="w-full text-[13.5px]">
          <thead><tr className="text-left"><Th>Company</Th><Th>Kept-rate</Th><Th right>Promised</Th><Th right>Broken</Th><Th right>Blocked</Th><Th right>Bond</Th></tr></thead>
          <tbody>
            {(cs || []).map((c) => (
              <tr key={c.address} className="border-t border-hairline transition-colors hover:bg-white/[.02]">
                <td className="px-5 py-4"><Link href={`/console?c=${c.address}`} className="text-ink hover:underline">{c.name}</Link><p className="mono mt-0.5 text-[11px] text-ink-3">{short(c.address)}</p></td>
                <td className={`mono px-5 py-4 text-[22px] ${rateTone(c.kept_rate)}`}>{ratePct(c.kept_rate)}</td>
                <td className="mono px-5 py-4 text-right text-ink-2">{c.committed}</td>
                <td className="mono px-5 py-4 text-right text-rose">{c.upheld}</td>
                <td className="mono px-5 py-4 text-right text-ink-2">{c.blocked}</td>
                <td className="mono px-5 py-4 text-right text-ink-2">{money(c.bond)}</td>
              </tr>
            ))}
            {cs && !cs.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-3">No companies yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="max-w-2xl text-[12.5px] leading-relaxed text-ink-3">Kept-rate = (kept + dismissed claims) ÷ (kept + dismissed + upheld claims). Blocked commitments never became promises, so they count neither way — they're shown because they tell you how often an agent <em>tried</em> to overpromise.</p>
    </div>
  );
}
function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) { return <th className={`label px-5 py-3 font-medium ${right ? "text-right" : ""}`}>{children}</th>; }
