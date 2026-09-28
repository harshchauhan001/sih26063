import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { media } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, isReviewer, parsePage, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = await getCurrentUser();
  const { page, pageSize, offset } = parsePage(searchParams);
  const q = searchParams.get("q");
  const mediaType = searchParams.get("mediaType");
  const category = searchParams.get("category");
  const mine = searchParams.get("mine") === "1";
  const statusFilter = searchParams.get("status");

  const conditions = [];
  if (mine && user) {
    conditions.push(eq(media.createdBy, user.id));
  } else if (statusFilter && isReviewer(user)) {
    conditions.push(eq(media.status, statusFilter as "submitted"));
  } else {
    conditions.push(eq(media.status, "approved"));
  }

  if (mediaType) conditions.push(eq(media.mediaType, mediaType as "photo"));
  if (category) conditions.push(eq(media.category, category));
  if (q) {
    conditions.push(or(ilike(media.title, `%${q}%`), ilike(media.description, `%${q}%`)));
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(media)
      .where(where)
      .orderBy(desc(media.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(media).where(where),
  ]);

  return NextResponse.json({ results: rows, count: countRows[0]?.count ?? 0, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json();
  if (!body.title || !body.fileUrl) return badRequest("Title and file are required.");

  const [row] = await db
    .insert(media)
    .values({
      title: body.title,
      mediaType: body.mediaType || "photo",
      description: body.description || null,
      fileUrl: body.fileUrl,
      thumbnailUrl: body.thumbnailUrl || body.fileUrl,
      category: body.category || null,
      expeditionId: body.expeditionId ? parseInt(body.expeditionId, 10) : null,
      location: body.location || null,
      capturedOn: body.capturedOn || null,
      credits: body.credits || null,
      accessLevel: body.accessLevel || "public",
      status: body.status === "submitted" ? "submitted" : "draft",
      createdBy: user.id,
    })
    .returning();

  return NextResponse.json({ result: row }, { status: 201 });
}
