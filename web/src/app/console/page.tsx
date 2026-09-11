"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LiveFeed from "@/components/LiveFeed";
import { ratePct, rateColor, short } from "@/components/StatusPill";
import type { Company } from "@/lib/types";

const SNIPPET = `import { kept } from "@kept/middleware";

// before: reply = await agent.respond(messages)
const reply = await kept.wrap(agent.respond, { company: SKYJET, user })(messages);
// after: same reply — plus a receipt if it promised something,
//        or a safe refusal if it promised something it can't keep.`;

function Console() {
  const params = useSearchParams();
  const want = params.get("c");
  const [cs, setCs] = useState<Company[] | null>(null);
  const [sel, setSel] = useState<Company | null>(null);
  useEffect(() => {
    const load = () => fetch("/api/leaderboard").then((r) => r.json()).then((d) => {
      const list: Company[] = d.companies || []; setCs(list);
      setSel((prev) => list.find((c) => c.address === (want || prev?.address)) || list.find((c) => c.name === "SkyJet Airlines") || list[0] || null);
    });
    load(); const t = setInterval(load, 5000); return () => clearInterval(t);
  }, [want]);

  if (!cs) return <div className="text-white/40">Loading…</div>;
  if (!sel) return <div className="card p-8 text-center text-white/60">No companies registered yet. Seed the demo from the home page.</div>;
  const kept = sel.fulfilled + sel.dismissed;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="k">Company console</div>
          <h1 className="text-2xl font-extrabold">{sel.name} <span className="mono text-sm font-normal text-white/40">{short(sel.address)}</span></h1>
        </div>
        <select className="input w-auto" value={sel.address} onChange={(e) => setSel(cs.find((c) => c.address === e.target.value) || sel)}>
          {cs.map((c) => <option key={c.address} value={c.address}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5 md:col-span-2">
          <div className="k mb-2">Authority envelope <span className="normal-case text-white/30">— plain English, public, what the agent may promise</span></div>
          <blockquote className="rounded-xl border border-mint/30 bg-mint/5 p-4 text-[15px] leading-relaxed">{sel.envelope}</blockquote>
          <p className="mt-3 text-xs text-white/50">Every commitment the agent drafts is checked against this text by GenLayer validators before it reaches the customer. Change the envelope by re-registering; the new text applies to new receipts only.</p>
        </div>
        <div className="space-y-4">
          <div className="card p-5"><div className="k">Kept-rate</div><div className={`mono mt-1 text-4xl font-extrabold ${rateColor(sel.kept_rate)}`}>{ratePct(sel.kept_rate)}</div><div className="mt-1 text-xs text-white/50">{kept} kept · {sel.upheld} broken</div></div>
          <div className="card p-5"><div className="k">Bond at risk</div><div className="mono mt-1 text-3xl font-bold">${sel.bond}</div><div className="mt-1 text-xs text-white/50">pays upheld claims automatically</div></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[["Committed", sel.committed], ["Blocked", sel.blocked], ["Fulfilled", sel.fulfilled], ["Upheld", sel.upheld], ["Dismissed", sel.dismissed]].map(([k, v]) => (
          <div key={k as string} className="card p-4"><div className="k">{k}</div><div className="mono mt-1 text-2xl font-bold">{v}</div></div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 font-bold">Receipts issued by {sel.name}</div>
          <LiveFeed limit={50} company={sel.address} />
        </div>
        <div className="card p-5">
          <div className="mb-1 font-bold">Wire it into your agent</div>
          <p className="mb-3 text-xs text-white/50">One line around whatever produces your agent&apos;s reply. Works with any LLM stack; the demo above is this exact path (see <span className="mono">web/src/app/api/chat/route.ts</span>).</p>
          <pre className="mono overflow-x-auto rounded-xl bg-[#0d0e12] p-4 text-xs leading-relaxed text-white/80">{SNIPPET}</pre>
          <div className="mt-3 text-xs text-white/50">Contract: <span className="mono">contracts/kept.py</span> · methods <span className="mono">register · commit · mark_fulfilled · claim · kept_rate</span></div>
        </div>
      </div>
    </div>
  );
}

export default function Page() { return <Suspense fallback={<div className="text-white/40">Loading…</div>}><Console /></Suspense>; }
