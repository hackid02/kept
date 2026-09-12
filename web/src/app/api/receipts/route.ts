import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
export const dynamic = "force-dynamic";
/** Unhandled read errors → 429 for rate limits (client keeps last data), 503 otherwise. Never a Next error page for a poll. */
function fail(e: unknown) {
  const msg = String((e as any)?.message || e);
  const rate = /rate limit/i.test(msg);
  return NextResponse.json({ error: rate ? "rate limited" : "unavailable" }, { status: rate ? 429 : 503, headers: rate ? { "retry-after": "5" } : {} });
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const user = u.searchParams.get("user"); const company = u.searchParams.get("company");
  const limit = Number(u.searchParams.get("limit") || 50);
  try {
    const receipts = user ? await kept.receiptsForUser(user) : company ? await kept.receiptsForCompany(company) : await kept.listReceipts(limit);
    return NextResponse.json({ receipts });
  } catch (e) { return fail(e); }
}
