import { NextResponse } from "next/server";
import { kept, staleAsOf } from "@/lib/kept";
import { fail } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const s = await kept.stats();
    const asOf = staleAsOf.get(s);
    return NextResponse.json({ ...s, ...(asOf ? { stale: true, asOf } : {}) });
  } catch (e) { return fail(e); }
}
