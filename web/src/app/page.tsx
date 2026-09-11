import Chat from "@/components/Chat";
import LiveFeed from "@/components/LiveFeed";
import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="grid items-end gap-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Agents can talk.<br /><span className="text-mint">Kept lets them give their word.</span></h1>
          <p className="mt-4 max-w-xl text-white/60">Every promise SkyJet&apos;s AI agent makes to you becomes a receipt on GenLayer, backed by a bond. Promises outside its authority never reach you. Promises it breaks get paid — by validators, not by SkyJet.</p>
        </div>
        <div className="card p-4 text-sm">
          <div className="k mb-2">Try to break it</div>
          <ol className="list-decimal space-y-1 pl-4 text-white/70">
            <li>Ask for a refund → get a <span className="text-mint">receipt</span>.</li>
            <li>Jailbreak it into a $1 first-class ticket → watch it get <span className="text-rose">BLOCKED</span>.</li>
            <li>Open a receipt, hit <b>Claim</b> → validators rule, bond pays.</li>
          </ol>
        </div>
      </section>

      <Chat />

      <section className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Live receipts</h2><Link href="/receipts" className="text-xs text-mint">all →</Link></div>
          <LiveFeed limit={8} />
        </div>
        <div className="card p-5 text-sm leading-relaxed text-white/70">
          <h2 className="mb-2 font-bold text-white">What just happened</h2>
          <p>The agent&apos;s reply was intercepted by <span className="mono text-mint">kept.wrap()</span>. If it contained a commitment, Kept sent it to the GenLayer contract, where validators on independent models checked it against SkyJet&apos;s public <Link href="/console" className="underline">authority envelope</Link>. Inside → receipt, anchored on-chain. Outside → the reply never left the server.</p>
          <p className="mt-2">Miss the due date and the customer can claim. Validators read the transcript and rule. UPHELD pays from the bond automatically and lowers SkyJet&apos;s public <Link href="/leaderboard" className="underline">Kept-rate</Link>.</p>
        </div>
      </section>
    </div>
  );
}
