import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expeditions, publications, datasets, media, educationalContent } from "@/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

type SearchResult = {
  id: number;
  type: "expedition" | "publication" | "dataset" | "media" | "education";
  title: string;
  description: string | null;
  year?: number | null;
  region?: string | null;
  href: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const type = searchParams.get("type");
  const region = searchParams.get("region");
  const year = searchParams.get("year");

  const results: SearchResult[] = [];
  const like = `%${q}%`;

  const wantExpeditions = !type || type === "expedition";
  const wantPublications = !type || type === "publication";
  const wantDatasets = !type || type === "dataset";
  const wantMedia = !type || type === "media";
  const wantEducation = !type || type === "education";

  if (wantExpeditions) {
    const conds = [eq(expeditions.status, "approved")];
    if (q) conds.push(or(ilike(expeditions.title, like), ilike(expeditions.description, like))!);
    if (region) conds.push(eq(expeditions.region, region as "arctic"));
    if (year) conds.push(eq(expeditions.year, parseInt(year, 10)));
    const rows = await db
      .select()
      .from(expeditions)
      .where(and(...conds))
      .orderBy(desc(expeditions.year))
      .limit(20);
    results.push(
      ...rows.map((r) => ({
        id: r.id,
        type: "expedition" as const,
        title: r.title,
        description: r.description,
        year: r.year,
        region: r.region,
        href: `/expeditions/${r.id}`,
      })),
    );
  }

  if (wantPublications) {
    const conds = [eq(publications.status, "approved")];
    if (q) conds.push(or(ilike(publications.title, like), ilike(publications.abstract, like))!);
    if (year) conds.push(eq(publications.year, parseInt(year, 10)));
    const rows = await db
      .select()
      .from(publications)
      .where(and(...conds))
      .orderBy(desc(publications.year))
      .limit(20);
    results.push(
      ...rows.map((r) => ({
        id: r.id,
        type: "publication" as const,
        title: r.title,
        description: r.abstract,
        year: r.year,
        href: `/research/${r.id}`,
      })),
    );
  }

  if (wantDatasets) {
    const conds = [eq(datasets.status, "approved")];
    if (q) conds.push(or(ilike(datasets.title, like), ilike(datasets.description, like))!);
    if (region) conds.push(eq(datasets.region, region as "arctic"));
    const rows = await db
      .select()
      .from(datasets)
      .where(and(...conds))
      .limit(20);
    results.push(
      ...rows.map((r) => ({
        id: r.id,
        type: "dataset" as const,
        title: r.title,
        description: r.description,
        region: r.region,
        href: `/datasets/${r.id}`,
      })),
    );
  }

  if (wantMedia) {
    const conds = [eq(media.status, "approved")];
    if (q) conds.push(or(ilike(media.title, like), ilike(media.description, like))!);
    const rows = await db
      .select()
      .from(media)
      .where(and(...conds))
      .limit(20);
    results.push(
      ...rows.map((r) => ({
        id: r.id,
        type: "media" as const,
        title: r.title,
        description: r.description,
        href: `/media/${r.id}`,
      })),
    );
  }

  if (wantEducation) {
    const conds = [eq(educationalContent.status, "approved")];
    if (q) conds.push(or(ilike(educationalContent.title, like), ilike(educationalContent.summary, like))!);
    const rows = await db
      .select()
      .from(educationalContent)
      .where(and(...conds))
      .limit(20);
    results.push(
      ...rows.map((r) => ({
        id: r.id,
        type: "education" as const,
        title: r.title,
        description: r.summary,
        href: `/education/${r.id}`,
      })),
    );
  }

  return NextResponse.json({ results, count: results.length });
}
