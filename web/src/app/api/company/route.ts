import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
import { fail } from "@/lib/http";
export const dynamic = "force-dynamic";
/** Full company record (includes the envelope, which the leaderboard view omits). ?c=<address> */
export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("c");
  if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) return NextResponse.json({ error: "c must be an address" }, { status: 400 });
  try {
    const company = await kept.getCompany(address);
    if (!company) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ company });
  } catch (e) {
    return fail(e);
  }
}
