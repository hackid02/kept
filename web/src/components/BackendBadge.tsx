"use client";
import { useEffect, useState } from "react";

export default function BackendBadge() {
  const [b, setB] = useState<any>(null);
  useEffect(() => { fetch("/api/backend").then((r) => r.json()).then(setB).catch(() => {}); }, []);
  if (!b) return <span className="pill opacity-0">·</span>;
  const chain = b.backend === "chain";
  const label = chain ? (b.degraded ? `GenLayer · ${b.network} · slow` : `GenLayer · ${b.network}`) : "Simulator";
  return (
    <span className={`pill ${chain && !b.degraded ? "pill-accent" : "pill-amber"}`} title={chain ? (b.degraded ? `Contract ${b.contract} — Studio's RPC has been slow in the last minute; reads may show the last known data.` : `Contract ${b.contract}`) : "In-process twin of the contract. Same rules, same prompts."}>
      <span className="dot" />{label}
    </span>
  );
}
