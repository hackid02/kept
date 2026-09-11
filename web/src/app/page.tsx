"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Chat from "@/components/Chat";
import ClaimPanel from "@/components/ClaimPanel";
import { ReceiptCard, ReceiptRow } from "@/components/Receipt";
import { Rise, AnimatePresence } from "@/components/Motion";
import { ratePct, rateTone, money } from "@/components/Status";
import type { Company, Receipt } from "@/lib/types";

export default function Home() {
  const [me, setMe] = useState<{ user?: string; backend?: string }>({});
  const [pinned, setPinned] = useState<Receipt | null>(null);
  const [feed, setFeed] = useState<Receipt[]>([]);
  const [board, setBoard] = useState<Company[]>([]);
  const onChain = me.backend === "chain";

  const refresh = () => {
    fetch("/api/receipts?limit=6").then((r) => r.json()).then((d) => setFeed(d.receipts || [])).catch(() => {});
    fetch("/api/leaderboard").then((r) => r.json()).then((d) => setBoard(d.companies || [])).catch(() => {});
  };
  useEffect(() => {
    fetch("/api/backend").then((r) => r.json()).then(setMe).catch(() => {});
    refresh(); const t = setInterval(refresh, 15000); return () => clearInterval(t);
  }, []);
  // pin this visitor's latest receipt on load
  useEffect(() => {
    if (!me.user) return;
    fetch(`/api/receipts?user=${me.user}&limit=1`).then((r) => r.json()).then((d) => { if (d.receipts?.[0] && !pinned) setPinned(d.receipts[0]); }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.user]);

  const skyjet = board.find((c) => c.name === "SkyJet Airlines");

  return (
    <div className="space-y-16">
      {/* hero */}
      <section className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
        <div className="max-w-2xl">
          <p className="label mb-4">Live on GenLayer</p>
          <h1 className="serif text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[54px]">
            Agents can talk.<br /><span className="italic text-ink-2">Kept</span> lets them give their word.
          </h1>
          <p className="mt-5 max-w-xl text-[15.5px] leading-[1.6] text-ink-2">
            Every promise SkyJet's agent makes to you becomes a receipt backed by a bond. Promises outside its authority never reach you. Promises it breaks are paid — ruled by validators, not by SkyJet.
          </p>
        </div>
        <ol className="grid gap-2 text-[13px] text-ink-2 md:w-[280px]">
          {[["01", "Ask for a refund. You get a receipt."], ["02", "Try the jailbreak. Watch it get blocked."], ["03", "File a claim. The bond pays."]].map(([n, t]) => (
            <li key={n} className="flex gap-3 border-t border-hairline pt-2"><span className="mono text-ink-3">{n}</span><span>{t}</span></li>
          ))}
        </ol>
      </section>

      {/* the loop */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]" aria-label="Demo">
        <Chat onChain={onChain} onReceipt={(r) => { setPinned((cur) => (r.status === "BLOCKED" && cur && cur.status === "ACTIVE" ? cur : r)); refresh(); }} />

        <aside className="space-y-4 lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-88px)] lg:self-start lg:overflow-y-auto lg:pr-1 pane">
          <AnimatePresence mode="wait" initial={false}>
            {pinned ? (
              <Rise key={pinned.id + pinned.status}>
                <div className="space-y-4">
                  <ReceiptCard r={pinned} mine />
                  <ClaimPanel r={pinned} onChain={onChain} mine onUpdate={(r) => { setPinned(r); refresh(); }} />
                  <div className="flex items-center justify-between px-1 text-[12px] text-ink-3">
                    <span className="mono truncate">{pinned.tx ? `tx ${pinned.tx.slice(0, 10)}…${pinned.tx.slice(-6)}` : onChain ? "on GenLayer" : "simulator"}</span>
                    <Link href={`/r/${pinned.id}`} className="hover:text-ink-2">Open receipt →</Link>
                  </div>
                </div>
              </Rise>
            ) : (
              <Rise key="empty">
                <div className="surface flex min-h-[240px] flex-col items-center justify-center p-6 text-center">
                  <div className="serif italic text-[22px] text-ink-3">Your receipt will appear here.</div>
                  <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-ink-3">The moment SkyJet's agent promises you something, validators check it and it lands here — claimable if it isn't kept.</p>
                </div>
              </Rise>
            )}
          </AnimatePresence>

          {skyjet && (
            <div className="surface p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] text-ink-2">SkyJet Airlines</span>
                <span className={`mono text-[22px] ${rateTone(skyjet.kept_rate)}`}>{ratePct(skyjet.kept_rate)}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-[12px]">
                <Stat k="Bond at risk" v={money(skyjet.bond)} />
                <Stat k="Broken" v={String(skyjet.upheld)} />
                <Stat k="Blocked" v={String(skyjet.blocked)} />
              </div>
            </div>
          )}
        </aside>
      </section>

      {/* what happened + board */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]">
        <div className="surface p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium text-ink">Receipts, live</h2>
            <Link href="/receipts" className="text-[12.5px] text-ink-3 hover:text-ink-2">All receipts →</Link>
          </div>
          <div className="hairline-y">
            {feed.length ? feed.map((r) => <ReceiptRow key={r.id} r={r} mine={!!me.user && r.user.toLowerCase() === me.user.toLowerCase()} />) : <p className="py-6 text-center text-[13px] text-ink-3">No receipts yet.</p>}
          </div>
        </div>
        <div className="surface p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium text-ink">Kept-rate</h2>
            <Link href="/board" className="text-[12.5px] text-ink-3 hover:text-ink-2">Board →</Link>
          </div>
          <div className="hairline-y">
            {board.map((c) => (
              <Link key={c.address} href={`/console?c=${c.address}`} className="row-link -mx-3 flex items-center justify-between px-3 py-3">
                <div>
                  <p className="text-[14px] text-ink">{c.name}</p>
                  <p className="mono mt-0.5 text-[11.5px] text-ink-3">{c.committed} promised · {c.upheld} broken · {money(c.bond)} bonded</p>
                </div>
                <span className={`mono text-[20px] ${rateTone(c.kept_rate)}`}>{ratePct(c.kept_rate)}</span>
              </Link>
            ))}
          </div>
          <p className="mt-4 border-t border-hairline pt-3 text-[12px] leading-relaxed text-ink-3">The share of promises each company's agents kept, as ruled by validators. The one number a marketing team can't touch.</p>
        </div>
      </section>

      {/* how, briefly */}
      <section className="grid gap-6 border-t border-hairline pt-10 md:grid-cols-3">
        {[
          ["Before the promise", "The company writes what its agent may promise, in plain English, and posts a bond. Every reply that commits to something is checked against that envelope by GenLayer validators — before it's sent."],
          ["The receipt", "Inside the envelope, the promise is minted as a receipt: what, how much, by when, the transcript. Public, unforgeable, held by the customer."],
          ["If it's broken", "After the due date the customer files a claim. Validators on independent models read everything and rule. Upheld pays from the bond in the same transaction. No tribunal, no fifteen months."],
        ].map(([h, p]) => (
          <div key={h}><h3 className="serif text-[22px] text-ink">{h}</h3><p className="mt-2 text-[13.5px] leading-[1.6] text-ink-2">{p}</p></div>
        ))}
      </section>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return <div><p className="label !text-[10px]">{k}</p><p className="mono mt-0.5 text-[13px] text-ink">{v}</p></div>;
}
