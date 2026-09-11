"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import StatusPill, { short } from "./StatusPill";
import type { Receipt } from "@/lib/types";

export default function LiveFeed({ limit = 8, user, company, refreshMs = 4000 }: { limit?: number; user?: string; company?: string; refreshMs?: number }) {
  const [items, setItems] = useState<Receipt[] | null>(null);
  useEffect(() => {
    let alive = true;
    const q = new URLSearchParams({ limit: String(limit) }); if (user) q.set("user", user); if (company) q.set("company", company);
    const load = () => fetch(`/api/receipts?${q}`).then((r) => r.json()).then((d) => alive && setItems(d.receipts || [])).catch(() => {});
    load(); const t = setInterval(load, refreshMs); return () => { alive = false; clearInterval(t); };
  }, [limit, user, company, refreshMs]);
  if (!items) return <div className="text-sm text-white/40">Loading…</div>;
  if (!items.length) return <div className="text-sm text-white/40">No receipts yet.</div>;
  return (
    <ul className="divide-y divide-white/5">
      {items.map((r) => (
        <li key={r.id}>
          <Link href={`/r/${r.id}`} className="flex items-center gap-3 py-2.5 hover:bg-white/[.03] -mx-2 px-2 rounded-lg">
            <StatusPill status={r.status} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{r.promise}</div>
              <div className="mono truncate text-[11px] text-white/40">{r.id} · {r.company_name} → {short(r.user)} · due {r.due}</div>
            </div>
            {r.amount > 0 && <span className="mono text-sm text-white/70">${r.amount}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
