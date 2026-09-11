import { NextResponse } from "next/server";
import { backendInfo, companyAddress } from "@/lib/kept";
import { llmConfigured } from "@/lib/llm";
import { visitorId, visitorAddress, withVisitorCookie } from "@/lib/visitor";
export const dynamic = "force-dynamic";
export async function GET() {
  const v = visitorId();
  return withVisitorCookie(NextResponse.json({ ...backendInfo(), llm: llmConfigured ? "live" : "offline", company: companyAddress(), user: visitorAddress(v.id) }), v);
}
