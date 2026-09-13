import { NextResponse } from "next/server";
import { kept, staleAsOf } from "@/lib/kept";
import { fail } from "@/lib/http";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const companies = await kept.leaderboard();
    const asOf = staleAsOf.get(companies);
    return NextResponse.json({ companies, ...(asOf ? { stale: true, asOf } : {}) });
  } catch (e) { return fail(e); }
}
