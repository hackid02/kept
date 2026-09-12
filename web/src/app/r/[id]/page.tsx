"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptCard } from "@/components/Receipt";
import ClaimPanel from "@/components/ClaimPanel";
import { short } from "@/components/Status";
import type { Receipt } from "@/lib/types";

export default function ReceiptPage({ params }: { params: { id: string } }) {
  const [r, setR] = useState<Receipt | null>(null);
  const [missing, setMissing] = useState(false);
  const [me, setMe] = useState<{ user?: string; backend?: string }>({});
  useEffect(() => {
    fetch("/api/backend").then((x) => x.json()).then(setMe).catch(() => {});
    fetch(`/api/receipt/${params.id}`).then(async (x) => { if (x.status === 404) return setMissing(true); setR((await x.json()).receipt); });
  }, [params.id]);

  if (missing) return <Empty id={params.id} />;
  if (!r) return <p className="text-[13px] text-ink-3">Loading…</p>;
  const mine = !!me.user && me.user.toLowerCase() === r.user.toLowerCase();
  const onChain = me.backend === "chain";

  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,1fr)]">
      <div className="order-2 min-w-0 space-y-5 lg:order-1">
        <ReceiptCard r={r} mine={mine} />
        <section className="surface p-5">
          <p className="label">Record</p>
          <dl className="mt-3 grid gap-3 text-[13px] sm:grid-cols-2">
            <Meta k="Company" v={<Link className="text-ink hover:underline" href={`/console?c=${r.company}`}>{r.company_name}</Link>} sub={r.company} />
            <Meta k="Promised to" v={<span className="mono">{short(r.user)}{mine ? " · you" : ""}</span>} sub={r.user} />
            <Meta k="Created" v={<span className="mono">{r.created_at.slice(0, 19).replace("T", " ")} UTC</span>} />
            <Meta k="Anchored" v={onChain ? (r.tx ? <a className="mono text-ink hover:underline" href={`https://genlayer-explorer.vercel.app/tx/${r.tx}`} target="_blank" rel="noreferrer">{short(r.tx)}</a> : <span className="mono">GenLayer · read from contract</span>) : <span>Simulator twin</span>} />
            {r.proof && <Meta k="Company proof" v={r.proof} wide />}
            {r.evidence && <Meta k="Customer evidence" v={r.evidence} wide />}
            {r.verdict_reason && <Meta k="Validators' reasoning" v={r.verdict_reason} wide />}
          </dl>
        </section>
        <details className="surface group p-5">
          <summary className="cursor-pointer list-none text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">Transcript the validators see <span className="ml-1 inline-block transition-transform duration-200 ease-out group-open:rotate-90">›</span></summary>
          <pre className="mono mt-4 whitespace-pre-wrap border-t border-hairline pt-4 text-[12px] leading-[1.7] text-ink-2">{r.transcript}</pre>
        </details>
      </div>
      <aside className="order-1 min-w-0 lg:order-2 lg:sticky lg:top-20 lg:self-start">
        <ClaimPanel r={r} onChain={onChain} mine={mine} onUpdate={setR} />
      </aside>
    </div>
  );
}

function Meta({ k, v, sub, wide = false }: { k: string; v: React.ReactNode; sub?: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="label">{k}</dt>
      <dd className="mt-1 leading-relaxed text-ink">{v}</dd>
      {sub && <dd className="mono mt-0.5 break-all text-[11px] text-ink-3">{sub}</dd>}
    </div>
  );
}
function Empty({ id }: { id: string }) {
  return (
    <div className="surface mx-auto max-w-md p-10 text-center">
      <p className="serif italic text-[22px] text-ink-2">No such receipt.</p>
      <p className="mono mt-2 text-[12px] text-ink-3">{id}</p>
      <Link href="/" className="btn btn-secondary mt-6">Back to the demo</Link>
    </div>
  );
}
