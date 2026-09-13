"use client";
import { useEffect, useState } from "react";
import { Swap, Rise, Thinking } from "./Motion";
import { short, money } from "./Status";
import type { Receipt } from "@/lib/types";

const STEPS = ["Claim filed", "Validators reading the transcript", "Weighing proof against evidence", "Waiting for consensus"];

/**
 * The claim lives on the receipt. Customer side: evidence → file → verdict.
 * Company side: proof → mark kept. Both write to the same receipt.
 */
async function readError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  if (body?.error) return String(body.error);
  if (res.status === 429) return "GenLayer Studio is rate-limiting requests right now. Wait a few seconds and try again.";
  if (res.status === 504 || res.status === 502) return "That took longer than the network allowed. Nothing was recorded — try again.";
  return `Something went wrong (${res.status}). Try again.`;
}

export default function ClaimPanel({ r, onUpdate, onChain, mine }: { r: Receipt; onUpdate: (r: Receipt, meta?: { votes?: string }) => void; onChain: boolean; mine: boolean }) {
  const [side, setSide] = useState<"customer" | "company">("customer");
  const [evidence, setEvidence] = useState("");
  const [proof, setProof] = useState("");
  const [secret, setSecret] = useState("");
  const [today, setToday] = useState("");
  const [busy, setBusy] = useState<null | "claim" | "fulfil">(null);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ verdict: string; votes?: string; payout: number } | null>(null);
  useEffect(() => { setResult(null); setErr(null); }, [r.id]);

  const co = r.company_name || "the company";
  const coShort = co.split(" ")[0];
  const open = r.status === "ACTIVE";
  const due = new Date(r.due + "T00:00:00Z").getTime() <= Date.now();

  async function claim() {
    setBusy("claim"); setErr(null);
    try {
      const res = await fetch("/api/claim", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: r.id, evidence, today: today || undefined }) });
      if (!res.ok) throw new Error(await readError(res));
      const d = await res.json(); if (d.error || !d.receipt) throw new Error(d.error || "No verdict came back. Reload the receipt.");
      setResult({ verdict: d.receipt.status, votes: d.votes, payout: d.receipt.payout });
      onUpdate(d.receipt, { votes: d.votes });
    } catch (e: any) { setErr(String(e?.message || e)); } finally { setBusy(null); }
  }
  async function fulfil() {
    setBusy("fulfil"); setErr(null);
    try {
      const res = await fetch("/api/fulfill", { method: "POST", headers: { "content-type": "application/json", "x-kept-company-secret": secret }, body: JSON.stringify({ id: r.id, proof }) });
      if (!res.ok) throw new Error(await readError(res));
      const d = await res.json(); if (d.error || !d.receipt) throw new Error(d.error || "No answer came back. Reload the receipt.");
      onUpdate(d.receipt);
    } catch (e: any) { setErr(String(e?.message || e)); } finally { setBusy(null); }
  }

  if (result || r.status === "UPHELD" || r.status === "DISMISSED") {
    const upheld = (result?.verdict || r.status) === "UPHELD";
    return (
      <Rise className="surface p-5">
        <p className="label">Verdict</p>
        <p className={`serif mt-1 text-[32px] leading-none ${upheld ? "text-accent" : "text-ink"}`}><Swap value={upheld ? "Upheld" : "Dismissed"} /></p>
        <p className="mt-2 text-[13px] text-ink-2">{result?.votes ? `Ruled by ${result.votes}.` : "Ruled by GenLayer validators."}</p>
        {upheld && (
          <div className="mt-4 flex items-baseline justify-between border-t border-hairline pt-4">
            <span className="text-[13px] text-ink-2">Paid from {co}'s bond</span>
            <span className="mono text-[22px] text-accent">{money(result?.payout ?? r.payout)}</span>
          </div>
        )}
        {r.verdict_reason && <p className="mt-4 border-t border-hairline pt-4 text-[13px] leading-relaxed text-ink-2">{r.verdict_reason}</p>}
      </Rise>
    );
  }

  if (r.status === "BLOCKED") {
    return (
      <div className="surface p-5">
        <p className="label">Nothing to claim</p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">This reply was replaced before it reached the customer. It's kept on the record so {co} can see what its agent tried to say.</p>
      </div>
    );
  }
  if (r.status === "FULFILLED") {
    return (
      <div className="surface p-5">
        <p className="label">Marked kept by {co}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{r.proof}</p>
        <p className="mt-3 text-[12px] text-ink-3">Disagree? A claim can still be filed — validators weigh the proof.</p>
      </div>
    );
  }

  return (
    <div className="surface p-4">
      <div className="mb-3 flex gap-1 rounded-lg bg-surface-2 p-1" role="group" aria-label="Who are you?">
        {(["customer", "company"] as const).map((s) => (
          <button key={s} type="button" aria-pressed={side === s} onClick={() => setSide(s)}
            className={`h-7 flex-1 rounded-md text-[12px] font-medium transition-colors duration-150 ${side === s ? "bg-surface-3 text-ink" : "text-ink-2 hover:text-ink"}`}>
            {s === "customer" ? "I'm the customer" : `I'm ${coShort}`}
          </button>
        ))}
      </div>

      {side === "customer" ? (
        <div className="space-y-3">
          <div>
            <p className="text-[14px] font-medium text-ink">Not honored? Claim it.</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">Validators read the transcript and your evidence. Upheld pays <span className="mono text-ink">{money(r.amount)}</span> from {co}'s bond.</p>
            {onChain && <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">Demo setting: the on-chain due date is set to today so you can file now instead of waiting the days the agent quoted. Real deployments use the stated deadline.</p>}
          </div>
          {!mine && <p className="rounded-md border border-amber/30 bg-amber/5 px-3 py-2 text-[12.5px] text-amber">Promised to a different visitor. Only they can claim it — make your own promise in the chat.</p>}
          <textarea className="input min-h-[72px] resize-y text-[16px] sm:!text-[13px]" placeholder="What happened? e.g. Nine business days, nothing on my statement. Screenshot attached to ticket #5512." value={evidence} onChange={(e) => setEvidence(e.target.value)} disabled={!!busy || !mine} />
          {!onChain && !due && (
            <label className="flex items-center gap-2 text-[12px] text-ink-3">Demo clock
              <input className="input !h-8 !w-36 !py-0 !text-[12px]" placeholder="YYYY-MM-DD" value={today} onChange={(e) => setToday(e.target.value)} />
              <button type="button" className="text-accent hover:underline" onClick={() => { const d = new Date(r.due + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 5); setToday(d.toISOString().slice(0, 10)); }}>skip to after due date</button>
            </label>
          )}
          <div className="flex items-center justify-between gap-3 pt-1">
            <Thinking steps={STEPS} active={busy === "claim"} />
            <button className="btn btn-primary ml-auto" onClick={claim} disabled={!!busy || !evidence.trim() || !mine}>{busy === "claim" ? "Ruling…" : "File claim"}</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-[15px] font-medium text-ink">Mark as kept</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-2">This is {co}'s side of the receipt. It signs with the company key, so it needs the company secret — visitors can't attach proof to a receipt that isn't theirs to settle. The proof becomes part of what validators see if the customer disputes it anyway.</p>
          </div>
          <input className="input text-[16px] sm:!text-[14px]" placeholder="Proof — e.g. Refund RF-88213 posted to card ·4471 on 2026-09-14" value={proof} onChange={(e) => setProof(e.target.value)} disabled={!!busy} aria-label="Fulfilment proof" />
          <input className="input text-[16px] sm:!text-[14px]" type="password" autoComplete="off" placeholder="Company secret" value={secret} onChange={(e) => setSecret(e.target.value)} disabled={!!busy} aria-label="Company secret" />
          <div className="flex justify-end"><button className="btn btn-secondary" onClick={fulfil} disabled={!!busy || !proof.trim() || !secret}>{busy === "fulfil" ? "Submitting…" : "Mark kept"}</button></div>
        </div>
      )}
      {err && <p className="mt-3 text-[12.5px] text-rose" role="alert">{err}</p>}
    </div>
  );
}
