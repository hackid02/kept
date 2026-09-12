"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <p className="mono text-[12px] text-ink-3">Error{error.digest ? ` · ${error.digest}` : ""}</p>
      <h1 className="serif mt-3 text-[34px] leading-[1.1] text-ink">Something broke on our side.</h1>
      <p className="mt-3 text-[14px] leading-relaxed text-ink-2">The receipts themselves live on GenLayer and are unaffected. Try again; if it keeps happening, the chain RPC is probably rate-limiting and the page will recover on its own.</p>
      <div className="mt-7 flex gap-2">
        <button onClick={reset} className="btn btn-primary">Try again</button>
        <Link href="/" className="btn btn-secondary">Back to the demo</Link>
      </div>
    </div>
  );
}
