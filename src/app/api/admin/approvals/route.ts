import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  expeditions,
  publications,
  datasets,
  media,
  educationalContent,
  aiJobs,
  users,
} from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { forbidden, isReviewer, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

const PENDING_STATUSES = ["submitted", "changes_requested"] as const;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (!isReviewer(user)) return forbidden();

  const { searchParams } = new URL(req.url);
  const statuses = searchParams.get("status")
    ? [searchParams.get("status") as (typeof PENDING_STATUSES)[number]]
    : ["submitted" as const];

  const [exp, pubs, ds, med, edu, ai] = await Promise.all([
    db.select().from(expeditions).where(inArray(expeditions.status, statuses)),
    db.select().from(publications).where(inArray(publications.status, statuses)),
    db.select().from(datasets).where(inArray(datasets.status, statuses)),
    db.select().from(media).where(inArray(media.status, statuses)),
    db.select().from(educationalContent).where(inArray(educationalContent.status, statuses)),
    db.select().from(aiJobs).where(inArray(aiJobs.status, statuses)),
  ]);

  const authorIds = [
    ...exp.map((r) => r.createdBy),
    ...pubs.map((r) => r.createdBy),
    ...ds.map((r) => r.createdBy),
    ...med.map((r) => r.createdBy),
    ...edu.map((r) => r.createdBy),
    ...ai.map((r) => r.createdBy),
  ].filter((v): v is number => !!v);

  const authors = authorIds.length
    ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, [...new Set(authorIds)]))
    : [];
  const authorMap = new Map(authors.map((a) => [a.id, a.name]));

  return NextResponse.json({
    expeditions: exp.map((r) => ({ ...r, authorName: authorMap.get(r.createdBy ?? -1) ?? "Unknown" })),
    publications: pubs.map((r) => ({ ...r, authorName: authorMap.get(r.createdBy ?? -1) ?? "Unknown" })),
    datasets: ds.map((r) => ({ ...r, authorName: authorMap.get(r.createdBy ?? -1) ?? "Unknown" })),
    media: med.map((r) => ({ ...r, authorName: authorMap.get(r.createdBy ?? -1) ?? "Unknown" })),
    education: edu.map((r) => ({ ...r, authorName: authorMap.get(r.createdBy ?? -1) ?? "Unknown" })),
    aiJobs: ai.map((r) => ({ ...r, authorName: authorMap.get(r.createdBy ?? -1) ?? "Unknown" })),
  });
}