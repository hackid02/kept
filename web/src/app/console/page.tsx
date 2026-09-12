"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReceiptRow } from "@/components/Receipt";
import { ratePct, rateTone, short, money } from "@/components/Status";
import type { Company, Receipt } from "@/lib/types";

const SNIPPET = `import { wrap } from "kept/middleware";

// before
const reply = await myAgent(messages);

// after — same agent, same prompt, same model
const { reply, receipt, blocked } =
  await wrap(myAgent)(messages, { user });`;

function Console() {
  const want = useSearchParams().get("c");
  const [cs, setCs] = useState<Company[] | null>(null);
  const [sel, setSel] = useState<Company | null>(null);
  const [rs, setRs] = useState<Receipt[]>([]);
  useEffect(() => {
    const load = () => fetch("/api/leaderboard").then((r) => r.json()).then((d) => {
      const list: Company[] = d.companies || []; setCs(list);
      setSel((prev) => list.find((c) => c.address === (prev?.address || want)) || list.find((c) => c.name === "SkyJet Airlines") || list[0] || null);
    });
    load(); const t = setInterval(load, 20000); return () => clearInterval(t);
  }, [want]);
  const [full, setFull] = useState<Company | null>(null);
  useEffect(() => {
    if (!sel) return;
    fetch(`/api/receipts?company=${sel.address}&limit=50`).then((r) => r.json()).then((d) => setRs(d.receipts || []));
    if (!sel.envelope) fetch(`/api/company?c=${sel.address}`).then((r) => r.json()).then((d) => d.company && setFull(d.company)).catch(() => {});
  }, [sel]);
  const envelope = sel?.envelope || (full?.address === sel?.address ? full?.envelope : "") || "";

  if (!cs) return <p className="text-[13px] text-ink-3">Loading…</p>;
  if (!sel) return <div className="surface p-10 text-center text-[13px] text-ink-3">No companies registered yet.</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Company console</p>
          <h1 className="serif mt-1 text-[30px] leading-none text-ink sm:text-[34px]">{sel.name}</h1>
          <p className="mono mt-2 break-all text-[11px] text-ink-3 sm:text-[12px]">{sel.address}</p>
        </div>
        <select className="input !h-9 !w-auto appearance-none !py-0 !pr-9 !text-[13px] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 12 12%22 fill=%22none%22 stroke=%22%236B6B68%22 stroke-width=%221.5%22><path d=%22M3 4.5l3 3 3-3%22/></svg>')] bg-[length:12px] bg-[position:right_12px_center] bg-no-repeat" value={sel.address} onChange={(e) => setSel(cs.find((c) => c.address === e.target.value) || sel)} aria-label="Company">
          {cs.map((c) => <option key={c.address} value={c.address}>{c.name}</option>)}
        </select>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
        <section className="surface p-5">
          <p className="label">Authority envelope</p>
          <blockquote className="serif mt-3 whitespace-pre-line text-[19px] leading-[1.35] text-ink sm:text-[22px]">{envelope || <span className="shimmer text-ink-3">Reading envelope from the contract…</span>}</blockquote>
          <p className="mt-4 border-t border-hairline pt-3 text-[12.5px] leading-relaxed text-ink-3">Plain English, public. Every commitment the agent drafts is checked against this text by validators before it reaches a customer. Re-register to change it; new text applies to new receipts.</p>
        </section>
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[14px] border border-hairline bg-hairline">
          <Cell k="Kept-rate" v={ratePct(sel.kept_rate)} tone={rateTone(sel.kept_rate)} big />
          <Cell k="Bond at risk" v={money(sel.bond)} big />
          <Cell k="Promised" v={String(sel.committed)} />
          <Cell k="Blocked" v={String(sel.blocked)} />
          <Cell k="Kept" v={String(sel.fulfilled)} />
          <Cell k="Broken" v={String(sel.upheld)} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
        <section className="surface min-w-0 p-4 sm:p-5">
          <h2 className="mb-2 text-[15px] font-medium text-ink">Receipts issued</h2>
          {rs.length ? <div className="hairline-y">{rs.map((r) => <ReceiptRow key={r.id} r={r} />)}</div> : <p className="py-8 text-center text-[13px] text-ink-3">None yet.</p>}
        </section>
        <section className="surface min-w-0 p-4 sm:p-5">
          <h2 className="text-[15px] font-medium text-ink">Wire it in</h2>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">One line around whatever produces your agent's reply. Any model, any framework. The demo is this exact path.</p>
          <pre className="mono mt-4 overflow-x-auto rounded-lg border border-hairline bg-canvas p-4 text-[12px] leading-[1.7] text-ink-2">{SNIPPET}</pre>
          <p className="mono mt-3 text-[11px] text-ink-3">contracts/kept.py · register · commit · mark_fulfilled · claim · kept_rate</p>
        </section>
      </div>
    </div>
  );
}
function Cell({ k, v, tone = "text-ink", big = false }: { k: string; v: string; tone?: string; big?: boolean }) {
  return <div className="bg-surface p-4"><p className="label">{k}</p><p className={`mono mt-1.5 ${big ? "text-[26px]" : "text-[18px]"} ${tone}`}>{v}</p></div>;
}
export default function Page() { return <Suspense fallback={<p className="text-[13px] text-ink-3">Loading…</p>}><Console /></Suspense>; }
