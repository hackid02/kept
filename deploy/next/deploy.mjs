#!/usr/bin/env node
/**
 * Deploy contracts/kept.py to GenLayer Studio Next (chain 61997) and record it.
 *
 *   cd deploy/next && npm install
 *   npm run deploy                                   # fresh funded key, min_bond 0
 *   DEPLOYER_PRIVATE_KEY=0x… KEPT_MIN_BOND=1000 npm run deploy
 *
 * Writes deployments.json → { studioNext: { address, deployer, txHash, at, explorer } }
 * and prints the explorer link. Studio Next needs an explicit fee deposit per
 * write (~0.1 GEN); the faucet call below covers it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isSuccessful } from "genlayer-js";
import { account, fund, client, plainFees, chain, EXPLORER, RPC, gen, readDeployments } from "./lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const code = fs.readFileSync(path.join(root, "contracts", "kept.py"), "utf8");
const MIN_BOND = BigInt(process.env.KEPT_MIN_BOND || "0");

const { key, account: acct } = account();
const c = client(acct);
console.log(`network   studio-next (${RPC}) chain ${chain.id}`);
console.log(`deployer  ${acct.address}${process.env.DEPLOYER_PRIVATE_KEY ? "" : "  (fresh key — printed below)"}`);
await fund(acct.address, 100).catch((e) => console.log("fund skip ", String(e.message).slice(0, 120)));

const fees = await plainFees(c);
console.log(`fee       ${gen(fees.feeValue)} deposit`);
const t0 = Date.now();
const hash = await c.deployContract({ code, args: [MIN_BOND], fees });
console.log(`deploy tx ${hash}`);
const rc = await c.waitForTransactionReceipt({ hash, waitUntil: "decided", retries: 150, interval: 2000 });
const address = rc?.txDataDecoded?.contractAddress || rc?.data?.contract_address;
const ok = (() => { try { return isSuccessful(rc); } catch { return false; } })();
console.log(`status    ${rc?.status_name || rc?.status} ${ok ? "ok" : "FAILED"} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
if (!ok || !address) { console.log(JSON.stringify(rc, (k, v) => (typeof v === "bigint" ? v.toString() : v)).slice(0, 2000)); process.exit(2); }

const deployments = readDeployments(root);
deployments.studioNext = { chainId: chain.id, address, deployer: acct.address, txHash: hash, at: new Date().toISOString(), explorer: `${EXPLORER}/address/${address}`, rpc: RPC };
fs.writeFileSync(path.join(root, "deployments.json"), JSON.stringify(deployments, null, 2) + "\n");

console.log(`\ncontract  ${address}`);
console.log(`explorer  ${EXPLORER}/address/${address}`);
console.log(`\n# keep this key if you want to reuse the deployer\nDEPLOYER_PRIVATE_KEY=${key}`);
