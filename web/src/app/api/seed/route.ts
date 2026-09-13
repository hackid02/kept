import { NextResponse } from "next/server";
import { ensureDemoCompany, backend } from "@/lib/kept";
import { fail, companyAuth } from "@/lib/http";
import { sim } from "@/lib/sim";
import { seedSimWorld } from "@/lib/seed";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/seed — company-side (KEPT_COMPANY_SECRET). Makes sure the demo company exists and, in
 * simulator mode, resets the world to a realistic mixed history. A visitor never needs this: the
 * app registers SkyJet on its own the first time a promise is made (see ensureDemoCompany).
 */
export async function POST(req: Request) {
  const denied = companyAuth(req); if (denied) return denied;
  try {
    if (backend() === "sim") { sim.reset(); await seedSimWorld(); }
    const co = await ensureDemoCompany();
    return NextResponse.json({ ok: true, backend: backend(), skyjet: co });
  } catch (e) {
    return fail(e);
  }
}
