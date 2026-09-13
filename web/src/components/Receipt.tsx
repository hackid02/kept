"use client";
import Link from "next/link";
import { Mark } from "./Logo";
import { StatusPill, short, money } from "./Status";
import type { Receipt } from "@/lib/types";

/**
 * The receipt — Kept's hero object. Same anatomy at every size:
 *   mark · id · status  /  promise (serif italic)  /  metadata rows (mono)  /  edge colour = status
 */
const edge: Record<Receipt["status"], string> = {
  ACTIVE: "border-l-amber", BLOCKED: "border-l-rose", FULFILLED: "border-l-accent", UPHELD: "border-l-accent", DISMISSED: "border-l-ink-3",
};

export function ReceiptCard({ r, compact = false, mine = false, href, heading = "h2" }: { r: Receipt; compact?: boolean; mine?: boolean; href?: string; heading?: "h1" | "h2" | "p" }) {
  const H = heading;
  // the demo opens the claim window at once (due = day of creation) while the agent quoted a longer timeframe — say so on the receipt itself
  const demoDue = !!r.created_at && r.due === r.created_at.slice(0, 10) && /\b(\d+\s*(business\s*)?days?|weeks?)\b/i.test(r.promise + " " + r.transcript);
  const body = (
    <article className={`surface border-l-2 ${edge[r.status]} ${compact ? "p-4" : "p-5"}`} aria-label={`Receipt ${r.id}`}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Mark size={18} draw={!compact} />
          <span className="mono text-[12px] text-ink-2">{r.id}</span>
          {mine && <span className="pill pill-accent !h-5 !px-1.5 !text-[10px]">yours</span>}
        </div>
        <StatusPill status={r.status} />
      </header>

      {compact
        ? <p className="serif italic text-[19px] leading-[1.3] tracking-[-0.01em] text-ink">{r.promise}</p>
        : <H className="serif italic text-[22px] leading-[1.3] tracking-[-0.01em] text-ink">{r.promise}</H>}

      <dl className={`mt-4 grid gap-x-6 gap-y-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
        <Row k="Value" v={r.amount > 0 ? money(r.amount) : "—"} />
        <Row k="Due" v={r.due} title={demoDue ? "Demo setting: the on-chain due date is the day of the promise so a claim can be filed at once. The agent's quoted timeframe is in the transcript; real deployments use it." : undefined} />
        <Row k="From" v={r.company_name} mono={false} />
        <Row k="To" v={short(r.user)} />
      </dl>

      {!compact && (
        <p className="mt-4 border-t border-hairline pt-3 text-[12.5px] leading-relaxed text-ink-2">
          {r.status === "BLOCKED" ? <span className="text-rose">Outside authority.</span> : <span className="text-accent">Within authority.</span>} {r.check_reason}
        </p>
      )}
    </article>
  );
  return href ? <Link href={href} className="block rounded-[14px] transition-transform duration-150 ease-out hover:-translate-y-px">{body}</Link> : body;
}

function Row({ k, v, mono = true, title }: { k: string; v: string; mono?: boolean; title?: string }) {
  return (
    <div className="min-w-0" title={title}>
      <dt className="label">{k}{title && <span className="ml-1 cursor-help text-ink-3" aria-label={title}>ⓘ</span>}</dt>
      <dd className={`mt-0.5 truncate text-[13px] text-ink ${mono ? "mono" : ""}`}>{v}</dd>
    </div>
  );
}

/** One-line receipt for lists. */
export function ReceiptRow({ r, mine = false }: { r: Receipt; mine?: boolean }) {
  const meta = `${r.id} · ${r.company_name} → ${short(r.user)}${mine ? " (you)" : ""} · due ${r.due}`;
  const amount = r.amount > 0 ? money(r.amount) : "";
  return (
    <Link href={`/r/${r.id}`} className="row-link -mx-3 block px-3 py-3">
      {/* ≥sm: one line — fixed-width pill · promise (truncates) · right-aligned amount */}
      <span className="hidden items-center gap-4 sm:flex">
        <StatusPill status={r.status} className="w-[92px] shrink-0 justify-center" />
        <span className="min-w-0 flex-1">
          <span className="serif block truncate text-[16px] italic leading-tight text-ink">{r.promise}</span>
          <span className="mono mt-0.5 block truncate text-[11.5px] text-ink-3">{meta}</span>
        </span>
        <span className="mono w-16 shrink-0 text-right text-[13px] text-ink-2">{amount}</span>
      </span>
      {/* phones: pill and amount on the first line, promise clamped to two lines below */}
      <span className="flex flex-col gap-1.5 sm:hidden">
        <span className="flex items-center justify-between">
          <StatusPill status={r.status} />
          <span className="mono text-[13px] text-ink-2">{amount}</span>
        </span>
        <span className="serif line-clamp-2 text-[16px] italic leading-tight text-ink">{r.promise}</span>
        <span className="mono block truncate text-[11.5px] text-ink-3">{meta}</span>
      </span>
    </Link>
  );
}
