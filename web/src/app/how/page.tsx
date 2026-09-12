import Link from "next/link";

const steps = [
  ["The envelope", "A company writes what its agent may promise, in plain English, and posts a bond in the Kept contract on GenLayer.", "Refunds up to $500 per customer. Fee waivers up to $50. Reschedules up to 30 days at no charge. Nothing else."],
  ["The check", "kept.wrap() sits around the agent. When a reply commits to something, the contract asks GenLayer validators — independent models, none chosen by the company — whether it sits inside the envelope. Inside: a receipt is minted and attached. Outside: the reply is replaced. The jailbreak never lands.", null],
  ["The receipt", "Promise, amount, due date, transcript, company, status. A public URL the company can't edit and the customer can't lose.", null],
  ["The claim", "The company marks it kept, with proof. If it doesn't, once the date passes the customer files a claim. Validators read the transcript, the proof and the evidence, and rule.", null],
  ["The payout", "Upheld moves the amount from the bond to the customer in the same transaction, and lowers the company's public Kept-rate. Moffatt v. Air Canada took fifteen months and a tribunal for C$812. This takes one block.", null],
];

export default function How() {
  return (
    <div className="mx-auto max-w-3xl space-y-14">
      <header>
        <h1 className="serif text-[34px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px]">How Kept works</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.6] text-ink-2">AI agents now speak for companies, and courts have ruled that what they say binds the company. Kept makes that enforceable at chat speed — and puts the guardrail before the promise, not after the lawsuit.</p>
      </header>

      <ol className="space-y-0 border-t border-hairline">
        {steps.map(([h, p, q], i) => (
          <li key={h} className="grid gap-2 border-b border-hairline py-6 md:grid-cols-[72px_1fr] md:gap-4 md:py-7">
            <span className="mono text-[13px] text-ink-3">0{i + 1}</span>
            <div>
              <h2 className="serif text-[24px] text-ink">{h}</h2>
              <p className="mt-2 text-[14px] leading-[1.65] text-ink-2">{p}</p>
              {q && <blockquote className="serif mt-4 border-l-2 border-accent pl-4 text-[18px] italic leading-[1.4] text-ink">{q}</blockquote>}
            </div>
          </li>
        ))}
      </ol>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="surface p-6">
          <h2 className="text-[15px] font-medium text-ink">Why this needs GenLayer</h2>
          <ul className="mt-3 space-y-3 text-[13.5px] leading-[1.6] text-ink-2">
            <li>"Inside the envelope?" and "was it honored?" are judgments, not lookups. A plain smart contract can't make them; a single model run by the company is a judge in its own case.</li>
            <li>Optimistic Democracy runs the same prompt across validators on different models and stores only what the majority agrees on. The validator compares the decision field alone — never the prose.</li>
            <li>The verdict and the money live in the same place. Upheld triggers the transfer from the bond in the same transaction.</li>
          </ul>
        </div>
        <div className="surface p-6">
          <h2 className="text-[15px] font-medium text-ink">Not Internet Court</h2>
          <p className="mt-3 text-[13.5px] leading-[1.6] text-ink-2">Internet Court resolves disputes between agents. Kept covers the person on the other end of the chat: the promise is checked and receipted before it's made, the bond is posted before anything goes wrong, and the customer never files anything unless the company fails.</p>
          <div className="mt-6 flex gap-2">
            <Link href="/" className="btn btn-primary">Try the demo</Link>
            <Link href="/board" className="btn btn-secondary">See the board</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
