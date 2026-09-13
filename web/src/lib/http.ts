/**
 * Shared plumbing for the API routes.
 *
 *  - fail(e)         → one error shape for every route: { error } with 400/404/429/503, never a raw stack
 *                      or SDK internals (the viem version string used to leak into the UI this way).
 *  - throttle(id)    → per-visitor token bucket in front of anything that spends an on-chain write or an
 *                      LLM panel. Best-effort (per serverless instance), which is enough to stop a loop.
 *  - companyAuth()   → the company-side actions (mark kept, seed) need KEPT_COMPANY_SECRET. The demo UI
 *                      never sends it, so a visitor cannot forge fulfilment proof on someone else's receipt.
 */
import { NextResponse } from "next/server";
import { KeptError, toKeptError } from "./kept";

export function fail(e: unknown) {
  const k: KeptError = toKeptError(e);
  const status = k.status;
  // 400s are contract-level answers ("not yet due") and safe to show verbatim; the rest are our own copy.
  const message = status === 400 ? String((e as any)?.message || k.message).replace(/Version: viem@[\d.]+/, "").trim() : k.message;
  if (status === 503) console.error("[kept] api failure:", String((e as any)?.message || e).slice(0, 300));
  return NextResponse.json({ error: message }, { status, headers: status === 429 ? { "retry-after": "5" } : {} });
}

const buckets = new Map<string, { tokens: number; at: number }>();
const CAP = Number(process.env.KEPT_RATE_BURST || 6);            // writes a visitor may fire back to back
const REFILL_MS = Number(process.env.KEPT_RATE_REFILL_MS || 20_000);   // one new token every 20 s
export function throttle(id: string): NextResponse | null {
  const now = Date.now();
  const b = buckets.get(id) || { tokens: CAP, at: now };
  b.tokens = Math.min(CAP, b.tokens + (now - b.at) / REFILL_MS); b.at = now;
  if (b.tokens < 1) {
    buckets.set(id, b);
    return NextResponse.json({ error: "Slow down — a few seconds between requests, please." }, { status: 429, headers: { "retry-after": "10" } });
  }
  b.tokens -= 1; buckets.set(id, b);
  if (buckets.size > 5000) buckets.clear();
  return null;
}

export function companyAuth(req: Request): NextResponse | null {
  const secret = process.env.KEPT_COMPANY_SECRET;
  const given = req.headers.get("x-kept-company-secret") || "";
  if (!secret) return NextResponse.json({ error: "Company actions are disabled on this deployment (KEPT_COMPANY_SECRET not set)." }, { status: 403 });
  if (given.length !== secret.length || !timingSafeEq(given, secret)) return NextResponse.json({ error: "Only SkyJet can do this — the company secret is missing or wrong." }, { status: 403 });
  return null;
}
function timingSafeEq(a: string, b: string) { let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
