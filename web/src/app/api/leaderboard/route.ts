import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
export const dynamic = "force-dynamic";
/** Unhandled read errors → 429 for rate limits (client keeps last data), 503 otherwise. Never a Next error page for a poll. */
function fail(e: unknown) {
  const msg = String((e as any)?.message || e);
  const rate = /rate limit/i.test(msg);
  return NextResponse.json({ error: rate ? "rate limited" : "unavailable" }, { status: rate ? 429 : 503, headers: rate ? { "retry-after": "5" } : {} });
}

export async function GET() {
  try { return NextResponse.json({ companies: await kept.leaderboard() }); } catch (e) { return fail(e); }
}
