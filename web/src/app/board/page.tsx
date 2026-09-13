"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { short, money } from "@/components/Status";
import { RateRing, Count, OutcomeBars } from "@/components/Viz";
import type { Receipt } from "@/lib/types";
import type { Company, Stats } from "@/lib/types";

export default function Board() {
  const [cs, setCs] = useState<Company[] | null>(null);
  const [st, setSt] = useState<Stats | null>(null);
  const [rs, setRs] = useState<Receipt[]>([]);
  useEffect(() => {
    const load = () => {
      fetch("/api/leaderboard").then((r) => (r.ok ? r.json() : null)).then((d) => d && setCs(d.companies)).catch(() => {});
      fetch("/api/stats").then((r) => (r.ok ? r.json() : null)).then((d) => d && setSt(d.stats ?? d)).catch(() => {});
      fetch("/api/receipts?limit=40").then((r) => (r.ok ? r.json() : null)).then((d) => d && setRs(d.receipts || [])).catch(() => {});
    };
    load(); const t = setInterval(load, 20000); return () => clearInterval(t);
  }, []);
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="max-w-2xl">
        <h1 className="serif text-[30px] leading-none text-ink sm:text-[34px]">Kept-rate</h1>
        <p className="mt-3 text-[14px] leading-[1.6] text-ink-2">The share of promises each company's agents actually kept, as ruled by GenLayer validators — not by the company. Public, unforgeable, and the only number here a marketing team cannot touch.</p>
      </header>
      {st && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-hairline bg-hairline sm:grid-cols-4">
          {[["Companies", st.companies, ""], ["Receipts", st.receipts, ""], ["Blocked before sending", st.blocked, ""], ["Paid from bonds", st.paid_out, "$"]].map(([k, v, pre]) => (
            <div key={k as string} className="bg-surface p-4"><p className="label">{k}</p><p className="mt-1.5 text-[24px] text-ink"><Count to={v as number} prefix={pre as string} /></p></div>
          ))}
        </div>
      )}
      {rs.length > 0 && (
        <div className="surface flex flex-wrap items-end justify-between gap-4 p-4 sm:p-5">
          <div><p className="label">Last {Math.min(rs.length, 40)} receipts</p><p className="mt-1 text-[12.5px] text-ink-3">Newest on the right. Height is outcome, not amount.</p></div>
          <div className="flex items-end gap-5">
            <OutcomeBars statuses={[...rs].reverse().map((r) => r.status)} height={40} max={40} />
            <span className="mono hidden text-[10.5px] text-ink-3 sm:block"><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber align-middle" />open<br /><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-rose align-middle" />blocked<br /><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-ink align-middle" />upheld</span>
          </div>
        </div>
      )}
      {/* ≥sm: table. Phones: one card per company — same data, no horizontal scroll. */}
      <div className="surface hidden overflow-hidden sm:block">
        <table className="w-full text-[13.5px]">
          <thead><tr className="text-left"><Th>Company</Th><Th>Kept-rate</Th><Th right>Promised</Th><Th right>Broken</Th><Th right>Blocked</Th><Th right>Bond</Th></tr></thead>
          <tbody>
            {(cs || []).map((c) => (
              <tr key={c.address} className="border-t border-hairline transition-colors hover:bg-wash/[.03]">
                <td className="px-5 py-4"><Link href={`/console?c=${c.address}`} className="text-ink hover:underline">{c.name}</Link><p className="mono mt-0.5 text-[11px] text-ink-3">{short(c.address)}</p></td>
                <td className="px-5 py-3"><RateRing bp={c.kept_rate} size={52} stroke={4} /></td>
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
      <ul className="space-y-3 sm:hidden">
        {(cs || []).map((c) => (
          <li key={c.address}>
            <Link href={`/console?c=${c.address}`} className="surface block p-4 transition-colors active:bg-surface-2">
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-[15px] text-ink">{c.name}</p><p className="mono mt-0.5 text-[11px] text-ink-3">{short(c.address)}</p></div>
                <RateRing bp={c.kept_rate} size={56} stroke={4} />
              </div>
              <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-hairline pt-3">
                {[["Promised", c.committed, "text-ink-2"], ["Broken", c.upheld, "text-rose"], ["Blocked", c.blocked, "text-ink-2"], ["Bond", money(c.bond), "text-ink-2"]].map(([k, v, t]) => (
                  <div key={k as string}><dt className="label !text-[10px]">{k}</dt><dd className={`mono mt-0.5 text-[13px] ${t}`}>{v}</dd></div>
                ))}
              </dl>
            </Link>
          </li>
        ))}
        {cs && !cs.length && <li className="surface p-8 text-center text-[13px] text-ink-3">No companies yet.</li>}
      </ul>
      <p className="max-w-2xl text-[12.5px] leading-relaxed text-ink-3">Kept-rate = (kept + dismissed claims) ÷ (kept + dismissed + upheld claims). Blocked commitments never became promises, so they count neither way — they're shown because they tell you how often an agent <em>tried</em> to overpromise.</p>
    </div>
  );
}
function Th({ children, right = false }: { children: React.ReactNode; right?: boolean }) { return <th className={`label px-5 py-3 font-medium ${right ? "text-right" : ""}`}>{children}</th>; }
