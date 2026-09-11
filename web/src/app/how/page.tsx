import Link from "next/link";

const steps = [
  { n: "01", t: "Company sets an envelope and posts a bond", d: "Plain English: “Refunds up to $500 per customer. Fee waivers up to $50. Reschedules up to 30 days at no charge. Nothing else.” The bond is real money locked in the Kept contract on GenLayer." },
  { n: "02", t: "Every commitment is checked before it reaches the human", d: "kept.wrap() intercepts the agent's reply. If it contains a promise, the contract asks GenLayer validators — independent models, none chosen by the company — whether the promise sits inside the envelope. Inside: a receipt is minted and attached to the message. Outside: the reply is replaced. The jailbreak never lands." },
  { n: "03", t: "The human holds a receipt", d: "Promise, amount, due date, transcript hash, company, status. Public URL. Can't be edited by the company, can't be lost by the customer." },
  { n: "04", t: "Kept, or claimed", d: "The company marks it fulfilled with proof. If it doesn't, once the due date passes the human files a claim. Validators read the transcript, the proof, the evidence — and rule UPHELD or DISMISSED." },
  { n: "05", t: "Paid from the bond, no lawyer, no tribunal", d: "UPHELD moves the promised amount from the bond to the human, automatically, and lowers the company's public Kept-rate. Moffatt v. Air Canada took 15 months and a tribunal for C$812. This takes one block." },
];

export default function How() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold">How Kept works</h1>
        <p className="mt-2 text-white/60">AI agents now speak for companies. Courts have already ruled that what they say binds the company. Kept makes that enforceable at chat speed — and makes the guardrail run <i>before</i> the promise, not after the lawsuit.</p>
      </div>
      <ol className="space-y-5">
        {steps.map((s) => (
          <li key={s.n} className="card flex gap-5 p-5">
            <div className="mono text-2xl font-extrabold text-mint">{s.n}</div>
            <div><div className="font-bold">{s.t}</div><p className="mt-1 text-sm leading-relaxed text-white/60">{s.d}</p></div>
          </li>
        ))}
      </ol>

      <section className="card p-6">
        <h2 className="font-bold">Why this needs GenLayer</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/70">
          <li>• <b className="text-white">“Was it inside the envelope?” and “was it honored?” are judgments</b>, not lookups. A plain smart contract can't make them; a single LLM run by the company is a judge in its own case.</li>
          <li>• GenLayer's Optimistic Democracy runs the same prompt across <b className="text-white">multiple validators on different models</b> and only stores what the majority agrees on. In <span className="mono">contracts/kept.py</span> the validator re-derives the answer and compares only the decision field (<span className="mono">inside</span> / <span className="mono">verdict</span>), never the free-text reasoning.</li>
          <li>• The verdict and the money live in the same place: <b className="text-white">UPHELD triggers the transfer</b> from the bond in the same transaction. No oracle, no multisig, no “we'll get back to you”.</li>
        </ul>
      </section>

      <section className="card p-6 text-sm text-white/70">
        <h2 className="font-bold text-white">Not Internet Court</h2>
        <p className="mt-2">Internet Court resolves disputes between agents. Kept covers the human on the other end of the chat: the promise is checked and receipted <i>before</i> it's made, the bond is posted <i>before</i> anything goes wrong, and the customer never has to file anything unless the company fails.</p>
      </section>

      <div className="flex gap-3">
        <Link href="/" className="btn-primary">Try the demo</Link>
        <Link href="/leaderboard" className="btn-ghost">See the Kept-rate board</Link>
      </div>
    </div>
  );
}
