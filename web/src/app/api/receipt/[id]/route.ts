import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const r = await kept.getReceipt(params.id);
  if (!r) return NextResponse.json({ error: "unknown receipt" }, { status: 404 });
  const company = await kept.getCompany(r.company);
  return NextResponse.json({ receipt: r, company });
}
