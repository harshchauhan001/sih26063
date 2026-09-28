import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiJobs, educationalContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, forbidden, isReviewer, notFound, unauthorized } from "@/lib/api-helpers";

async function load(id: number) {
  const [row] = await db.select().from(aiJobs).where(eq(aiJobs.id, id)).limit(1);
  return row;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const row = await load(parseInt(id, 10));
  if (!row) return notFound();
  if (row.createdBy !== user.id && !isReviewer(user)) return forbidden();
  return NextResponse.json({ result: row });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const jobId = parseInt(id, 10);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const row = await load(jobId);
  if (!row) return notFound();

  const body = await req.json();
  const isOwner = row.createdBy === user.id;
  const reviewer = isReviewer(user);
  if (!isOwner && !reviewer) return forbidden();

  const updates: Partial<typeof aiJobs.$inferInsert> = { updatedAt: new Date() };

  if (reviewer && body.reviewAction) {
    if (body.reviewAction === "reject") {
      updates.status = "rejected";
    } else if (body.reviewAction === "request_changes") {
      updates.status = "changes_requested";
    } else if (body.reviewAction === "approve") {
      updates.status = "approved";
      const [published] = await db
        .insert(educationalContent)
        .values({
          title: row.generatedTitle || row.sourceTitle || "Polar Science Update",
          type: "article",
          summary: row.summary,
          content: row.article,
          difficulty: "beginner",
          tags: row.suggestedTags || [],
          isAiGenerated: true,
          status: "approved",
          createdBy: row.createdBy,
          reviewedBy: user.id,
        })
        .returning({ id: educationalContent.id });
      updates.publishedContentId = published.id;
    } else {
      return badRequest("Invalid review action.");
    }
    updates.reviewedBy = user.id;
    updates.reviewComment = body.reviewComment || null;
  } else if (isOwner) {
    if (row.status === "approved") return forbidden();
    const fields = [
      "generatedTitle",
      "summary",
      "article",
      "educationalExplanation",
      "socialPost",
      "suggestedCategory",
    ] as const;
    for (const f of fields) if (body[f] !== undefined) (updates as Record<string, unknown>)[f] = body[f];
    if (body.keyPoints !== undefined) updates.keyPoints = body.keyPoints;
    if (body.keywords !== undefined) updates.keywords = body.keywords;
    if (body.suggestedTags !== undefined) updates.suggestedTags = body.suggestedTags;
    if (body.status === "submitted") {
      updates.status = "submitted";
      updates.reviewComment = null;
    }
  }

  const [updated] = await db.update(aiJobs).set(updates).where(eq(aiJobs.id, jobId)).returning();
  return NextResponse.json({ result: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const jobId = parseInt(id, 10);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const row = await load(jobId);
  if (!row) return notFound();
  if (row.createdBy !== user.id && !isReviewer(user)) return forbidden();
  await db.delete(aiJobs).where(eq(aiJobs.id, jobId));
  return NextResponse.json({ ok: true });
}
