"use client";
import { useEffect, useState } from "react";
import { ReceiptRow } from "@/components/Receipt";
import type { Receipt } from "@/lib/types";

export default function ReceiptsPage() {
  const [items, setItems] = useState<Receipt[] | null>(null);
  const [me, setMe] = useState<{ user?: string }>({});
  const [only, setOnly] = useState<"all" | "mine">("all");
  useEffect(() => {
    fetch("/api/backend").then((r) => r.json()).then(setMe).catch(() => {});
    const load = () => fetch("/api/receipts?limit=200").then((r) => (r.ok ? r.json() : null)).then((d) => d && setItems(d.receipts || [])).catch(() => {});
    load(); const t = setInterval(load, 20000); return () => clearInterval(t);
  }, []);
  const list = (items || []).filter((r) => only === "all" || (me.user && r.user.toLowerCase() === me.user.toLowerCase()));
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-[30px] leading-none text-ink sm:text-[34px]">Receipts</h1>
          <p className="mt-2 text-[13.5px] text-ink-2">Every commitment any protected agent made to a person. Newest first. Public by design.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-surface-2 p-1">
          {(["all", "mine"] as const).map((k) => <button key={k} onClick={() => setOnly(k)} className={`h-8 rounded-md px-3 text-[12.5px] font-medium transition-colors ${only === k ? "bg-surface-3 text-ink" : "text-ink-2 hover:text-ink"}`}>{k === "all" ? "All" : "Mine"}</button>)}
        </div>
      </header>
      <div className="surface min-w-0 p-4 sm:p-5">
        {!items ? <p className="py-6 text-center text-[13px] text-ink-3">Loading…</p> : list.length ? <div className="hairline-y">{list.map((r) => <ReceiptRow key={r.id} r={r} mine={!!me.user && r.user.toLowerCase() === me.user.toLowerCase()} />)}</div> : <p className="py-10 text-center text-[13px] text-ink-3">{only === "mine" ? "No receipts of yours yet — go make SkyJet promise you something." : "No receipts yet."}</p>}
      </div>
    </div>
  );
}
