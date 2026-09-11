import { NextResponse } from "next/server";
import { agentReply, detectPromise, BLOCKED_REPLY } from "@/lib/agent";
import { kept, defaultUserAddress } from "@/lib/kept";
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
    const { messages, user } = (await req.json()) as { messages: ChatMessage[]; user?: string };
    const history = (messages || []).slice(-12);
    const userAddr = user || defaultUserAddress();

    const raw = await agentReply(history);
    const detected = await detectPromise(history, raw);
    if (!detected) return NextResponse.json({ reply: raw, detected: null });

    const transcript = [...history, { role: "assistant", content: raw }]
      .map((m) => `${m.role === "user" ? "User" : "Agent"}: ${m.content}`).join("\n");
    const receipt = await kept.commit(userAddr, detected.promise, detected.amount, detected.due, transcript);

    if (receipt.status === "BLOCKED") {
      return NextResponse.json({ reply: BLOCKED_REPLY, blocked: true, draft: raw, receipt, detected });
    }
    return NextResponse.json({ reply: raw, receipt, detected });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
