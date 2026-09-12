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
        <Row k="Due" v={r.due} />
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

function Row({ k, v, mono = true }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="label">{k}</dt>
      <dd className={`mt-0.5 truncate text-[13px] text-ink ${mono ? "mono" : ""}`}>{v}</dd>
    </div>
  );
}

/** One-line receipt for lists. */
export function ReceiptRow({ r, mine = false }: { r: Receipt; mine?: boolean }) {
  return (
    <Link href={`/r/${r.id}`} className="row-link -mx-3 flex flex-col gap-1.5 px-3 py-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex items-center justify-between sm:contents">
        <StatusPill status={r.status} className="sm:w-[92px] sm:justify-center" />
        <span className="mono text-[13px] text-ink-2 sm:order-last sm:w-16 sm:text-right">{r.amount > 0 ? money(r.amount) : ""}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="serif italic text-[16px] leading-tight text-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden sm:truncate sm:[display:block]">{r.promise}</p>
        <p className="mono mt-1 truncate text-[11.5px] text-ink-3">{r.id} · {r.company_name} → {short(r.user)}{mine ? " (you)" : ""} · due {r.due}</p>
      </div>
    </Link>
  );
}
