import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expeditions, publications, datasets, media } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, forbidden, isReviewer, notFound, unauthorized } from "@/lib/api-helpers";

async function loadExpedition(id: number) {
  const [row] = await db.select().from(expeditions).where(eq(expeditions.id, id)).limit(1);
  return row;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const expeditionId = parseInt(id, 10);
  const user = await getCurrentUser();
  const row = await loadExpedition(expeditionId);
  if (!row) return notFound();

  const isOwner = user && row.createdBy === user.id;
  if (row.status !== "approved" && !isOwner && !isReviewer(user)) return notFound();

  const [relatedPublications, relatedDatasets, relatedMedia] = await Promise.all([
    db
      .select()
      .from(publications)
      .where(and(eq(publications.expeditionId, expeditionId), eq(publications.status, "approved"))),
    db
      .select()
      .from(datasets)
      .where(and(eq(datasets.expeditionId, expeditionId), eq(datasets.status, "approved"))),
    db
      .select()
      .from(media)
      .where(and(eq(media.expeditionId, expeditionId), eq(media.status, "approved"))),
  ]);

  return NextResponse.json({
    result: row,
    related: { publications: relatedPublications, datasets: relatedDatasets, media: relatedMedia },
  });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const expeditionId = parseInt(id, 10);
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const row = await loadExpedition(expeditionId);
  if (!row) return notFound();

  const body = await req.json();
  const isOwner = row.createdBy === user.id;
  const reviewer = isReviewer(user);

  if (!isOwner && !reviewer) return forbidden();

  const updates: Partial<typeof expeditions.$inferInsert> = { updatedAt: new Date() };

  if (reviewer && body.reviewAction) {
    if (body.reviewAction === "approve") updates.status = "approved";
    else if (body.reviewAction === "reject") updates.status = "rejected";
    else if (body.reviewAction === "request_changes") updates.status = "changes_requested";
    else return badRequest("Invalid review action.");
    updates.reviewedBy = user.id;
    updates.reviewComment = body.reviewComment || null;
  } else if (isOwner) {
    if (row.status === "approved" && !reviewer) return forbidden();
    const fields = [
      "title",
      "expeditionNumber",
      "location",
      "objectives",
      "description",
      "reportUrl",
      "coverImageUrl",
    ] as const;
    for (const f of fields) if (body[f] !== undefined) (updates as Record<string, unknown>)[f] = body[f];
    if (body.year !== undefined) updates.year = parseInt(body.year, 10);
    if (body.region !== undefined) updates.region = body.region;
    if (body.organizations !== undefined) updates.organizations = body.organizations;
    if (body.scientists !== undefined) updates.scientists = body.scientists;
    if (body.status === "submitted") {
      updates.status = "submitted";
      updates.reviewComment = null;
    }
  }

  const [updated] = await db
    .update(expeditions)
    .set(updates)
    .where(eq(expeditions.id, expeditionId))
    .returning();

  return NextResponse.json({ result: updated });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const expeditionId = parseInt(id, 10);
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const row = await loadExpedition(expeditionId);
  if (!row) return notFound();
  if (row.createdBy !== user.id && !isReviewer(user)) return forbidden();

  await db.delete(expeditions).where(eq(expeditions.id, expeditionId));
  return NextResponse.json({ ok: true });
}
