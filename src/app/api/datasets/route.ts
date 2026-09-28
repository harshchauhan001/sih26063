import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { datasets } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, isReviewer, parsePage, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = await getCurrentUser();
  const { page, pageSize, offset } = parsePage(searchParams);
  const q = searchParams.get("q");
  const region = searchParams.get("region");
  const researchArea = searchParams.get("researchArea");
  const mine = searchParams.get("mine") === "1";
  const statusFilter = searchParams.get("status");

  const conditions = [];
  if (mine && user) {
    conditions.push(eq(datasets.createdBy, user.id));
  } else if (statusFilter && isReviewer(user)) {
    conditions.push(eq(datasets.status, statusFilter as "submitted"));
  } else {
    conditions.push(eq(datasets.status, "approved"));
  }

  if (region) conditions.push(eq(datasets.region, region as "arctic"));
  if (researchArea) conditions.push(ilike(datasets.researchArea, `%${researchArea}%`));
  if (q) {
    conditions.push(or(ilike(datasets.title, `%${q}%`), ilike(datasets.description, `%${q}%`)));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(datasets)
      .where(where)
      .orderBy(desc(datasets.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(datasets).where(where),
  ]);

  return NextResponse.json({ results: rows, count: countRows[0]?.count ?? 0, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json();
  if (!body.title) return badRequest("Title is required.");

  const [row] = await db
    .insert(datasets)
    .values({
      title: body.title,
      description: body.description || null,
      provider: body.provider || null,
      researchArea: body.researchArea || null,
      region: body.region || "antarctic",
      collectionPeriod: body.collectionPeriod || null,
      format: body.format || null,
      size: body.size || null,
      version: body.version || null,
      metadata: body.metadata || null,
      fileUrl: body.fileUrl || null,
      accessLevel: body.accessLevel || "public",
      expeditionId: body.expeditionId ? parseInt(body.expeditionId, 10) : null,
      publicationId: body.publicationId ? parseInt(body.publicationId, 10) : null,
      status: body.status === "submitted" ? "submitted" : "draft",
      createdBy: user.id,
    })
    .returning();

  return NextResponse.json({ result: row }, { status: 201 });
}
