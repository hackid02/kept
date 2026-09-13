import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
import { visitorId, visitorKey, visitorAddress, withVisitorCookie } from "@/lib/visitor";
import { fail, throttle } from "@/lib/http";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const v = visitorId();
  const limited = throttle("claim:" + v.id); if (limited) return withVisitorCookie(limited, v);
  try {
    const { id, evidence, today } = await req.json().catch(() => ({}));
    if (typeof id !== "string" || !id) return withVisitorCookie(NextResponse.json({ error: "Receipt id required." }, { status: 400 }), v);
    // The contract enforces "only the promised user can claim"; checking here too gives a clear message
    // instead of spending a transaction to learn it.
    const existing = await kept.getReceipt(id);
    if (!existing) return withVisitorCookie(NextResponse.json({ error: "unknown receipt" }, { status: 404 }), v);
    if (existing.user.toLowerCase() !== visitorAddress(v.id).toLowerCase()) {
      return withVisitorCookie(NextResponse.json({ error: "This promise was made to a different visitor. Only they can claim it." }, { status: 403 }), v);
    }
    const r = await kept.claim(id, String(evidence || "").slice(0, 2000), today, visitorKey(v.id));
    const votes = (r as any).votes as string[] | undefined;
    // GenLayer reports validator votes as agree/disagree with the leader. Count agreement explicitly;
    // if the shape is anything else, say nothing rather than "0 of 3 agreed" next to a verdict.
    const agree = votes?.filter((x) => x === "agree").length ?? 0;
    const summary = votes?.length && agree > 0 ? `${agree} of ${votes.length} validators agreed` : undefined;
    return withVisitorCookie(NextResponse.json({ receipt: r, verdict: r.status, votes: summary }), v);
  } catch (e) {
    return withVisitorCookie(fail(e), v);
  }
}
