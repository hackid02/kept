import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await kept.stats()); }
  catch (e) {
    const rate = /rate limit/i.test(String((e as any)?.message || e));
    return NextResponse.json({ error: rate ? "rate limited" : "unavailable" }, { status: rate ? 429 : 503 });
  }
}
