import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
import { visitorId, visitorKey, withVisitorCookie } from "@/lib/visitor";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
export async function POST(req: Request) {
  try {
    const { id, evidence, today } = await req.json();
    const v = visitorId();
    const r = await kept.claim(id, evidence || "", today, visitorKey(v.id));
    const votes = (r as any).votes as string[] | undefined;
    let summary: string | undefined;
    if (votes?.length) {
      const agree = votes.filter((x) => x === "agree" || x === r.status.replace("UPHELD", "UPHOLD").replace("DISMISSED", "DISMISS")).length;
      summary = `${agree} of ${votes.length} validators agreed`;
    }
    return withVisitorCookie(NextResponse.json({ receipt: r, verdict: r.status, votes: summary }), v);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}
