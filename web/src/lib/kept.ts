/**
 * Kept backend facade. Picks chain (real GenLayer contract) or sim (in-process twin).
 *   KEPT_BACKEND=chain|sim   (default: chain if KEPT_CONTRACT is set, else sim)
 * Every call reports which backend served it so the UI can show it honestly.
 */
import { chainApi, chainConfigured, companyKey, userKey, addressOf, chainName } from "./chain";
import { sim } from "./sim";
import type { Backend, Company, Receipt, Stats } from "./types";

export const DEMO_COMPANY_ADDRESS = "0x5c1e7a1a11e5b0d3f8b4c2d1e0a9f8e7d6c5b4a3";  // sim-only pseudo address
export const DEMO_USER_ADDRESS = "0xc057e0a3b5d7f9e1c3a5b7d9f1e3a5c7b9d1f3b0";

export function backend(): Backend {
  const forced = process.env.KEPT_BACKEND as Backend | undefined;
  if (forced) return forced;
  return chainConfigured ? "chain" : "sim";
}
export function backendInfo() {
  return { backend: backend(), network: backend() === "chain" ? chainName() : "sim", contract: process.env.KEPT_CONTRACT || null };
}

export function companyAddress(): string {
  if (backend() === "chain" && companyKey()) return addressOf(companyKey()!);
  return DEMO_COMPANY_ADDRESS;
}
export function defaultUserAddress(): string {
  if (backend() === "chain" && userKey()) return addressOf(userKey()!);
  return DEMO_USER_ADDRESS;
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
    return backend() === "chain" ? chainApi.leaderboard() : sim.leaderboard();
  },
  async listReceipts(limit = 50): Promise<Receipt[]> {
    return backend() === "chain" ? chainApi.listReceipts(limit) : sim.listReceipts(limit);
  },
  async receiptsForUser(u: string): Promise<Receipt[]> {
    return backend() === "chain" ? chainApi.receiptsForUser(u) : sim.receiptsForUser(u);
  },
  async receiptsForCompany(c: string): Promise<Receipt[]> {
    return backend() === "chain" ? chainApi.receiptsForCompany(c) : sim.receiptsForCompany(c);
  },
  async stats(): Promise<Stats> {
    return backend() === "chain" ? chainApi.stats() : sim.stats();
  },

  // ---- writes (server-held demo keys; wallet-signed writes go straight from the browser)
  async commit(user: string, promise: string, amount: number, due: string, transcript: string): Promise<Receipt> {
    if (backend() === "chain") {
      const key = companyKey(); if (!key) throw new Error("KEPT_COMPANY_KEY not set");
      const { id, hash } = await chainApi.commit(key, user, promise, amount, due, transcript);
      const r = await chainApi.getReceipt(id); return { ...r, tx: hash };
    }
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
  async claim(id: string, evidence: string, today?: string): Promise<Receipt> {
    if (backend() === "chain") {
      const key = userKey(); if (!key) throw new Error("connect a wallet to claim (or set KEPT_USER_KEY)");
      const { hash } = await chainApi.claim(key, id, evidence);
      const r = await chainApi.getReceipt(id); return { ...r, tx: hash };
    }
    return sim.claim(defaultUserAddress(), id, evidence, today);
  },
  async registerDemoCompany(name: string, envelope: string, bond: number): Promise<Company> {
    if (backend() === "chain") {
      const key = companyKey(); if (!key) throw new Error("KEPT_COMPANY_KEY not set");
      await chainApi.register(key, name, envelope, BigInt(bond));
      return chainApi.getCompany(addressOf(key));
    }
    return sim.register(companyAddress(), name, envelope, bond);
  },
};
