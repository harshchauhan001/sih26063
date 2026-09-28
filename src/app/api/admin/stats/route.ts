import { NextResponse } from "next/server";
import { db } from "@/db";
import { expeditions, publications, datasets, media, educationalContent, aiJobs, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  if (user.role !== "admin" && user.role !== "content_manager") return forbidden();

  const [
    userCount,
    expeditionCounts,
    publicationCounts,
    datasetCounts,
    mediaCounts,
    educationCounts,
    aiJobCounts,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(users),
    db
      .select({ status: expeditions.status, count: sql<number>`count(*)::int` })
      .from(expeditions)
      .groupBy(expeditions.status),
    db
      .select({ status: publications.status, count: sql<number>`count(*)::int` })
      .from(publications)
      .groupBy(publications.status),
    db
      .select({ status: datasets.status, count: sql<number>`count(*)::int` })
      .from(datasets)
      .groupBy(datasets.status),
    db.select({ status: media.status, count: sql<number>`count(*)::int` }).from(media).groupBy(media.status),
    db
      .select({ status: educationalContent.status, count: sql<number>`count(*)::int` })
      .from(educationalContent)
      .groupBy(educationalContent.status),
    db.select({ status: aiJobs.status, count: sql<number>`count(*)::int` }).from(aiJobs).groupBy(aiJobs.status),
  ]);

  const pendingCount = (rows: { status: string; count: number }[]) =>
    rows.filter((r) => r.status === "submitted" || r.status === "changes_requested").reduce((s, r) => s + r.count, 0);
  const approvedCount = (rows: { status: string; count: number }[]) =>
    rows.filter((r) => r.status === "approved").reduce((s, r) => s + r.count, 0);
  const totalCount = (rows: { status: string; count: number }[]) => rows.reduce((s, r) => s + r.count, 0);

  return NextResponse.json({
    users: userCount[0]?.count ?? 0,
    content: {
      expeditions: { total: totalCount(expeditionCounts), approved: approvedCount(expeditionCounts), pending: pendingCount(expeditionCounts) },
      publications: { total: totalCount(publicationCounts), approved: approvedCount(publicationCounts), pending: pendingCount(publicationCounts) },
      datasets: { total: totalCount(datasetCounts), approved: approvedCount(datasetCounts), pending: pendingCount(datasetCounts) },
      media: { total: totalCount(mediaCounts), approved: approvedCount(mediaCounts), pending: pendingCount(mediaCounts) },
      education: { total: totalCount(educationCounts), approved: approvedCount(educationCounts), pending: pendingCount(educationCounts) },
      aiJobs: { total: totalCount(aiJobCounts), approved: approvedCount(aiJobCounts), pending: pendingCount(aiJobCounts) },
    },
  });
}
