import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
export const dynamic = "force-dynamic";
/** Full company record (includes the envelope, which the leaderboard view omits). ?c=<address> */
export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("c");
  if (!address) return NextResponse.json({ error: "c required" }, { status: 400 });
  const company = await kept.getCompany(address);
  if (!company) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ company });
}
