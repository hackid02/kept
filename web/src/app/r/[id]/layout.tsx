import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { kept } from "@/lib/kept";
import { STATUS_WORD } from "@/components/Status";

const ID = /^KPT-\d{4}-[0-9A-Fa-f]{4}$/;

/** Existence is decided here, before any HTML streams, so a missing id is a real 404 status. */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (!ID.test(params.id)) notFound();
  const r = await kept.getReceipt(params.id).catch(() => null);
  if (!r) notFound();
  const title = `${r.id} · ${STATUS_WORD[r.status]}`;
  const description = `${r.company_name} promised: "${r.promise}"${r.amount ? ` — $${r.amount}` : ""}, due ${r.due}.`;
  return { title, description, openGraph: { title, description, images: [{ url: `/r/${r.id}/opengraph-image`, width: 1200, height: 630 }] }, twitter: { card: "summary_large_image", title, description } };
}
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
