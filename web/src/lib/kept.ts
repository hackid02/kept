/**
 * Kept backend facade. Picks chain (real GenLayer contract) or sim (in-process twin).
 *   KEPT_BACKEND=chain|sim   (default: chain if KEPT_CONTRACT is set, else sim)
 * Every call reports which backend served it so the UI can show it honestly.
 */
import { chainApi, chainConfigured, companyKey, userKey, addressOf, chainName, fundAccount, isUserError, isRateLimit, isExecutionFailed } from "./chain";
import { sim } from "./sim";
import type { Backend, Company, Receipt, Stats } from "./types";

export const SKYJET_ENVELOPE = `Refunds up to $500 per customer.
Fee waivers up to $50.
Reschedules up to 30 days at no charge.
Nothing else.`;

export const DEMO_COMPANY_ADDRESS = "0x5c1e7a1a11e5b0d3f8b4c2d1e0a9f8e7d6c5b4a3";  // sim-only pseudo address
export const DEMO_USER_ADDRESS = "0xc057e0a3b5d7f9e1c3a5b7d9f1e3a5c7b9d1f3b0";

/**
 * Chain health. The backend never changes worlds at runtime: a deployment is either on chain or
 * on the simulator, full stop. When the GenLayer RPC misbehaves, READS are served from the last
 * good answer (marked stale) or fail with a clear 503/429 — and WRITES fail loudly. Silently
 * routing a visitor's next promise into a different backend than the one holding their receipt
 * would look exactly like data loss, which is the one thing a product about durable proof must
 * never do. `degradedSince` only drives the badge.
 */
let lastChainFailure = 0;
const DEGRADED_WINDOW_MS = 60_000;
export function reportChainFailure(e: unknown) {
  const msg = String((e as any)?.message || e);
  if (isUserError(e)) return;                                   // a contract-level rejection is a real answer
  if (isRateLimit(e)) { console.warn("[kept] chain rate-limited"); return; }   // congestion, not an outage
  lastChainFailure = Date.now();
  console.warn("[kept] chain read/write failed:", msg.slice(0, 200));
}
export function chainDegraded() { return Date.now() - lastChainFailure < DEGRADED_WINDOW_MS; }

export function backend(): Backend {
  const forced = process.env.KEPT_BACKEND as Backend | undefined;
  return forced || (chainConfigured ? "chain" : "sim");
}
export function backendInfo() {
  return { backend: backend(), network: backend() === "chain" ? chainName() : "sim", contract: process.env.KEPT_CONTRACT || null, immediateClaims: immediateClaims(), degraded: backend() === "chain" && chainDegraded() };
}

/** Errors the API layer maps to HTTP: 404 for a real "unknown", 429 for congestion, 503 for a stalled chain. */
export class KeptError extends Error {
  constructor(message: string, public status: 404 | 429 | 503 | 400) { super(message); }
}
export function toKeptError(e: unknown): KeptError {
  if (e instanceof KeptError) return e;
  const msg = String((e as any)?.message || e);
  if (/unknown receipt|unknown company/i.test(msg)) return new KeptError(msg, 404);
  if (isExecutionFailed(e)) return new KeptError("The contract rejected this request.", 400);
  if (isUserError(e)) return new KeptError(msg, 400);
  if (isRateLimit(e)) return new KeptError("GenLayer Studio is rate-limiting requests right now. Wait a few seconds and try again.", 429);
  return new KeptError("GenLayer Studio isn't answering right now. Your receipt is safe on chain — try again in a moment.", 503);
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

/**
 * Read on chain (or sim when that IS the backend). On a transport failure serve the last good answer for
 * this key, flagged stale via `asOf`, so the UI can say "as of 12:04" instead of pretending. With nothing
 * cached the error propagates as a KeptError (429/503) — never as data from a different world.
 */
const last = new Map<string, { at: number; value: unknown }>();
const STALE_OK_MS = 10 * 60_000;
export const staleAsOf = new WeakMap<object, number>();   // result object → timestamp of the answer it came from
async function onChain<T extends object>(chain: () => Promise<T>, simRead: () => T | Promise<T>, key: string): Promise<T> {
  if (backend() !== "chain") return simRead();
  try {
    const v = await chain();
    last.set(key, { at: Date.now(), value: v });
    return v;
  } catch (e) {
    reportChainFailure(e);
    const l = last.get(key);
    if (l && Date.now() - l.at < STALE_OK_MS) { const v = l.value as T; staleAsOf.set(v, l.at); return v; }
    throw toKeptError(e);
  }
}

export const kept = {
  // ---- reads. `null` means the chain answered "does not exist"; transport failures throw KeptError.
  // get_receipt / get_company raise for exactly one reason — "unknown" — so a contract-level failure on them means "does not exist".
  async getReceipt(id: string): Promise<Receipt | null> {
    if (backend() === "chain") {
      try { return await chainApi.getReceipt(id); }
      catch (e) { const k = toKeptError(e); if (k.status === 404 || k.status === 400) return null; reportChainFailure(e); throw k; }
    }
    return sim.getReceipt(id);
  },
  async getCompany(address: string): Promise<Company | null> {
    if (backend() === "chain") {
      try { return await chainApi.getCompany(address); }
      catch (e) { const k = toKeptError(e); if (k.status === 404 || k.status === 400) return null; reportChainFailure(e); throw k; }
    }
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
  // Writes never fall back: a promise is either on the chain this deployment points at, or it failed.
  async commit(user: string, promise: string, amount: number, due: string, transcript: string): Promise<Receipt> {
    if (backend() === "chain") {
      const key = companyKey(); if (!key) throw new Error("KEPT_COMPANY_KEY not set");
      try {
        await ensureDemoCompany();
        const { id, hash } = await chainApi.commit(key, user, promise, amount, due, transcript);
        const r = await chainApi.getReceipt(id); return { ...r, tx: hash };
      } catch (e) { reportChainFailure(e); throw toKeptError(e); }
    }
    await ensureDemoCompany();
    return sim.commit(companyAddress(), user, promise, amount, due, transcript);
  },
  async markFulfilled(id: string, proof: string): Promise<Receipt> {
    if (backend() === "chain") {
      const key = companyKey(); if (!key) throw new Error("KEPT_COMPANY_KEY not set");
      try {
        const { hash } = await chainApi.markFulfilled(key, id, proof);
        const r = await chainApi.getReceipt(id); return { ...r, tx: hash };
      } catch (e) { reportChainFailure(e); throw toKeptError(e); }
    }
    return sim.markFulfilled(companyAddress(), id, proof);
  },
  /** `signer` = the claimant's private key (chain) / address (sim). Defaults to the shared demo user. */
  async claim(id: string, evidence: string, today?: string, signer?: string): Promise<Receipt> {
    if (backend() === "chain") {
      const key = signer || userKey(); if (!key) throw new Error("no claimant key (set KEPT_USER_KEY)");
      try {
        const { hash, votes } = await chainApi.claim(key, id, evidence);
        const r = await chainApi.getReceipt(id); return { ...r, tx: hash, votes } as Receipt;
      } catch (e) { reportChainFailure(e); throw toKeptError(e); }
    }
    return sim.claim(signer ? addressOf(signer) : defaultUserAddress(), id, evidence, today);
  },
};

/**
 * The demo company must exist before the first promise. This is idempotent (a registered company is
 * returned as-is), serialised (concurrent first visitors share one registration), and called by the
 * middleware itself — so a visitor never sees a "Register SkyJet" button, and a transient read error
 * on page load cannot lock the chat.
 */
const DEMO_BOND = 25_000;
let registering: Promise<Company> | null = null;
export function ensureDemoCompany(): Promise<Company> {
  if (registering) return registering;
  registering = (async () => {
    try {
      if (backend() === "chain") {
        const key = companyKey(); if (!key) throw new Error("KEPT_COMPANY_KEY not set");
        const me = addressOf(key);
        const already = await chainApi.getCompany(me).catch((e) => { const st = toKeptError(e).status; if (st === 404 || st === 400) return null; throw e; });
        if (already?.name) return already;
        if (["studionet", "localnet"].includes(chainName())) {
          await fundAccount(me, DEMO_BOND * 4).catch(() => false);
          if (userKey()) await fundAccount(addressOf(userKey()!), 1000).catch(() => false);
        }
        await chainApi.register(key, "SkyJet Airlines", SKYJET_ENVELOPE, BigInt(DEMO_BOND));
        return await chainApi.getCompany(me);
      }
      return sim.getCompany(companyAddress()) || sim.register(companyAddress(), "SkyJet Airlines", SKYJET_ENVELOPE, DEMO_BOND);
    } finally {
      registering = null;
    }
  })();
  return registering;
}
