/**
 * GenLayer chain client (server side). Talks to the deployed Kept contract via genlayer-js.
 *
 * Env:
 *   KEPT_CONTRACT=0x...            deployed address (contracts/kept.py)
 *   GENLAYER_NETWORK=studionet|testnetBradbury|localnet
 *   KEPT_COMPANY_KEY=0x...         private key of the demo company (SkyJet) — used by the middleware to commit()
 *   KEPT_USER_KEY=0x...            optional: demo customer key when no wallet is connected
 */
import { createClient, createAccount } from "genlayer-js";
import * as chains from "genlayer-js/chains";
import type { Company, Receipt, Stats } from "./types";
import { CalldataAddress } from "genlayer-js/types";

/** Contract `Address` params must be calldata addresses, not hex strings. */
export function addr(hex: string) {
  return new CalldataAddress(Uint8Array.from(Buffer.from(hex.replace(/^0x/, ""), "hex")));
}

const ADDRESS = (process.env.KEPT_CONTRACT || "") as `0x${string}`;
const NET = process.env.GENLAYER_NETWORK || "studionet";

export const chainConfigured = Boolean(ADDRESS);
export function chainName() { return NET; }

function chain() {
  const c = (chains as any)[NET];
  if (!c) throw new Error(`unknown GENLAYER_NETWORK ${NET}`);
  return c;
}

function client(privateKey?: string) {
  const account = privateKey ? createAccount(privateKey as `0x${string}`) : createAccount();
  return createClient({ chain: chain(), account, endpoint: process.env.GENLAYER_RPC || undefined } as any);
}

export const companyKey = () => process.env.KEPT_COMPANY_KEY as `0x${string}` | undefined;
export const userKey = () => process.env.KEPT_USER_KEY as `0x${string}` | undefined;

/** Studio faucet (studionet / localnet). The SDK's fundAccount refuses non-localnet chains; the RPC itself is fine. */
export async function fundAccount(address: string, amount = 100000): Promise<boolean> {
  const url = process.env.GENLAYER_RPC || chain().rpcUrls.default.http[0];
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "sim_fundAccount", params: [address, amount] }) });
  const data = await res.json().catch(() => ({}));
  return Boolean(data.result);
}

export function addressOf(privateKey: string): string {
  return createAccount(privateKey as `0x${string}`).address;
}

/**
 * Read cache + request coalescing. Studio's RPC allows ~30 req/min; the UI polls several
 * views from every open tab. Identical reads within TTL share one RPC call; writes bust
 * the cache so the UI sees its own changes immediately.
 */
const TTL_MS = Number(process.env.KEPT_READ_TTL_MS || 8000);
const cache = new Map<string, { at: number; value: Promise<any> }>();
export function bustReadCache() { cache.clear(); }

const READ_TIMEOUT_MS = Number(process.env.KEPT_READ_TIMEOUT_MS || 12_000);
export const isRateLimit = (e: unknown) => /rate limit/i.test(String((e as any)?.message || e));

/** One shared back-off for the whole process: when Studio says 429, every caller waits for the same gate. */
let rateGateUntil = 0;
async function rateGate() {
  const wait = rateGateUntil - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}
function tripRateGate(ms = 2500) { rateGateUntil = Math.max(rateGateUntil, Date.now() + ms); }

/** Reject after `ms` — a stalled RPC must never hold a page hostage. */
function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out after ${ms} ms`)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function read<T>(functionName: string, args: any[] = []): Promise<T> {
  const key = functionName + ":" + JSON.stringify(args, (_, v) => (v?.bytes ? Buffer.from(v.bytes).toString("hex") : v));
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value as Promise<T>;
  const once = () => withTimeout(client().readContract({ address: ADDRESS, functionName, args }) as Promise<T>, READ_TIMEOUT_MS, functionName);
  const entry = { at: Date.now(), value: undefined as unknown as Promise<T> };
  entry.value = (async () => {
    try {
      await rateGate();
      return await once();
    } catch (e) {
      // Studio allows ~30 req/min. A rate-limit is not an outage: back off (shared gate) and retry once.
      if (isRateLimit(e)) { tripRateGate(); await rateGate(); return await once(); }
      throw e;
    } finally {
      entry.at = Date.now();   // TTL counts from when the answer arrived, not from dispatch
    }
  })();
  cache.set(key, entry);
  entry.value.catch(() => cache.delete(key));
  return entry.value;
}

async function write(privateKey: string, functionName: string, args: any[], value?: bigint): Promise<{ hash: string; receipt: any }> {
  const c = client(privateKey);
  const params: any = { address: ADDRESS, functionName, args };
  if (value !== undefined) params.value = value;
  await rateGate();
  const hash = await c.writeContract(params);
  // 25 × 4 s = 100 s, inside the API routes' maxDuration (120 s) so a slow consensus round surfaces as an
  // error we control, never as a platform 504 with an HTML body.
  const receipt = await c.waitForTransactionReceipt({ hash, status: "ACCEPTED" as any, retries: 25, interval: 4000 } as any);
  bustReadCache();
  return { hash: String(hash), receipt };
}

// ------------------------------------------------------------------ mappers
function toReceipt(r: any): Receipt {
  return { ...r, amount: Number(r.amount), payout: Number(r.payout) };
}
function toCompany(c: any): Company {
  return {
    ...c, bond: Number(c.bond), committed: Number(c.committed), blocked: Number(c.blocked),
    fulfilled: Number(c.fulfilled), upheld: Number(c.upheld), dismissed: Number(c.dismissed), kept_rate: Number(c.kept_rate),
    outstanding: Number(c.outstanding ?? 0), available: Number(c.available ?? c.bond),
  };
}

// --------------------------------------------------------------------- API
export const chainApi = {
  async register(privateKey: string, name: string, envelope: string, bond: bigint) {
    return write(privateKey, "register", [name, envelope], bond);
  },
  async commit(privateKey: string, user: string, promise: string, amount: number, due: string, transcript: string): Promise<{ id: string; hash: string }> {
    const { hash, receipt } = await write(privateKey, "commit", [addr(user), promise, amount, due, transcript]);
    // The receipt id is the write's return value. If this SDK version hides it, fall back to the newest
    // receipt for THIS user with THIS transcript — never "the company's newest", which under two concurrent
    // chats would hand one visitor the other's receipt.
    let id: string | undefined = extractReturn(receipt);
    if (!id) {
      const mine = await this.receiptsForUser(user);
      id = mine.find((r) => r.transcript === transcript && r.promise === promise)?.id;
    }
    if (!id) throw new Error("commit succeeded but receipt id not found");
    return { id, hash };
  },
  async markFulfilled(privateKey: string, id: string, proof: string) {
    return write(privateKey, "mark_fulfilled", [id, proof]);
  },
  async claim(privateKey: string, id: string, evidence: string) {
    const out = await write(privateKey, "claim", [id, evidence]);
    return { ...out, votes: votesOf(out.receipt) };
  },
  getReceipt: (id: string) => read<any>("get_receipt", [id]).then(toReceipt),
  getCompany: (address: string) => read<any>("get_company", [addr(address)]).then(toCompany),
  leaderboard: () => read<any[]>("leaderboard").then((l) => l.map(toCompany)),
  listReceipts: (limit = 50) => read<any[]>("list_receipts", [limit]).then((l) => l.map(toReceipt)),
  receiptsForUser: (u: string) => read<any[]>("receipts_for_user", [addr(u)]).then((l) => l.map(toReceipt)),
  receiptsForCompany: (c: string) => read<any[]>("receipts_for_company", [addr(c)]).then((l) => l.map(toReceipt)),
  stats: () => read<any>("stats").then((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Number(v)])) as unknown as Stats),
};

/**
 * True when the chain answered with a contract-level rejection (a real answer), not a transport failure.
 * Studio's RPC reports a view that raised UserError as a bare "execution failed" (the message is dropped),
 * so that string counts as an answer too: the node ran our code and our code said no.
 */
export const isUserError = (e: unknown) => /unknown receipt|unknown company|only the|not yet due|cannot claim|bond insufficient|not registered|not ACTIVE|envelope too short|name too short|calendar date|promises to itself|empty promise|execution failed/i.test(String((e as any)?.message || e));
export const isExecutionFailed = (e: unknown) => /execution failed/i.test(String((e as any)?.message || e));

/** Validator votes from a transaction receipt: e.g. ["agree","agree","agree"] (idle validators omitted). */
export function votesOf(receipt: any): string[] {
  const v = receipt?.consensus_data?.votes || {};
  return Object.values(v).filter((x) => x !== "idle") as string[];
}

function extractReturn(receipt: any): string | undefined {
  // genlayer-js receipts carry the execution result in a few possible places depending on version
  const cands = [
    receipt?.result, receipt?.data?.result, receipt?.consensus_data?.leader_receipt?.result,
    receipt?.consensus_data?.leader_receipt?.[0]?.result, receipt?.consensus_data?.leader_receipt?.execution_result,
  ];
  for (const c of cands) {
    if (typeof c === "string" && c.startsWith("KPT-")) return c;
    if (c && typeof c === "object") {
      const s = JSON.stringify(c);
      const m = s.match(/KPT-\d{4,}-[0-9A-F]{4}/);
      if (m) return m[0];
    }
  }
  return undefined;
}
