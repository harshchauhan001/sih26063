import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { educationalContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, forbidden, isReviewer, notFound, unauthorized } from "@/lib/api-helpers";

async function load(id: number) {
  const [row] = await db.select().from(educationalContent).where(eq(educationalContent.id, id)).limit(1);
  return row;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const contentId = parseInt(id, 10);
  const user = await getCurrentUser();
  const row = await load(contentId);
  if (!row) return notFound();
  const isOwner = user && row.createdBy === user.id;
  if (row.status !== "approved" && !isOwner && !isReviewer(user)) return notFound();
  return NextResponse.json({ result: row });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const contentId = parseInt(id, 10);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const row = await load(contentId);
  if (!row) return notFound();

  const body = await req.json();
  const isOwner = row.createdBy === user.id;
  const reviewer = isReviewer(user);
  if (!isOwner && !reviewer) return forbidden();

  const updates: Partial<typeof educationalContent.$inferInsert> = { updatedAt: new Date() };

  if (reviewer && body.reviewAction) {
    if (body.reviewAction === "approve") updates.status = "approved";
    else if (body.reviewAction === "reject") updates.status = "rejected";
    else if (body.reviewAction === "request_changes") updates.status = "changes_requested";
    else return badRequest("Invalid review action.");
    updates.reviewedBy = user.id;
    updates.reviewComment = body.reviewComment || null;
  } else if (isOwner) {
    if (row.status === "approved" && !reviewer) return forbidden();
    const fields = ["title", "summary", "content", "coverImageUrl"] as const;
    for (const f of fields) if (body[f] !== undefined) (updates as Record<string, unknown>)[f] = body[f];
    if (body.type !== undefined) updates.type = body.type;
    if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.quizData !== undefined) updates.quizData = body.quizData;
    if (body.status === "submitted") {
      updates.status = "submitted";
      updates.reviewComment = null;
    }
  }

  const [updated] = await db
    .update(educationalContent)
    .set(updates)
    .where(eq(educationalContent.id, contentId))
    .returning();
  return NextResponse.json({ result: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const contentId = parseInt(id, 10);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const row = await load(contentId);
  if (!row) return notFound();
  if (row.createdBy !== user.id && !isReviewer(user)) return forbidden();
  await db.delete(educationalContent).where(eq(educationalContent.id, contentId));
  return NextResponse.json({ ok: true });
}
