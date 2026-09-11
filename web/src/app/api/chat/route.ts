import { NextResponse } from "next/server";
import { agentReply } from "@/lib/agent";
import { wrap } from "@/lib/middleware";
import { visitorId, visitorAddress, withVisitorCookie } from "@/lib/visitor";
import type { ChatMessage } from "@/lib/types";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// SkyJet's support bot, with Kept wrapped around it. This is the whole integration.
const skyjet = wrap(agentReply);

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    const v = visitorId();
    const out = await skyjet((messages || []).slice(-12), { user: visitorAddress(v.id) });
    return withVisitorCookie(NextResponse.json(out), v);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
