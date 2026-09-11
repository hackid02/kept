"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import StatusPill, { short } from "@/components/StatusPill";
import type { Receipt } from "@/lib/types";

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [r, setR] = useState<Receipt | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [evidence, setEvidence] = useState("");
  const [today, setToday] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"customer" | "company">("customer");
  const [proof, setProof] = useState("");

  const load = () => fetch(`/api/receipt/${params.id}`).then(async (x) => { if (x.status === 404) { setNotFound(true); return; } setR((await x.json()).receipt); });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [params.id]);

  if (notFound) return <div className="card p-8 text-center text-white/60">No receipt <span className="mono">{params.id}</span>.</div>;
  if (!r) return <div className="text-white/40">Loading…</div>;

  const overdue = new Date(r.due + "T00:00:00Z").getTime() < Date.now();
  const canClaim = r.status === "ACTIVE";

  async function claim() {
    if (!r) return;
    setBusy("claim"); setErr(null);
    setLog(["Claim filed by the customer.", "Validators receive: envelope, transcript, promise, evidence.", "Each validator rules independently on an undisclosed model…"]);
    try {
      const res = await fetch("/api/claim", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: r.id, evidence, today: today || undefined }) });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setLog((l) => [...l, `Verdict: ${d.verdict}${d.votes ? ` (${d.votes})` : ""}.`, d.verdict === "UPHELD" ? `$${d.receipt.payout} paid from ${r.company_name}'s bond to ${short(r.user)}.` : "Claim dismissed. Kept-rate unchanged."]);
      setR(d.receipt);
    } catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  }

  async function fulfill() {
    if (!r) return;
    setBusy("fulfill"); setErr(null);
    try {
      const res = await fetch("/api/fulfill", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: r.id, proof }) });
      const d = await res.json(); if (d.error) throw new Error(d.error); setR(d.receipt);
    } catch (e: any) { setErr(e.message); } finally { setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="card-mint rise p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={34} word={false} />
            <div>
              <div className="text-xs font-extrabold tracking-wider text-mint">KEPT RECEIPT</div>
              <div className="mono text-lg font-bold">{r.id}</div>
            </div>
          </div>
          <StatusPill status={r.status} />
        </div>
        <div className="text-2xl font-bold leading-snug">{r.promise}</div>
        <dl className="mt-5 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div><dt className="k">Company</dt><dd className="mt-0.5"><Link className="underline" href={`/console?c=${r.company}`}>{r.company_name}</Link> <span className="mono text-white/40">{short(r.company)}</span></dd></div>
          <div><dt className="k">Promised to</dt><dd className="mono mt-0.5">{short(r.user)}</dd></div>
          <div><dt className="k">Value</dt><dd className="mono mt-0.5">{r.amount > 0 ? `$${r.amount}` : "—"}</dd></div>
          <div><dt className="k">Due</dt><dd className="mono mt-0.5">{r.due} {canClaim && overdue && <span className="pill ml-2 bg-amber/15 text-amber">OVERDUE</span>}</dd></div>
          <div className="sm:col-span-2"><dt className="k">Envelope check</dt><dd className="mt-0.5">{r.status === "BLOCKED" ? <span className="text-rose">✕ outside authority</span> : <span className="text-mint">✓ within authority</span>} <span className="text-white/60">— {r.check_reason}</span></dd></div>
          {r.proof && <div className="sm:col-span-2"><dt className="k">Company proof of fulfilment</dt><dd className="mt-0.5 text-white/80">{r.proof}</dd></div>}
          {r.evidence && <div className="sm:col-span-2"><dt className="k">Customer evidence</dt><dd className="mt-0.5 text-white/80">{r.evidence}</dd></div>}
          {r.verdict_reason && <div className="sm:col-span-2"><dt className="k">Validators&apos; reasoning</dt><dd className="mt-0.5 text-white/80">{r.verdict_reason}</dd></div>}
          {r.status === "UPHELD" && <div className="sm:col-span-2 rounded-xl bg-mint/10 p-3 text-mint"><b>${r.payout}</b> paid to {short(r.user)} from {r.company_name}&apos;s bond.</div>}
          <div><dt className="k">Created</dt><dd className="mono mt-0.5 text-white/60">{r.created_at}</dd></div>
          <div><dt className="k">Anchored</dt><dd className="mono mt-0.5 text-white/60">{r.tx ? r.tx : "GenLayer (simulator)"}</dd></div>
        </dl>
      </div>

      {r.status === "BLOCKED" && (
        <div className="card p-5 text-sm text-white/70">This commitment was outside {r.company_name}&apos;s authority envelope, so the agent&apos;s reply was replaced before it reached the customer. Nothing to claim — no promise was ever made. It stays on the record so the company can see what its agent tried to say.</div>
      )}

      {canClaim && (
        <div className="card p-5">
          <div className="mb-4 flex gap-2">
            <button onClick={() => setTab("customer")} className={`btn-ghost !py-1.5 ${tab === "customer" ? "!border-mint text-white" : ""}`}>I&apos;m the customer</button>
            <button onClick={() => setTab("company")} className={`btn-ghost !py-1.5 ${tab === "company" ? "!border-mint text-white" : ""}`}>I&apos;m {r.company_name}</button>
          </div>
          {tab === "customer" ? (
            <div className="space-y-3">
              <h3 className="font-bold">Not honored? Claim it.</h3>
              <p className="text-sm text-white/60">GenLayer validators read the transcript and your evidence, then rule. If upheld, <b className="text-white">${Math.max(r.amount, 0)}</b> is paid from {r.company_name}&apos;s bond automatically. Claims open after the due date.</p>
              <textarea className="input min-h-[80px]" placeholder="What happened? e.g. It's been 9 business days and nothing arrived. Bank statement attached in the ticket." value={evidence} onChange={(e) => setEvidence(e.target.value)} />
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs text-white/50">Demo clock <input className="input ml-2 inline-block w-40 !py-1.5" placeholder="YYYY-MM-DD (fast-forward)" value={today} onChange={(e) => setToday(e.target.value)} /></label>
                {!overdue && !today && <button className="text-xs text-mint underline" onClick={() => { const d = new Date(r.due + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 5); setToday(d.toISOString().slice(0, 10)); }}>fast-forward past due date</button>}
                <button className="btn-primary ml-auto" onClick={claim} disabled={!!busy || !evidence.trim()}>{busy === "claim" ? "Validators ruling…" : "File claim"}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="font-bold">Mark fulfilled</h3>
              <p className="text-sm text-white/60">Only the company key can do this. Attach proof; it becomes part of the record the validators see if the customer disputes anyway.</p>
              <input className="input" placeholder="Proof, e.g. Refund RF-88213 posted to card ending 4471 on 2026-09-14" value={proof} onChange={(e) => setProof(e.target.value)} />
              <button className="btn-blue" onClick={fulfill} disabled={!!busy || !proof.trim()}>{busy === "fulfill" ? "Submitting…" : "Mark fulfilled"}</button>
            </div>
          )}
        </div>
      )}

      {log.length > 0 && (
        <div className="card p-5">
          <div className="k mb-2">Adjudication</div>
          <ol className="space-y-1.5 text-sm">{log.map((l, i) => <li key={i} className="rise flex gap-2"><span className="text-mint">›</span><span>{l}</span></li>)}</ol>
        </div>
      )}
      {err && <div className="rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">{err}</div>}

      <details className="card p-5 text-sm">
        <summary className="cursor-pointer font-bold">Transcript the validators see</summary>
        <pre className="mono mt-3 whitespace-pre-wrap text-xs leading-relaxed text-white/70">{r.transcript}</pre>
      </details>
    </div>
  );
}
