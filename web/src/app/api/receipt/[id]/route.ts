import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
import { fail } from "@/lib/http";
export const dynamic = "force-dynamic";

/** 404 only when the chain says the receipt does not exist; a stalled RPC is a 503 so a permanent link never reads as "unknown". */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const r = await kept.getReceipt(params.id);
    if (!r) return NextResponse.json({ error: "unknown receipt" }, { status: 404 });
    const company = await kept.getCompany(r.company).catch(() => null);   // the receipt alone is enough to render
    return NextResponse.json({ receipt: r, company });
  } catch (e) {
    return fail(e);
  }
}
