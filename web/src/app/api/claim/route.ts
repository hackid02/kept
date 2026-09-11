import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
export async function POST(req: Request) {
  try {
    const { id, evidence, today } = await req.json();
    const r = await kept.claim(id, evidence || "", today);
    const votes = (r as any).votes as string[] | undefined;
    return NextResponse.json({ receipt: r, verdict: r.status, votes: votes ? `${votes.filter((v) => v === "UPHOLD").length}–${votes.filter((v) => v === "DISMISS").length} validators` : undefined });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}
