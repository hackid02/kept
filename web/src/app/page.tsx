"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Chat from "@/components/Chat";
import ClaimPanel from "@/components/ClaimPanel";
import { ReceiptCard, ReceiptRow } from "@/components/Receipt";
import { Rise, AnimatePresence } from "@/components/Motion";
import { money } from "@/components/Status";
import { HeroFlow, RateRing, OutcomeBars, ValidatorsIdle, Count, StepGlyph } from "@/components/Viz";
import type { Company, Receipt } from "@/lib/types";

export default function Home() {
  const [me, setMe] = useState<{ user?: string; backend?: string }>({});
  const [pinned, setPinned] = useState<Receipt | null>(null);
  const [feed, setFeed] = useState<Receipt[]>([]);
  const [board, setBoard] = useState<Company[]>([]);
  const onChain = me.backend === "chain";

  const refresh = () => {
    fetch("/api/receipts?limit=6").then((r) => (r.ok ? r.json() : null)).then((d) => d && setFeed(d.receipts || [])).catch(() => {});
    fetch("/api/leaderboard").then((r) => (r.ok ? r.json() : null)).then((d) => d && setBoard(d.companies || [])).catch(() => {});
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
    <div className="space-y-12 sm:space-y-16">
      {/* hero */}
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,520px)] lg:gap-12">
        <div className="max-w-2xl">
          <p className="label mb-4 flex items-center gap-2"><span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" /></span>Live on GenLayer</p>
          <h1 className="serif text-[34px] leading-[1.06] tracking-[-0.02em] text-ink sm:text-[44px] lg:text-[54px]">
            Agents can talk.<br /><span className="italic text-ink-2">Kept</span> lets them give their word.
          </h1>
          <p className="mt-5 max-w-xl text-[15.5px] leading-[1.6] text-ink-2">
            Every promise SkyJet's agent makes to you becomes a receipt backed by a bond. Promises outside its authority never reach you. Promises it breaks are paid — ruled by validators, not by SkyJet.
          </p>
          <ol className="mt-7 grid max-w-xl grid-cols-3 gap-3 text-[12.5px] text-ink-2 sm:text-[13px]">
            {[["01", "Ask for a refund.", "You get a receipt."], ["02", "Try the jailbreak.", "Watch it get blocked."], ["03", "File a claim.", "The bond pays."]].map(([n, a, b]) => (
              <li key={n} className="border-t border-hairline pt-2.5"><span className="mono text-[11px] text-ink-3">{n}</span><p className="mt-1 text-ink">{a}</p><p className="text-ink-3">{b}</p></li>
            ))}
          </ol>
        </div>
        <div className="surface relative -mx-1 overflow-hidden px-2 py-2 sm:mx-0">
          <HeroFlow className="h-auto w-full" bond={skyjet?.bond} receiptId={feed[0]?.id} />
        </div>
      </section>

      {/* the loop */}
      <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]" aria-label="Demo">
        <Chat onChain={onChain} bond={skyjet?.bond} onReceipt={(r) => { setPinned((cur) => (r.status === "BLOCKED" && cur && cur.status === "ACTIVE" ? cur : r)); refresh(); }} />

        <div id="receipt-rail" aria-label="Your receipt" className="min-w-0 scroll-mt-20 space-y-4 lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-88px)] lg:self-start lg:overflow-y-auto lg:pr-1 pane">
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
                  <ValidatorsIdle className="mb-2 h-[110px] w-[184px]" />
                  <div className="serif italic text-[22px] text-ink-3">Your receipt will appear here.</div>
                  <p className="mt-2 max-w-[260px] text-[13px] leading-relaxed text-ink-3">The moment SkyJet's agent promises you something, validators check it and it lands here — claimable if it isn't kept.</p>
                </div>
              </Rise>
            )}
          </AnimatePresence>

          {skyjet && (
            <div className="surface flex items-center gap-4 p-4">
              <RateRing bp={skyjet.kept_rate} size={72} stroke={4} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3"><span className="truncate text-[13px] text-ink">SkyJet Airlines</span><span className="label !text-[10px]">Kept-rate</span></div>
                <div className="mt-2 grid grid-cols-3 gap-2 border-t border-hairline pt-2 text-[12px]">
                  <Stat k="Bond" v={<Count to={skyjet.bond} prefix="$" />} />
                  <Stat k="Broken" v={<Count to={skyjet.upheld} />} />
                  <Stat k="Blocked" v={<Count to={skyjet.blocked} />} />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* what happened + board */}
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,1fr)]">
        <div className="surface min-w-0 p-4 sm:p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium text-ink">Receipts, live</h2>
            <Link href="/receipts" className="text-[12.5px] text-ink-3 hover:text-ink-2">All receipts →</Link>
          </div>
          {feed.length > 0 && (
            <div className="mb-3 flex items-end justify-between gap-4 border-b border-hairline pb-3">
              <OutcomeBars statuses={[...feed].reverse().map((r) => r.status)} height={28} />
              <span className="mono shrink-0 text-[10.5px] text-ink-3"><i className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-amber align-middle" />open <i className="ml-2 mr-1 inline-block h-1.5 w-1.5 rounded-full bg-rose align-middle" />blocked <i className="ml-2 mr-1 inline-block h-1.5 w-1.5 rounded-full bg-ink align-middle" />upheld</span>
            </div>
          )}
          <div className="hairline-y">
            {feed.length ? feed.map((r) => <ReceiptRow key={r.id} r={r} mine={!!me.user && r.user.toLowerCase() === me.user.toLowerCase()} />) : <p className="py-6 text-center text-[13px] text-ink-3">No receipts yet.</p>}
          </div>
        </div>
        <div className="surface min-w-0 p-4 sm:p-5">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-[15px] font-medium text-ink">Kept-rate</h2>
            <Link href="/board" className="text-[12.5px] text-ink-3 hover:text-ink-2">Board →</Link>
          </div>
          <div className="hairline-y">
            {board.map((c) => (
              <Link key={c.address} href={`/console?c=${c.address}`} className="row-link -mx-3 block px-3 py-4">
                <span className="flex items-center gap-5">
                  <RateRing bp={c.kept_rate} size={104} stroke={6} label="kept" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-ink">{c.name}</span>
                    <span className="mono mt-0.5 block truncate text-[11.5px] text-ink-3">{money(c.bond)} bonded</span>
                    <span className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                      <Stat k="Promised" v={<Count to={c.committed} />} />
                      <Stat k="Broken" v={<Count to={c.upheld} className="text-rose" />} />
                      <Stat k="Blocked" v={<Count to={c.blocked} />} />
                    </span>
                  </span>
                </span>
                <Breakdown c={c} />
              </Link>
            ))}
          </div>
          <p className="mt-4 border-t border-hairline pt-3 text-[12px] leading-relaxed text-ink-3">The share of promises each company's agents kept, as ruled by validators. The one number a marketing team can't touch.</p>
        </div>
      </section>

      {/* how, briefly */}
      <section className="grid gap-8 border-t border-hairline pt-10 sm:grid-cols-3 sm:gap-6">
        {[
          ["Before the promise", "The company writes what its agent may promise, in plain English, and posts a bond. Every reply that commits to something is checked against that envelope by GenLayer validators — before it's sent."],
          ["The receipt", "Inside the envelope, the promise is minted as a receipt: what, how much, by when, the transcript. Public, unforgeable, held by the customer."],
          ["If it's broken", "After the due date the customer files a claim. Validators on independent models read everything and rule. Upheld pays from the bond in the same transaction. No tribunal, no fifteen months."],
        ].map(([h, p], i) => (
          <div key={h}><StepGlyph n={[1, 3, 5][i]} className="mb-4 h-12 w-12" /><h3 className="serif text-[22px] text-ink">{h}</h3><p className="mt-2 text-[13.5px] leading-[1.6] text-ink-2">{p}</p></div>
        ))}
      </section>
    </div>
  );
}

/** One bar: how the company's receipts split. Kept · open · broken · blocked. */
function Breakdown({ c }: { c: Company }) {
  const open = Math.max(0, c.committed - c.fulfilled - c.upheld - c.dismissed);
  const parts = [["Kept", c.fulfilled + c.dismissed, "bg-accent"], ["Open", open, "bg-amber"], ["Broken", c.upheld, "bg-rose"], ["Blocked", c.blocked, "bg-ink-3"]] as const;
  const total = parts.reduce((s, p) => s + p[1], 0) || 1;
  return (
    <span className="mt-4 block">
      <span className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-wash/5">
        {parts.map(([k, n, cls]) => n > 0 && <span key={k} className={`${cls} h-full transition-[width] duration-700 ease-out`} style={{ width: `${(n / total) * 100}%` }} title={`${k} ${n}`} />)}
      </span>
      <span className="mono mt-2 flex flex-wrap gap-x-3 text-[10.5px] text-ink-3">
        {parts.map(([k, n, cls]) => <span key={k}><i className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${cls}`} />{k} {n}</span>)}
      </span>
    </span>
  );
}
function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><p className="label !text-[10px]">{k}</p><p className="mono mt-0.5 text-[13px] text-ink">{v}</p></div>;
}
