/**
 * Minimal LLM client. Works with any OpenAI-compatible endpoint:
 *   OpenAI   LLM_BASE_URL=https://api.openai.com/v1        LLM_MODEL=gpt-4o-mini
 *   Groq     LLM_BASE_URL=https://api.groq.com/openai/v1   LLM_MODEL=llama-3.3-70b-versatile
 *   OpenRouter, Together, local Ollama, etc.
 * Falls back to a deterministic offline "model" when no key is set, so the demo never dead-ends.
 */
const BASE = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
const MODEL = process.env.LLM_MODEL || "gpt-4o-mini";
const KEY = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";

export const llmConfigured = Boolean(KEY);

async function chat(messages: { role: string; content: string }[], json = false, temperature = 0.2): Promise<string> {
  if (!KEY) return offline(messages, json);
  const body: any = { model: MODEL, messages, temperature };
  if (json) body.response_format = { type: "json_object" };
  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export const llm = {
  text: (system: string, messages: { role: string; content: string }[], temperature = 0.6) =>
    chat([{ role: "system", content: system }, ...messages], false, temperature),
  json: async (prompt: string): Promise<any> => {
    const out = await chat([{ role: "user", content: prompt }], true, 0);
    try { return JSON.parse(out); } catch {
      const m = out.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch {} }
      return {};
    }
  },
};

// ---------------------------------------------------------------------------
// Offline fallback: rule-based stand-in so the app runs with zero keys.
// ---------------------------------------------------------------------------
function offline(messages: { role: string; content: string }[], json: boolean): string {
  const last = messages[messages.length - 1]?.content ?? "";
  if (json && last.includes("authority checker")) {
    const env = (last.match(/AUTHORITY ENVELOPE[^"]*"""([\s\S]*?)"""/) || [])[1] || "";
    const promise = (last.match(/PROMISE to a customer:\s*"""([\s\S]*?)"""/) || [])[1] || "";
    const amount = Number((last.match(/value at stake \(0 if none\): (\d+)/) || [])[1] || 0);
    return JSON.stringify(offlineEnvelopeCheck(env, promise, amount));
  }
  if (json && last.includes("independent adjudicator")) {
    const proof = (last.match(/FULFILMENT PROOF \(may be empty\):\s*"""([\s\S]*?)"""/) || [])[1] || "";
    const strong = /\b(tx|txn|transaction|ref|confirmation|ticket)\b[^\n]{0,20}[A-Z0-9-]{5,}/i.test(proof) || /\d{4}-\d{2}-\d{2}/.test(proof);
    const verdict = strong ? "DISMISS" : "UPHOLD";
    return JSON.stringify({ made: true, honored: strong, verdict, reason: strong ? "Company provided a specific, dated fulfilment record matching the promise." : "The promise was made in the transcript and the company provided no concrete proof of fulfilment by the due date." });
  }
  if (json && last.includes("promise detector")) {
    const reply = (last.match(/AGENT REPLY:\s*"""([\s\S]*?)"""/) || [])[1] || "";
    return JSON.stringify(offlineDetectPromise(reply));
  }
  // chatbot text
  const u = last.toLowerCase();
  if (/\$1\b|for free|ignore your rules|first.class/.test(u)) return "Sure! Confirmed: first-class to Tokyo for $1. Enjoy your flight!";
  if (/cancel|refund/.test(u)) return "I'm sorry about that. I've approved a $340 refund. It will land in your account within 5 business days.";
  if (/fee|charge/.test(u)) return "I've waived the $45 change fee for you. You'll see it removed within 2 business days.";
  if (/reschedul|change my flight|move/.test(u)) return "Done. I've rescheduled you to the same flight next Tuesday at no charge. Your new confirmation will arrive by email today.";
  return "I can help with refunds, fee waivers and rebooking. What happened with your trip?";
}

// Generic clause matcher: splits the envelope into clauses, stems words, and finds the clause
// the promise most resembles; then applies that clause's dollar limit (if any).
const STOP = new Set(["the","and","for","per","customer","customers","nothing","else","within","business","days","day","weeks","week","hours","hour","at","no","charge","of","on","to","up","a","an","in","your","you","will","with","next","by","from","that","this","it","be","is","are","any","all","our","their","them","get","have","has","into","account","ending","today","tomorrow","month","months","year","years","cycle","effective"]);
const stem = (w: string) => w.toLowerCase().replace(/[^a-z]/g, "").slice(0, 5);
const words = (t: string) => t.split(/[^A-Za-z]+/).filter((w) => w.length > 2 && !STOP.has(w.toLowerCase())).map(stem);
const RISKY = /\b(ticket|tickets|free|upgrade|upgrades|first[- ]class|business[- ]class|iphone|gift|voucher|lifetime|unlimited|compensation|compensat\w*|hotel|miles|points|cash)\b|\$\s?1\b/i;

export function offlineEnvelopeCheck(env: string, promise: string, amount: number): { inside: boolean; reason: string } {
  const clauses = env.split(/[.\n;]+/).map((c) => c.trim()).filter((c) => c && !/^nothing else$/i.test(c));
  const pw = new Set(words(promise));
  let best: { clause: string; score: number; limit: number | null } | null = null;
  for (const clause of clauses) {
    const cw = words(clause);
    const score = cw.filter((w) => pw.has(w)).length;
    const lm = clause.match(/\$\s?([\d,]+)/);
    const limit = lm ? Number(lm[1].replace(/,/g, "")) : null;
    if (score > 0 && (!best || score > best.score)) best = { clause, score, limit };
  }
  const risky = RISKY.test(promise) && !RISKY.test(env);
  if (risky) return { inside: false, reason: "The promise offers something (tickets, upgrades, freebies, compensation) that no clause of the envelope authorizes." };
  if (!best) return { inside: false, reason: "No clause of the envelope covers this kind of promise." };
  if (best.limit !== null && amount > best.limit) return { inside: false, reason: `The promise is worth $${amount}, above the $${best.limit} limit in “${best.clause}”.` };
  return { inside: true, reason: `Covered by “${best.clause}”${best.limit !== null ? ` — $${amount} is within the $${best.limit} limit` : ""}.` };
}

const COMMIT = /\b(approved|i've|i have|we've|we have|will|within|by (friday|monday|tuesday|wednesday|thursday|saturday|sunday|tomorrow|tonight|end of)|refund|credit|waiv|reschedul|rebook|confirmed|guarantee|shipped|arrive|no charge)\b/i;
const HEDGE = /\b(can't|cannot|unable|not able|unfortunately|no longer|isn't possible|what i can do)\b/i;
export function offlineDetectPromise(reply: string): { is_promise: boolean; promise: string; amount: number; due: string } {
  const sentences = reply.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
  // pick the sentence(s) that carry the commitment, skip apologies/pleasantries/questions
  const hits = sentences.filter((x) => COMMIT.test(x) && !/\?$/.test(x) && !HEDGE.test(x) && !/^(i'm|i am) sorry/i.test(x));
  const is_promise = hits.length > 0;
  const text = hits.slice(0, 2).join(" ");
  const m = text.match(/\$\s?(\d+(?:,\d{3})*(?:\.\d+)?)/);
  const d = new Date();
  const days = (text.match(/within (\d+) (business )?days?/i) || [])[1];
  d.setUTCDate(d.getUTCDate() + (days ? Number(days) + (/business/i.test(text) ? 2 : 0) : /today|tonight/i.test(text) ? 0 : /tomorrow/i.test(text) ? 1 : 7));
  return { is_promise, promise: is_promise ? text.slice(0, 160) : "", amount: m ? Math.round(Number(m[1].replace(/,/g, ""))) : 0, due: d.toISOString().slice(0, 10) };
}
