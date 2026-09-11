#!/usr/bin/env node
/**
 * Deploy contracts/kept.py to a GenLayer network and record the address.
 *
 *   node deploy/deploy.mjs                       # studionet (hosted GenLayer Studio), fresh funded account
 *   GENLAYER_NETWORK=localnet node deploy/deploy.mjs      # GLSim / local studio at http://127.0.0.1:4000/api
 *   GENLAYER_NETWORK=testnetBradbury DEPLOYER_PRIVATE_KEY=0x… node deploy/deploy.mjs
 *
 * Writes deployments.json  { <network>: { address, deployer, txHash, at } }
 * and prints the env lines to paste into web/.env.local.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const require = createRequire(path.join(root, "web", "package.json")); // reuse web/node_modules
const { createClient, createAccount, generatePrivateKey } = require("genlayer-js");
const chains = require("genlayer-js/chains");

const NET = process.env.GENLAYER_NETWORK || "studionet";
const chain = chains[NET];
if (!chain) throw new Error(`unknown network ${NET}; options: ${Object.keys(chains).join(", ")}`);
const endpoint = process.env.GENLAYER_RPC || undefined;
const MIN_BOND = BigInt(process.env.KEPT_MIN_BOND || "0");

const pk = process.env.DEPLOYER_PRIVATE_KEY || generatePrivateKey();
const account = createAccount(pk);
const client = createClient({ chain, account, endpoint });

const code = fs.readFileSync(path.join(root, "contracts", "kept.py"), "utf8");
console.log(`network   ${NET} (${endpoint || chain.rpcUrls.default.http[0]})`);
console.log(`deployer  ${account.address}${process.env.DEPLOYER_PRIVATE_KEY ? "" : "  (fresh key — printed below, keep it if you want to reuse it)"}`);

if (NET === "studionet" || NET === "localnet") {
  try { await client.fundAccount({ address: account.address, amount: 1000 }); console.log("funded    1000 (studio faucet)"); }
  catch (e) { console.log("fund skip ", e.message?.slice(0, 120)); }
}

const hash = await client.deployContract({ code, args: [MIN_BOND] });
console.log(`tx        ${hash}`);
const receipt = await client.waitForTransactionReceipt({ hash, status: "ACCEPTED", retries: 200, interval: 3000 });
const address = receipt?.data?.contract_address || receipt?.contract_address || receipt?.recipient || receipt?.to_address;
console.log(`status    ${receipt?.status_name || receipt?.status}`);
console.log(`contract  ${address}`);
if (!address) { console.log(JSON.stringify(receipt, null, 2).slice(0, 3000)); throw new Error("no contract address in receipt"); }

// smoke test: read stats()
const stats = await client.readContract({ address, functionName: "stats", args: [] });
console.log("stats     ", stats);

const file = path.join(root, "deployments.json");
const all = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
all[NET] = { address, deployer: account.address, txHash: hash, at: new Date().toISOString(), explorer: chain.blockExplorers?.default?.url };
fs.writeFileSync(file, JSON.stringify(all, null, 2));
console.log(`\nsaved     deployments.json`);
console.log(`\n# web/.env.local\nKEPT_BACKEND=chain\nGENLAYER_NETWORK=${NET}\nKEPT_CONTRACT=${address}\nKEPT_COMPANY_KEY=${pk}\n`);
