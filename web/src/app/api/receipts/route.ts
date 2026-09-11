import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const u = new URL(req.url);
  const user = u.searchParams.get("user"); const company = u.searchParams.get("company");
  const limit = Number(u.searchParams.get("limit") || 50);
  const receipts = user ? await kept.receiptsForUser(user) : company ? await kept.receiptsForCompany(company) : await kept.listReceipts(limit);
  return NextResponse.json({ receipts });
}
