import type { ReceiptStatus } from "@/lib/types";
const map: Record<ReceiptStatus, string> = {
  ACTIVE: "bg-sky/15 text-sky", BLOCKED: "bg-rose/15 text-rose", FULFILLED: "bg-mint/15 text-mint",
  UPHELD: "bg-mint text-[#062015]", DISMISSED: "bg-white/10 text-white/70",
};
export default function StatusPill({ status }: { status: ReceiptStatus }) {
  return <span className={`pill ${map[status]}`}>{status}</span>;
}
export function ratePct(bp: number) { return bp < 0 ? "—" : `${(bp / 100).toFixed(1)}%`; }
export function rateColor(bp: number) { return bp < 0 ? "text-white/40" : bp >= 9500 ? "text-mint" : bp >= 8000 ? "text-amber" : "text-rose"; }
export function short(a: string) { return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ""; }
