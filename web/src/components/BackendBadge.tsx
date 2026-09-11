"use client";
import { useEffect, useState } from "react";

export default function BackendBadge() {
  const [b, setB] = useState<any>(null);
  useEffect(() => { fetch("/api/backend").then((r) => r.json()).then(setB).catch(() => {}); }, []);
  if (!b) return <span className="pill opacity-0">·</span>;
  const chain = b.backend === "chain";
  const label = chain ? `GenLayer · ${b.network}` : b.degraded ? "Simulator · chain unreachable" : "Simulator";
  return (
    <span className={`pill ${chain ? "pill-accent" : "pill-amber"}`} title={chain ? `Contract ${b.contract}` : "In-process twin of the contract. Same rules, same prompts."}>
      <span className="dot" />{label}
    </span>
  );
}
