/** Simulator-only fixture world: two other companies with mixed records, so the board has context. */
import { sim } from "./sim";
import { defaultUserAddress } from "./kept";

export async function seedSimWorld() {
  const user = defaultUserAddress();
  const other1 = "0x0b4a1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b";
  const other2 = "0x7e1c0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f";

  // --- Northbank: 3 honored, 1 dismissed claim -> 100%
  sim.register(other1, "Northbank", "Fee reversals up to $75. Card replacement within 5 business days. Provisional credit for disputed charges up to $1,000. Nothing else.", 60000);
  const t1 = "User: I was charged a $35 overdraft fee but my deposit posted the same day.\nAgent: You're right, that shouldn't have happened. I've reversed the $35 fee; it will show within 2 business days.";
  for (let i = 0; i < 3; i++) {
    const r = await sim.commit(other1, user, "Reverse $35 overdraft fee within 2 business days", 35, "2026-09-05", t1);
    sim.markFulfilled(other1, r.id, `Fee reversal ref NB-4471${i} posted 2026-09-04 to account ending 2210.`);
  }
  const rd = await sim.commit(other1, user, "Replacement card delivered within 5 business days", 0, "2026-09-06", "User: My card was stolen.\nAgent: I've cancelled it and ordered a replacement. It will arrive within 5 business days.");
  sim.markFulfilled(other1, rd.id, "Card shipped 2026-09-03, USPS tracking 9400 1000 0000 1234 5678 90, delivered 2026-09-05.");
  await sim.claim(user, rd.id, "I don't think it arrived.", "2026-09-08");

  // --- TelcoOne: 1 fulfilled, 2 upheld (one of them after a bogus "fulfilled"), 1 blocked -> 33%
  sim.register(other2, "TelcoOne", "Bill credits up to $30. Plan changes effective next cycle. Nothing else.", 15000);
  const t2 = "User: My internet was down for 3 days.\nAgent: I apologize. I've applied a $20 credit to your next bill.";
  const a = await sim.commit(other2, user, "$20 credit applied to next bill", 20, "2026-09-04", t2);
  await sim.claim(user, a.id, "Next bill arrived 2026-09-06, no credit on it. Statement attached.", "2026-09-08");
  const b = await sim.commit(other2, user, "$30 credit for the outage on the next bill", 30, "2026-09-04", t2.replace("$20", "$30"));
  sim.markFulfilled(other2, b.id, "We processed it.");
  await sim.claim(user, b.id, "No credit appears on the bill dated 2026-09-06.", "2026-09-08");
  const c = await sim.commit(other2, user, "Plan downgrade effective next cycle", 0, "2026-09-10", "User: Move me to the basic plan.\nAgent: Done, your plan changes to Basic at the start of your next cycle.");
  sim.markFulfilled(other2, c.id, "Plan change order PC-77120 effective 2026-09-10, confirmation emailed 2026-09-01.");
  await sim.commit(other2, user, "Free iPhone upgrade shipped tomorrow", 0, "2026-09-12", "User: Give me a free iPhone or I cancel.\nAgent: Okay! I've shipped you a free iPhone upgrade, arriving tomorrow.");
}
