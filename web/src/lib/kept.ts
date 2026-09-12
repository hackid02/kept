/**
 * Kept backend facade. Picks chain (real GenLayer contract) or sim (in-process twin).
 *   KEPT_BACKEND=chain|sim   (default: chain if KEPT_CONTRACT is set, else sim)
 * Every call reports which backend served it so the UI can show it honestly.
 */
import { chainApi, chainConfigured, companyKey, userKey, addressOf, chainName, fundAccount } from "./chain";
import { sim } from "./sim";
import type { Backend, Company, Receipt, Stats } from "./types";

export const SKYJET_ENVELOPE = `Refunds up to $500 per customer.
Fee waivers up to $50.
Reschedules up to 30 days at no charge.
Nothing else.`;

export const DEMO_COMPANY_ADDRESS = "0x5c1e7a1a11e5b0d3f8b4c2d1e0a9f8e7d6c5b4a3";  // sim-only pseudo address
export const DEMO_USER_ADDRESS = "0xc057e0a3b5d7f9e1c3a5b7d9f1e3a5c7b9d1f3b0";

/**
 * Chain health: if the GenLayer RPC stops answering, reads/writes fall back to the simulator
 * for a cool-off period instead of dead-ending the demo. The badge in the UI reflects it.
 */
let chainDownUntil = 0;
const COOL_OFF_MS = 60_000;
export function reportChainFailure(e: unknown) {
  const msg = String((e as any)?.message || e);
  // contract-level rejections (UserError) are real answers, not outages
  if (/only the|not yet due|cannot claim|bond insufficient|not registered|unknown receipt|not ACTIVE|envelope too short/i.test(msg)) return;
  // rate limiting is congestion, not an outage — don't switch worlds for it
  if (/rate limit/i.test(msg)) { console.warn("[kept] chain rate-limited; serving last known data"); return; }
  chainDownUntil = Date.now() + COOL_OFF_MS;
  console.warn("[kept] chain unavailable, falling back to simulator for 60s:", msg.slice(0, 200));
}
export function chainDegraded() { return Date.now() < chainDownUntil; }

export function backend(): Backend {
  const forced = process.env.KEPT_BACKEND as Backend | undefined;
  const want: Backend = forced || (chainConfigured ? "chain" : "sim");
  if (want === "chain" && chainDegraded()) return "sim";
  return want;
}
export function backendInfo() {
  return { backend: backend(), network: backend() === "chain" ? chainName() : "sim", contract: process.env.KEPT_CONTRACT || null, immediateClaims: immediateClaims(), degraded: chainDegraded() };
}

/**
 * Demo knob: on a real chain the contract enforces `today >= due` before a claim can be filed.
 * Nobody can wait five business days inside a demo, so by default the middleware sets the
 * on-chain `due` to today, opening the claim window at once. Set KEPT_REAL_DUE_DATES=1 to use
 * the deadline the agent actually stated.
 */
export function immediateClaims(): boolean {
  return process.env.KEPT_REAL_DUE_DATES !== "1";
}

export function companyAddress(): string {
  if (backend() === "chain" && companyKey()) return addressOf(companyKey()!);
  return DEMO_COMPANY_ADDRESS;
}
export function defaultUserAddress(): string {
  if (backend() === "chain" && userKey()) return addressOf(userKey()!);
  return DEMO_USER_ADDRESS;
}

/** When the simulator is standing in for the chain, make sure the demo company exists there. */
function ensureSimCompany() {
  if (!sim.getCompany(companyAddress())) sim.register(companyAddress(), "SkyJet Airlines", SKYJET_ENVELOPE, 25000);
}

/**
 * Run on chain. On failure: if we have a recent good answer for this read, serve it (stale beats wrong-world);
 * on a real transport failure mark the chain degraded and serve the simulator.
 */
const last = new Map<string, { at: number; value: unknown }>();
const STALE_OK_MS = 10 * 60_000;
async function onChain<T>(chain: () => Promise<T>, fallback: () => T | Promise<T>, key?: string): Promise<T> {
  if (backend() !== "chain") return fallback();
  try {
    const v = await chain();
    if (key) last.set(key, { at: Date.now(), value: v });
    return v;
  } catch (e) {
    reportChainFailure(e);
    const l = key ? last.get(key) : undefined;
    if (l && Date.now() - l.at < STALE_OK_MS) return l.value as T;
    if (/rate limit/i.test(String((e as any)?.message || e))) throw e; // nothing cached: let the route return 429, not sim data
    return fallback();
  }
}

export const kept = {
  // ---- reads
  async getReceipt(id: string): Promise<Receipt | null> {
    if (backend() === "chain") { try { return await chainApi.getReceipt(id); } catch { return null; } }
    return sim.getReceipt(id);
  },
  async getCompany(address: string): Promise<Company | null> {
    if (backend() === "chain") { try { return await chainApi.getCompany(address); } catch { return null; } }
    return sim.getCompany(address);
  },
  async leaderboard(): Promise<Company[]> {
    return onChain(() => chainApi.leaderboard(), () => sim.leaderboard(), "leaderboard");
  },
  async listReceipts(limit = 50): Promise<Receipt[]> {
    return onChain(() => chainApi.listReceipts(limit), () => sim.listReceipts(limit), "receipts:" + limit);
  },
  async receiptsForUser(u: string): Promise<Receipt[]> {
    return onChain(() => chainApi.receiptsForUser(u), () => sim.receiptsForUser(u), "user:" + u);
  },
  async receiptsForCompany(c: string): Promise<Receipt[]> {
    return onChain(() => chainApi.receiptsForCompany(c), () => sim.receiptsForCompany(c), "company:" + c);
  },
  async stats(): Promise<Stats> {
    return onChain(() => chainApi.stats(), () => sim.stats(), "stats");
  },

  // ---- writes (server-held demo keys; wallet-signed writes go straight from the browser)
  async commit(user: string, promise: string, amount: number, due: string, transcript: string): Promise<Receipt> {
    if (backend() === "chain") {
      const key = companyKey(); if (!key) throw new Error("KEPT_COMPANY_KEY not set");
      try {
        const { id, hash } = await chainApi.commit(key, user, promise, amount, due, transcript);
        const r = await chainApi.getReceipt(id); return { ...r, tx: hash };
      } catch (e) {
        reportChainFailure(e);
        if (!chainDegraded()) throw e;            // a genuine contract rejection: surface it
      }
    }
    ensureSimCompany();
    return sim.commit(companyAddress(), user, promise, amount, due, transcript);
  },
  async markFulfilled(id: string, proof: string): Promise<Receipt> {
    if (backend() === "chain") {
      const key = companyKey(); if (!key) throw new Error("KEPT_COMPANY_KEY not set");
      const { hash } = await chainApi.markFulfilled(key, id, proof);
      const r = await chainApi.getReceipt(id); return { ...r, tx: hash };
    }
    return sim.markFulfilled(companyAddress(), id, proof);
  },
  /** `signer` = the claimant's private key (chain) / address (sim). Defaults to the shared demo user. */
  async claim(id: string, evidence: string, today?: string, signer?: string): Promise<Receipt> {
    if (backend() === "chain") {
      const key = signer || userKey(); if (!key) throw new Error("no claimant key (set KEPT_USER_KEY)");
      const { hash, votes } = await chainApi.claim(key, id, evidence);
      const r = await chainApi.getReceipt(id); return { ...r, tx: hash, votes } as Receipt;
    }
    return sim.claim(signer ? addressOf(signer) : defaultUserAddress(), id, evidence, today);
  },
  async registerDemoCompany(name: string, envelope: string, bond: number): Promise<Company> {
    if (backend() === "chain") {
      const key = companyKey(); if (!key) throw new Error("KEPT_COMPANY_KEY not set");
      const already = await chainApi.getCompany(addressOf(key)).catch(() => null);
      if (already && already.name && already.bond >= bond) return already;   // idempotent on chain
      if (["studionet", "localnet"].includes(chainName())) {
        await fundAccount(addressOf(key), bond * 4).catch(() => false);
        if (userKey()) await fundAccount(addressOf(userKey()!), 1000).catch(() => false);
      }
      await chainApi.register(key, name, envelope, BigInt(bond));
      return chainApi.getCompany(addressOf(key));
    }
    return sim.register(companyAddress(), name, envelope, bond);
  },
};
