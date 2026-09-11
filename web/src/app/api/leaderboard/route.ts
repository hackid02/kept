import { NextResponse } from "next/server";
import { kept } from "@/lib/kept";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ companies: await kept.leaderboard() }); }
