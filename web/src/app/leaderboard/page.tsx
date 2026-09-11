"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ratePct, rateColor, short } from "@/components/StatusPill";
import type { Company, Stats } from "@/lib/types";

export default function Board() {
  const [cs, setCs] = useState<Company[] | null>(null);
  const [st, setSt] = useState<Stats | null>(null);
  useEffect(() => {
    const load = () => { fetch("/api/leaderboard").then((r) => r.json()).then((d) => setCs(d.companies)); fetch("/api/stats").then((r) => r.json()).then((d) => setSt(d.stats)); };
    load(); const t = setInterval(load, 5000); return () => clearInterval(t);
  }, []);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Kept-rate</h1>
        <p className="mt-1 text-sm text-white/60">Share of promises each company&apos;s agents actually kept, as ruled by GenLayer validators — not by the company. Public, unforgeable, and the only number here that a marketing team cannot touch.</p>
      </div>
      {st && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Companies", st.companies], ["Receipts", st.receipts], ["Blocked before sending", st.blocked], ["Paid from bonds", `$${st.paid_out}`]].map(([k, v]) => (
            <div key={k as string} className="card p-4"><div className="k">{k}</div><div className="mono mt-1 text-2xl font-bold">{v}</div></div>
          ))}
        </div>
      )}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[.03] text-left text-xs uppercase tracking-wider text-white/40">
            <tr><th className="px-4 py-3">Company</th><th className="px-4 py-3">Kept-rate</th><th className="px-4 py-3 text-right">Promises</th><th className="px-4 py-3 text-right">Broken</th><th className="px-4 py-3 text-right">Blocked</th><th className="px-4 py-3 text-right">Bond</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {(cs || []).map((c) => (
              <tr key={c.address} className="hover:bg-white/[.02]">
                <td className="px-4 py-3"><Link href={`/console?c=${c.address}`} className="font-semibold hover:underline">{c.name}</Link><div className="mono text-[11px] text-white/40">{short(c.address)}</div></td>
                <td className={`mono px-4 py-3 text-xl font-bold ${rateColor(c.kept_rate)}`}>{ratePct(c.kept_rate)}</td>
                <td className="mono px-4 py-3 text-right">{c.committed}</td>
                <td className="mono px-4 py-3 text-right text-rose">{c.upheld}</td>
                <td className="mono px-4 py-3 text-right text-white/60">{c.blocked}</td>
                <td className="mono px-4 py-3 text-right">${c.bond}</td>
              </tr>
            ))}
            {cs && !cs.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-white/40">No companies yet — seed the demo from the home page.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-white/40">Kept-rate = (fulfilled + dismissed claims) ÷ (fulfilled + dismissed + upheld claims). Blocked commitments never became promises, so they don&apos;t count either way — they&apos;re shown because they tell you how often an agent <i>tried</i> to overpromise.</p>
    </div>
  );
}
