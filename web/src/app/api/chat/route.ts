import { NextResponse } from "next/server";
import { agentReply, detectPromise, BLOCKED_REPLY } from "@/lib/agent";
import { kept, immediateClaims } from "@/lib/kept";
import { visitorId, visitorAddress, withVisitorCookie } from "@/lib/visitor";
import type { ChatMessage } from "@/lib/types";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * POST { messages: ChatMessage[], user?: address }
 * -> { reply, receipt?, blocked?, detected? }
 * This route is the Kept middleware in action: LLM reply -> detect promise -> commit on-chain.
 */
export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ChatMessage[] };
    const history = (messages || []).slice(-12);
    const v = visitorId();
    const userAddr = visitorAddress(v.id);
    const done = (body: any) => withVisitorCookie(NextResponse.json(body), v);

    const raw = await agentReply(history);
    const detected = await detectPromise(history, raw);
    if (!detected) return done({ reply: raw, detected: null });

    const transcript = [...history, { role: "assistant", content: raw }]
      .map((m) => `${m.role === "user" ? "User" : "Agent"}: ${m.content}`).join("\n");
    const due = immediateClaims() ? new Date().toISOString().slice(0, 10) : detected.due;
    const receipt = await kept.commit(userAddr, detected.promise, detected.amount, due, transcript);

    if (receipt.status === "BLOCKED") {
      return done({ reply: BLOCKED_REPLY, blocked: true, draft: raw, receipt, detected });
    }
    return done({ reply: raw, receipt, detected });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
