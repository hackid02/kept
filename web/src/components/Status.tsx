import type { ReceiptStatus } from "@/lib/types";

export const STATUS_WORD: Record<ReceiptStatus, string> = { ACTIVE: "Open", BLOCKED: "Blocked", FULFILLED: "Kept", UPHELD: "Upheld", DISMISSED: "Dismissed" };
const cls: Record<ReceiptStatus, string> = { ACTIVE: "pill-amber", BLOCKED: "pill-rose", FULFILLED: "pill-accent", UPHELD: "pill-solid", DISMISSED: "" };

export function StatusPill({ status, className = "" }: { status: ReceiptStatus; className?: string }) {
  return <span className={`pill ${cls[status]} ${className}`}><span className="dot" />{STATUS_WORD[status]}</span>;
}
export const ratePct = (bp: number) => (bp < 0 ? "—" : `${(bp / 100).toFixed(bp % 100 === 0 ? 0 : 1)}%`);
export const rateTone = (bp: number) => (bp < 0 ? "text-ink-3" : bp >= 9500 ? "text-accent" : bp >= 8000 ? "text-amber" : "text-rose");
export const short = (a: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
export const money = (n: number) => `$${n.toLocaleString("en-US")}`;
