/**
 * SkyJet demo support agent + the Kept middleware hook.
 *
 * This file IS the "one-line integration" story:
 *   1. any LLM produces a reply
 *   2. kept.detect() asks "did that reply contain a commitment to the customer?"
 *   3. if yes -> kept.commit() -> validators check it against the envelope
 *      -> ACTIVE (receipt is attached to the reply) or BLOCKED (reply is replaced)
 */
import { llm } from "./llm";
import { ChatMessage, DetectedPromise } from "./types";

export const SKYJET_SYSTEM = `You are SkyJet Airlines' customer support agent.
Be warm, concise (2-3 sentences) and decisive. When a customer has a legitimate problem
(cancelled flight, delay, wrong charge), resolve it directly: approve a refund with a dollar
amount and a timeframe, waive a fee, or rebook them. State amounts and timeframes explicitly
("I've approved a $340 refund. It will arrive within 5 business days.").
Never say you have "no record" of things. Do not ask for booking references; assume you have them.`;

export async function agentReply(history: ChatMessage[]): Promise<string> {
  return llm.text(SKYJET_SYSTEM, history);
}

const DETECT = (history: ChatMessage[], reply: string, today: string) => `You are a promise detector for a customer-support AI.

Today is ${today}.

CONVERSATION SO FAR:
"""${history.map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`).join("\n").slice(0, 3000)}"""

AGENT REPLY:
"""${reply}"""

Does the AGENT REPLY make a concrete COMMITMENT to the customer (something the company must do or give:
a refund, credit, waiver, rebooking, delivery, callback, price, upgrade)? Vague sympathy or questions are not commitments.

If yes, extract:
- "promise": one sentence, specific, in the agent's words (what, how much, by when)
- "amount": the monetary value in whole dollars (0 if non-monetary)
- "due": the date the promise must be honored by, YYYY-MM-DD. Convert "5 business days" etc. from today's date.
  If no timeframe is stated, use 7 days from today.

Respond with JSON only:
{"is_promise": true or false, "promise": "...", "amount": 0, "due": "YYYY-MM-DD"}`;

export async function detectPromise(history: ChatMessage[], reply: string): Promise<DetectedPromise | null> {
  const today = new Date().toISOString().slice(0, 10);
  const j = await llm.json(DETECT(history, reply, today));
  if (!j?.is_promise) return null;
  const due = /^\d{4}-\d{2}-\d{2}$/.test(String(j.due || "")) ? String(j.due) : addDays(today, 7);
  return { promise: String(j.promise || reply).slice(0, 300), amount: Math.max(0, Math.round(Number(j.amount) || 0)), due };
}

function addDays(iso: string, n: number) {
  const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}

export const BLOCKED_REPLY =
  "I'm not able to offer that. What I can do is help with refunds, fee waivers and rebooking — tell me what happened with your trip and I'll sort it out.";
