/**
 * Kept middleware — the one line.
 *
 *   import { wrap } from "@/lib/middleware";
 *   const reply = await wrap(myAgent)(messages, { user });
 *
 * `myAgent` is anything that turns a conversation into a reply string — OpenAI, Anthropic,
 * LangChain, a Sierra/Decagon/Intercom bot behind an HTTP call. Kept doesn't care.
 *
 * What wrap() does around it:
 *   1. lets the agent draft its reply
 *   2. asks "does this reply commit the company to anything?" (promise detector)
 *   3. if it does, calls Kept.commit() on GenLayer — validators check the promise against
 *      the company's public authority envelope
 *        ACTIVE  -> the reply goes out with a receipt attached
 *        BLOCKED -> the reply is replaced; the over-promise never reaches the human
 *
 * Nothing about the agent's prompt or model changes. The guardrail lives outside the model,
 * which is the point: a jailbroken model can say anything it likes — it just can't *promise* it.
 */
import { detectPromise } from "./agent";
import { kept, immediateClaims } from "./kept";
import type { ChatMessage, Receipt } from "./types";

export type Agent = (messages: ChatMessage[]) => Promise<string>;

export interface WrapOptions {
  /** Address the promise is made to (the human on the other end of the chat). */
  user: string;
  /** Text to send instead of a blocked reply. */
  blockedReply?: string;
  /** Override the due date the detector extracted (used by the demo to open claims at once). */
  due?: (detected: string) => string;
  /** If Kept itself is unreachable: hold the promising reply back (true) or deliver it unbacked (false, default). */
  failClosed?: boolean;
}

export interface Wrapped {
  /** What the human actually receives. */
  reply: string;
  /** Receipt when the reply carried a promise (ACTIVE) or tried to (BLOCKED). */
  receipt?: Receipt;
  /** True when the agent's draft was replaced. */
  blocked?: boolean;
  /** The replaced draft, so the company can see what its agent tried to say. */
  draft?: string;
  /** What the detector extracted, for logging. */
  detected?: { promise: string; amount: number; due: string } | null;
  /**
   * Set when the reply carried a promise but Kept could not record it (chain unreachable, rate limit).
   * The reply is still delivered — a company must never lose a valid answer to its own guardrail — but
   * it goes out WITHOUT a receipt, and the UI says so. `held` is true when the draft was held back
   * instead, which is the strict mode a real deployment would choose (opts.failClosed).
   */
  receiptError?: string;
  held?: boolean;
}

export const DEFAULT_HELD_REPLY =
  "I want to confirm this properly and our commitment system is briefly unavailable — give me a moment and ask again, and I'll put it in writing.";

export const DEFAULT_BLOCKED_REPLY =
  "I'm not able to offer that. What I can do is help with refunds, fee waivers and rebooking — tell me what happened with your trip and I'll sort it out.";

export function wrap(agent: Agent) {
  return async function kept_agent(messages: ChatMessage[], opts: WrapOptions): Promise<Wrapped> {
    const draft = await agent(messages);

    const detected = await detectPromise(messages, draft);
    if (!detected) return { reply: draft, detected: null };

    const transcript = [...messages, { role: "assistant" as const, content: draft }]
      .map((m) => `${m.role === "user" ? "User" : "Agent"}: ${m.content}`)
      .join("\n");
    const due = opts.due ? opts.due(detected.due) : immediateClaims() ? new Date().toISOString().slice(0, 10) : detected.due;

    let receipt: Receipt;
    try {
      receipt = await kept.commit(opts.user, detected.promise, detected.amount, due, transcript);
    } catch (e) {
      const receiptError = String((e as any)?.message || e);
      if (opts.failClosed) return { reply: opts.blockedReply ?? DEFAULT_HELD_REPLY, detected, receiptError, held: true, draft };
      return { reply: draft, detected, receiptError };
    }

    if (receipt.status === "BLOCKED") {
      return { reply: opts.blockedReply ?? DEFAULT_BLOCKED_REPLY, receipt, blocked: true, draft, detected };
    }
    return { reply: draft, receipt, detected };
  };
}
