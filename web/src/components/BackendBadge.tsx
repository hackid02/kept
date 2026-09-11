"use client";
import { useEffect, useState } from "react";

export default function BackendBadge() {
  const [b, setB] = useState<any>(null);
  useEffect(() => { fetch("/api/backend").then((r) => r.json()).then(setB).catch(() => {}); }, []);
  if (!b) return <span className="pill bg-white/5 text-white/40">…</span>;
  const chain = b.backend === "chain";
  return (
    <span className={`pill ${chain ? "bg-mint/15 text-mint" : "bg-amber/15 text-amber"}`} title={chain ? `contract ${b.contract}` : "in-process twin of the contract; same rules, same prompts, LLM panel"}>
      <span className={`h-1.5 w-1.5 rounded-full ${chain ? "bg-mint" : "bg-amber"}`} />
      {chain ? `GenLayer · ${b.network}` : b.degraded ? "Simulator · chain unreachable" : "Simulator"}{b.llm === "offline" ? " · offline LLM" : ""}
    </span>
  );
}
