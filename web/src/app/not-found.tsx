import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <p className="mono text-[12px] text-ink-3">404</p>
      <h1 className="serif mt-3 text-[34px] leading-[1.1] text-ink">No such page.</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">Nothing was ever promised here. If you followed a receipt link, check the id — they look like <span className="mono text-ink">KPT-0004-2B94</span>.</p>
      <div className="mt-7 flex gap-2">
        <Link href="/" className="btn btn-primary">Back to the demo</Link>
        <Link href="/receipts" className="btn btn-secondary">All receipts</Link>
      </div>
    </div>
  );
}
