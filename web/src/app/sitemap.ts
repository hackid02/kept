import type { MetadataRoute } from "next";
import { kept } from "@/lib/kept";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://kept.vercel.app";
export const revalidate = 600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = ["", "/board", "/receipts", "/console", "/how", "/privacy"].map((p) => ({ url: `${SITE}${p}`, changeFrequency: p === "" ? "hourly" : "daily", priority: p === "" ? 1 : 0.6 }));
  const receipts = await kept.listReceipts(200).catch(() => []);
  return [...pages, ...receipts.map((r) => ({ url: `${SITE}/r/${r.id}`, lastModified: new Date(r.updated_at || r.created_at), changeFrequency: "weekly" as const, priority: 0.5 }))];
}
