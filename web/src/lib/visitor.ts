/**
 * Per-visitor burner identity.
 * Every browser gets a random id in a cookie; the server derives a private key from
 * (secret, id). Receipts are committed *to that address* and claims are signed *by it*.
 * It's custodial and demo-grade — in production the customer's own wallet (or the support
 * platform's user id → wallet mapping) takes this place. It keeps "your receipt, your claim"
 * honest without asking judges to add studionet to MetaMask.
 *
 * The cookie is `<id>.<hmac>`: the id is 128 random bits and the HMAC (keyed by the same
 * server secret) is verified on every request, so a tampered or hand-made cookie is simply
 * treated as a new visitor. In production the secret is mandatory — without it every visitor
 * key would be derivable from the public source.
 */
import { cookies } from "next/headers";
import { keccak256, toHex } from "viem";
import { createAccount } from "genlayer-js";

const COOKIE = "kept_visitor";
// Resolved on first use, not at import: Next evaluates route modules while building, before runtime env exists.
let _secret: string | undefined;
const secret = () => {
  if (_secret) return _secret;
  const s = process.env.KEPT_VISITOR_SECRET;
  if (s && s.length >= 16) return (_secret = s);
  if (process.env.NODE_ENV === "production" && process.env.KEPT_BACKEND !== "sim") {
    throw new Error("KEPT_VISITOR_SECRET must be set (>= 16 chars) in production");
  }
  return (_secret = "kept-dev-only-secret");
};

const sign = (id: string) => keccak256(toHex(`${secret()}|sig|${id}`)).slice(2, 34);

export function visitorId(): { id: string; isNew: boolean } {
  const jar = cookies();
  const raw = jar.get(COOKIE)?.value || "";
  const [id, sig] = raw.split(".");
  if (id && sig && /^[a-f0-9]{32}$/.test(id) && sig === sign(id)) return { id, isNew: false };
  const fresh = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
  return { id: fresh, isNew: true };
}

export function visitorKey(id: string): `0x${string}` {
  return keccak256(toHex(`${secret()}:${id}`));
}

export function visitorAddress(id: string): string {
  return createAccount(visitorKey(id)).address;
}

/** Attach the cookie to a response when the visitor is new. */
export function withVisitorCookie<T extends Response>(res: T, v: { id: string; isNew: boolean }): T {
  if (v.isNew) res.headers.append("set-cookie", `${COOKIE}=${v.id}.${sign(v.id)}; Path=/; Max-Age=31536000; SameSite=Lax; HttpOnly${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return res;
}
