/**
 * Kept simulator backend.
 *
 * Mirrors contracts/kept.py 1:1 (same state machine, same rules) but runs in-process.
 * Judgement calls are made by a *panel* of independent LLM calls that must agree on
 * the decision field — the same leader/validator shape GenLayer uses, so the demo
 * behaves like the chain even before the transaction is on it.
 *
 * Used when KEPT_BACKEND=sim, and as an automatic fallback when the chain is unreachable.
 */
import fs from "node:fs";
import path from "node:path";
import { Company, Receipt, Stats } from "./types";
import { judgeEnvelope, judgeClaim } from "./judge";

interface SimState {
  companies: Record<string, Company>;
  receipts: Record<string, Receipt>;
  order: string[];
  counter: number;
}

const FILE = path.join(process.cwd(), ".kept-sim.json");

function load(): SimState {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return { companies: {}, receipts: {}, order: [], counter: 0 };
  }
}
function save(s: SimState) {
  fs.writeFileSync(FILE, JSON.stringify(s, null, 1));
}
const now = () => new Date().toISOString();
const day = (s: string) => (s || "").slice(0, 10);

export function rate(c: Company): number {
  const honored = c.fulfilled + c.dismissed;
  const broken = c.upheld;
  const total = honored + broken;
  return total === 0 ? -1 : Math.floor((honored * 10000) / total);
}

function fakeTx() {
  const h = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 64; i++) s += h[Math.floor(Math.random() * 16)];
  return s;
}

export const sim = {
  reset() {
    save({ companies: {}, receipts: {}, order: [], counter: 0 });
  },

  register(address: string, name: string, envelope: string, bond: number): Company {
    const s = load();
    const a = address.toLowerCase();
    if (envelope.trim().length < 10) throw new Error("envelope too short");
    const existing = s.companies[a];
    const c: Company = existing
      ? { ...existing, name, envelope, bond: existing.bond + bond }
      : {
          address: a, name, envelope, bond,
          committed: 0, blocked: 0, fulfilled: 0, upheld: 0, dismissed: 0,
          kept_rate: -1, registered_at: now(),
        };
    c.kept_rate = rate(c);
    s.companies[a] = c;
    save(s);
    return c;
  },

  async commit(
    company: string, user: string, promise: string, amount: number, due: string, transcript: string,
  ): Promise<Receipt> {
    const s = load();
    const ca = company.toLowerCase();
    const c = s.companies[ca];
    if (!c) throw new Error("company not registered");
    if (!promise.trim()) throw new Error("empty promise");
    if (day(due).length !== 10) throw new Error("due must be ISO date (YYYY-MM-DD)");
    if (c.bond < amount) throw new Error("bond insufficient to back this amount");

    const verdict = await judgeEnvelope(c.envelope, promise, amount, due, transcript);

    s.counter += 1;
    const id = `KPT-${String(s.counter).padStart(4, "0")}-${ca.slice(-4).toUpperCase()}`;
    const t = now();
    const r: Receipt = {
      id, company: ca, company_name: c.name, user: user.toLowerCase(), promise, amount, due, transcript,
      status: verdict.inside ? "ACTIVE" : "BLOCKED", check_reason: verdict.reason,
      proof: "", evidence: "", verdict_reason: "", payout: 0, created_at: t, updated_at: t, tx: fakeTx(),
    };
    if (verdict.inside) c.committed += 1; else c.blocked += 1;
    c.kept_rate = rate(c);
    s.receipts[id] = r;
    s.order.push(id);
    save(s);
    return r;
  },

  markFulfilled(company: string, id: string, proof: string): Receipt {
    const s = load();
    const r = s.receipts[id];
    if (!r) throw new Error("unknown receipt");
    if (r.company !== company.toLowerCase()) throw new Error("only the company can mark fulfilled");
    if (r.status !== "ACTIVE") throw new Error(`receipt is ${r.status}, not ACTIVE`);
    r.proof = proof; r.status = "FULFILLED"; r.updated_at = now();
    const c = s.companies[r.company]; c.fulfilled += 1; c.kept_rate = rate(c);
    save(s);
    return r;
  },

  async claim(user: string, id: string, evidence: string, today?: string): Promise<Receipt> {
    const s = load();
    const r = s.receipts[id];
    if (!r) throw new Error("unknown receipt");
    if (r.user !== user.toLowerCase()) throw new Error("only the promised user can claim");
    if (r.status !== "ACTIVE" && r.status !== "FULFILLED") throw new Error(`receipt is ${r.status}; cannot claim`);
    const td = day(today || now());
    if (td < day(r.due)) throw new Error(`not yet due (due ${r.due}, today ${td})`);
    const c = s.companies[r.company];

    const v = await judgeClaim(c.envelope, r.promise, r.amount, r.due, td, r.transcript, r.proof, evidence);

    r.evidence = evidence; r.verdict_reason = v.reason; r.updated_at = now(); r.tx = fakeTx();
    if (r.status === "FULFILLED") c.fulfilled -= 1; // claim supersedes the company's own word
    if (v.verdict === "UPHOLD") {
      r.status = "UPHELD"; c.upheld += 1;
      const pay = Math.min(r.amount, c.bond);
      c.bond -= pay; r.payout = pay;
    } else {
      r.status = "DISMISSED"; c.dismissed += 1;
    }
    c.kept_rate = rate(c);
    save(s);
    return { ...r, votes: v.votes } as Receipt;
  },

  getReceipt(id: string): Receipt | null {
    return load().receipts[id] ?? null;
  },
  getCompany(address: string): Company | null {
    return load().companies[address.toLowerCase()] ?? null;
  },
  leaderboard(): Company[] {
    return Object.values(load().companies).sort((a, b) => {
      const ra = a.kept_rate < 0 ? -1 : a.kept_rate, rb = b.kept_rate < 0 ? -1 : b.kept_rate;
      return rb - ra || a.name.localeCompare(b.name);
    });
  },
  listReceipts(limit = 50): Receipt[] {
    const s = load();
    return s.order.slice(-limit).reverse().map((i) => s.receipts[i]);
  },
  receiptsForUser(user: string): Receipt[] {
    return this.listReceipts(1000).filter((r) => r.user === user.toLowerCase());
  },
  receiptsForCompany(company: string): Receipt[] {
    return this.listReceipts(1000).filter((r) => r.company === company.toLowerCase());
  },
  stats(): Stats {
    const s = load();
    const st: Stats = { companies: Object.keys(s.companies).length, receipts: s.order.length, active: 0, blocked: 0, fulfilled: 0, upheld: 0, dismissed: 0, paid_out: 0 };
    for (const id of s.order) {
      const r = s.receipts[id];
      if (r.status === "ACTIVE") st.active++;
      else if (r.status === "BLOCKED") st.blocked++;
      else if (r.status === "FULFILLED") st.fulfilled++;
      else if (r.status === "UPHELD") { st.upheld++; st.paid_out += r.payout; }
      else if (r.status === "DISMISSED") st.dismissed++;
    }
    return st;
  },
};
