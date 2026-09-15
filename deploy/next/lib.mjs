// Shared helpers for Studio Next (chain 61997 / 0xf22d).
//
// Studio Next runs GenVM v0.3 + consensus v0.6 with real fees: every write
// needs an explicit fee deposit, and any *outgoing transfer* the contract
// emits (Kept's payout on an UPHELD claim) must be pre-declared as a
// "message fee allocation". Studio's own simulator sizes that for us.
import fs from "node:fs";
import { createClient, createAccount, generatePrivateKey, isSuccessful, MessageType, encodeInternalMessageFeeParams, CALL_KEY_WILDCARD } from "genlayer-js";
import { studioDevnet } from "genlayer-js/chains";
import { CalldataAddress } from "genlayer-js/types";

export const RPC = process.env.GENLAYER_RPC || "https://studio-next.genlayer.com/api";
export const EXPLORER = "https://explorer-studio-dev.genlayer.com";
export const chain = { ...studioDevnet, rpcUrls: { default: { http: [RPC] } } };

export const J = (x, n) => JSON.stringify(x, (k, v) => (typeof v === "bigint" ? v.toString() : v), n);
export const addr = (hex) => new CalldataAddress(Uint8Array.from(Buffer.from(hex.replace(/^0x/, ""), "hex")));
export const gen = (wei) => (Number(wei) / 1e18).toFixed(4) + " GEN";

export async function rpc(method, params) {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  return r.json();
}

// The simulator's clock defaults to 2024 unless told otherwise; Kept's
// claim() checks due dates, so simulate at the current time.
const origFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  const body = init?.body && typeof init.body === "string" ? JSON.parse(init.body) : null;
  if (body?.method === "sim_call" && body.params?.[0] && !body.params[0].sim_config) {
    body.params[0].sim_config = { validators: [], genvm_datetime: new Date().toISOString() };
    init = { ...init, body: JSON.stringify(body) };
  }
  return origFetch(url, init);
};

export function account(pk) {
  const key = pk || process.env.DEPLOYER_PRIVATE_KEY || generatePrivateKey();
  return { key, account: createAccount(key) };
}

// Studio Next faucet: integer wei, ≤ 1e20 per call.
export async function fund(address, genAmount = 100) {
  let left = BigInt(genAmount) * 10n ** 18n;
  while (left > 0n) { const chunk = left > 10n ** 20n ? 10n ** 20n : left; await rpc("sim_fundAccount", [address, Number(chunk)]); left -= chunk; }
}

export function client(acct) { return createClient({ chain, account: acct }); }

export async function balance(address) { return BigInt((await rpc("eth_getBalance", [address, "latest"])).result || 0); }

// Fees for a write that emits no messages.
export async function plainFees(c) {
  const est = await c.estimateTransactionFees();
  return { distribution: est.distribution, feeValue: est.feeValue };
}

// Fees for a write that may emit one transfer to `recipient` (claim → payout):
// declare an allocation shaped like the parent tx, let the simulator run the
// call, then take its recommended preset.
export async function feesWithTransfer(c, { address, functionName, args, recipient }) {
  const base = await c.estimateTransactionFees();
  const d = base.distribution;
  const rounds = BigInt(d.rotations[0]) + 1n;
  const budget = (((BigInt(d.leaderTimeunitsAllocation) + 5n * BigInt(d.validatorTimeunitsAllocation)) * rounds + BigInt(d.executionBudgetPerRound) * rounds) * 11n) / 10n;
  const messageAllocations = [{
    messageType: MessageType.Internal, onAcceptance: false, recipient, callKey: CALL_KEY_WILDCARD, budget,
    feeParams: encodeInternalMessageFeeParams({
      leaderTimeunitsAllocation: d.leaderTimeunitsAllocation, validatorTimeunitsAllocation: d.validatorTimeunitsAllocation,
      appealRounds: 0n, executionBudgetPerRound: d.executionBudgetPerRound, rotations: [BigInt(d.rotations[0])],
      maxPriceGenPerTimeUnit: d.maxPriceGenPerTimeUnit, storageFeeMaxGasPrice: d.storageFeeMaxGasPrice, receiptFeeMaxGasPrice: d.receiptFeeMaxGasPrice,
    }),
  }];
  const est = await c.estimateTransactionFees({ messageAllocations });
  const declared = { distribution: est.distribution, messageAllocations: est.messageAllocations, feeValue: est.feeValue };
  try {
    const sim = await c.simulateWriteContract({ address, functionName, args, fees: declared, includeReceipt: true });
    const rec = await c.estimateTransactionFeesFromSimulation({ simulation: sim });
    return { distribution: rec.distribution, messageAllocations: rec.messageAllocations, feeValue: rec.feeValue };
  } catch {
    return declared; // simulation failed (e.g. the call itself reverts) — send with the declared allocation
  }
}

export async function write(c, { address, functionName, args = [], value, fees, label }) {
  const t0 = Date.now();
  const hash = await c.writeContract({ address, functionName, args, value, fees });
  const rc = await c.waitForTransactionReceipt({ hash, waitUntil: "decided", retries: 150, interval: 2000 });
  const lr = rc?.consensus_data?.leader_receipt; const first = Array.isArray(lr) ? lr[0] : lr;
  const ok = (() => { try { return isSuccessful(rc); } catch { return false; } })();
  const votes = Object.values(rc?.consensus_data?.votes || {});
  const secs = ((Date.now() - t0) / 1000).toFixed(0);
  let err = null;
  if (!ok && typeof first?.result === "string") err = Buffer.from(first.result, "base64").toString("utf8").replace(/^[\x00-\x1f]+/, "");
  console.log(`  ${(label || functionName).padEnd(22)} ${String(rc?.status_name || rc?.status).padEnd(9)} ${ok ? "ok      " : "reverted"}  ${secs}s  votes ${votes.filter((v) => v === "agree").length}/${votes.length}${err ? "  → " + err.slice(0, 120) : ""}  ${hash.slice(0, 10)}…`);
  return { hash, rc, ok, err };
}

export async function read(c, address, functionName, args = []) {
  return c.readContract({ address, functionName, args, jsonSafeReturn: true });
}

export function readDeployments(root) {
  const p = `${root}/deployments.json`;
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : {};
}
