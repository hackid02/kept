import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
import { fail, companyAuth } from "@/lib/http";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Company-side: mark a promise as kept, with proof. Signs with the company key server-side, so it is
 * gated by KEPT_COMPANY_SECRET (header `x-kept-company-secret`). Without it, anyone could attach
 * convincing fake proof to a stranger's receipt and sink their claim.
 */
export async function POST(req: Request) {
  const denied = companyAuth(req); if (denied) return denied;
  try {
    const { id, proof } = await req.json().catch(() => ({}));
    if (typeof id !== "string" || !id) return NextResponse.json({ error: "Receipt id required." }, { status: 400 });
    const r = await kept.markFulfilled(id, String(proof || "").slice(0, 2000));
    return NextResponse.json({ receipt: r });
  } catch (e) {
    return fail(e);
  }
}
