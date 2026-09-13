import { NextResponse } from "next/server";
import { kept, staleAsOf } from "@/lib/kept";
import { fail } from "@/lib/http";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const user = u.searchParams.get("user"); const company = u.searchParams.get("company");
  const limit = Math.min(200, Math.max(1, Number(u.searchParams.get("limit") || 50) || 50));
  try {
    const receipts = user ? await kept.receiptsForUser(user) : company ? await kept.receiptsForCompany(company) : await kept.listReceipts(limit);
    const asOf = staleAsOf.get(receipts);
    return NextResponse.json({ receipts, ...(asOf ? { stale: true, asOf } : {}) });
  } catch (e) { return fail(e); }
}
