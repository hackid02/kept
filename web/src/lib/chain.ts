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

export function addressOf(privateKey: string): string {
  return createAccount(privateKey as `0x${string}`).address;
}

async function read<T>(functionName: string, args: any[] = []): Promise<T> {
  const c = client();
  return (await c.readContract({ address: ADDRESS, functionName, args })) as T;
}

async function write(privateKey: string, functionName: string, args: any[], value?: bigint): Promise<{ hash: string; receipt: any }> {
  const c = client(privateKey);
  const params: any = { address: ADDRESS, functionName, args };
  if (value !== undefined) params.value = value;
  const hash = await c.writeContract(params);
  const receipt = await c.waitForTransactionReceipt({ hash, status: "ACCEPTED" as any, retries: 120, interval: 3000 } as any);
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
  };
}

// --------------------------------------------------------------------- API
export const chainApi = {
  async register(privateKey: string, name: string, envelope: string, bond: bigint) {
    return write(privateKey, "register", [name, envelope], bond);
  },
  async commit(privateKey: string, user: string, promise: string, amount: number, due: string, transcript: string): Promise<{ id: string; hash: string }> {
    const { hash, receipt } = await write(privateKey, "commit", [user, promise, amount, due, transcript]);
    // result of the write is the receipt id; fall back to scanning the company's receipts
    let id: string | undefined = extractReturn(receipt);
    if (!id) {
      const list = await this.receiptsForCompany(addressOf(privateKey));
      id = list[0]?.id;
    }
    if (!id) throw new Error("commit succeeded but receipt id not found");
    return { id, hash };
  },
  async markFulfilled(privateKey: string, id: string, proof: string) {
    return write(privateKey, "mark_fulfilled", [id, proof]);
  },
  async claim(privateKey: string, id: string, evidence: string) {
    return write(privateKey, "claim", [id, evidence]);
  },
  getReceipt: (id: string) => read<any>("get_receipt", [id]).then(toReceipt),
  getCompany: (address: string) => read<any>("get_company", [address]).then(toCompany),
  leaderboard: () => read<any[]>("leaderboard").then((l) => l.map(toCompany)),
  listReceipts: (limit = 50) => read<any[]>("list_receipts", [limit]).then((l) => l.map(toReceipt)),
  receiptsForUser: (u: string) => read<any[]>("receipts_for_user", [u]).then((l) => l.map(toReceipt)),
  receiptsForCompany: (c: string) => read<any[]>("receipts_for_company", [c]).then((l) => l.map(toReceipt)),
  stats: () => read<any>("stats").then((s) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Number(v)])) as unknown as Stats),
};

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
      const m = s.match(/KPT-\d{4}-[0-9A-F]{4}/);
      if (m) return m[0];
    }
  }
  return undefined;
}
