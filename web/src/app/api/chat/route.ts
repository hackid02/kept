import { NextResponse } from "next/server";
import { agentReply } from "@/lib/agent";
import { wrap } from "@/lib/middleware";
import { visitorId, visitorAddress, withVisitorCookie } from "@/lib/visitor";
import { fail, throttle } from "@/lib/http";
import type { ChatMessage } from "@/lib/types";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// SkyJet's support bot, with Kept wrapped around it. This is the whole integration.
const skyjet = wrap(agentReply);

export async function POST(req: Request) {
  const v = visitorId();
  const limited = throttle("chat:" + v.id); if (limited) return withVisitorCookie(limited, v);
  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? (body.messages as ChatMessage[]) : [];
    const clean = messages
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
      .slice(-12);
    if (!clean.length || clean[clean.length - 1].role !== "user") return withVisitorCookie(NextResponse.json({ error: "Say something first." }, { status: 400 }), v);
    const out = await skyjet(clean, { user: visitorAddress(v.id) });
    return withVisitorCookie(NextResponse.json(out), v);
  } catch (e) {
    return withVisitorCookie(fail(e), v);
  }
}
