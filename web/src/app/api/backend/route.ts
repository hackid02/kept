import { NextResponse } from "next/server";
import { backendInfo, companyAddress, defaultUserAddress } from "@/lib/kept";
import { llmConfigured } from "@/lib/llm";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ ...backendInfo(), llm: llmConfigured ? "live" : "offline", company: companyAddress(), user: defaultUserAddress() });
}
