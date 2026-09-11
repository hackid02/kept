import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const { id, proof } = await req.json();
    const r = await kept.markFulfilled(id, proof || "");
    return NextResponse.json({ receipt: r });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 400 });
  }
}
