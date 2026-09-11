/**
 * Per-visitor burner identity.
 * Every browser gets a random id in a cookie; the server derives a private key from
 * (secret, id). Receipts are committed *to that address* and claims are signed *by it*.
 * It's custodial and demo-grade — in production the customer's own wallet (or the support
 * platform's user id → wallet mapping) takes this place. It keeps "your receipt, your claim"
 * honest without asking judges to add studionet to MetaMask.
 */
import { cookies } from "next/headers";
import { keccak256, toHex } from "viem";
import { createAccount } from "genlayer-js";

const COOKIE = "kept_visitor";
const SECRET = process.env.KEPT_VISITOR_SECRET || "kept-demo-secret-change-me";

export function visitorId(): { id: string; isNew: boolean } {
  const jar = cookies();
  const existing = jar.get(COOKIE)?.value;
  if (existing && /^[a-f0-9]{32}$/.test(existing)) return { id: existing, isNew: false };
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { id, isNew: true };
}

export function visitorKey(id: string): `0x${string}` {
  return keccak256(toHex(`${SECRET}:${id}`));
}

export function visitorAddress(id: string): string {
  return createAccount(visitorKey(id)).address;
}

/** Attach the cookie to a response when the visitor is new. */
export function withVisitorCookie<T extends Response>(res: T, v: { id: string; isNew: boolean }): T {
  if (v.isNew) res.headers.append("set-cookie", `${COOKIE}=${v.id}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly`);
  return res;
}
