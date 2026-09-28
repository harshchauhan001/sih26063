import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { publications, datasets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, forbidden, isReviewer, notFound, unauthorized } from "@/lib/api-helpers";

async function load(id: number) {
  const [row] = await db.select().from(publications).where(eq(publications.id, id)).limit(1);
  return row;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pubId = parseInt(id, 10);
  const user = await getCurrentUser();
  const row = await load(pubId);
  if (!row) return notFound();
  const isOwner = user && row.createdBy === user.id;
  if (row.status !== "approved" && !isOwner && !isReviewer(user)) return notFound();

  const relatedDatasets = await db
    .select()
    .from(datasets)
    .where(and(eq(datasets.publicationId, pubId), eq(datasets.status, "approved")));

  return NextResponse.json({ result: row, related: { datasets: relatedDatasets } });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pubId = parseInt(id, 10);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const row = await load(pubId);
  if (!row) return notFound();

  const body = await req.json();
  const isOwner = row.createdBy === user.id;
  const reviewer = isReviewer(user);
  if (!isOwner && !reviewer) return forbidden();

  const updates: Partial<typeof publications.$inferInsert> = { updatedAt: new Date() };

  if (reviewer && body.reviewAction) {
    if (body.reviewAction === "approve") updates.status = "approved";
    else if (body.reviewAction === "reject") updates.status = "rejected";
    else if (body.reviewAction === "request_changes") updates.status = "changes_requested";
    else return badRequest("Invalid review action.");
    updates.reviewedBy = user.id;
    updates.reviewComment = body.reviewComment || null;
  } else if (isOwner) {
    if (row.status === "approved" && !reviewer) return forbidden();
    const fields = ["title", "abstract", "researchArea", "organization", "doi", "fileUrl"] as const;
    for (const f of fields) if (body[f] !== undefined) (updates as Record<string, unknown>)[f] = body[f];
    if (body.year !== undefined) updates.year = parseInt(body.year, 10);
    if (body.authors !== undefined) updates.authors = body.authors;
    if (body.keywords !== undefined) updates.keywords = body.keywords;
    if (body.expeditionId !== undefined)
      updates.expeditionId = body.expeditionId ? parseInt(body.expeditionId, 10) : null;
    if (body.status === "submitted") {
      updates.status = "submitted";
      updates.reviewComment = null;
    }
  }

  const [updated] = await db.update(publications).set(updates).where(eq(publications.id, pubId)).returning();
  return NextResponse.json({ result: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pubId = parseInt(id, 10);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const row = await load(pubId);
  if (!row) return notFound();
  if (row.createdBy !== user.id && !isReviewer(user)) return forbidden();
  await db.delete(publications).where(eq(publications.id, pubId));
  return NextResponse.json({ ok: true });
}
