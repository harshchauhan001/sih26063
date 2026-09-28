import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { publications } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, isReviewer, parsePage, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = await getCurrentUser();
  const { page, pageSize, offset } = parsePage(searchParams);
  const q = searchParams.get("q");
  const researchArea = searchParams.get("researchArea");
  const year = searchParams.get("year");
  const mine = searchParams.get("mine") === "1";
  const statusFilter = searchParams.get("status");

  const conditions = [];
  if (mine && user) {
    conditions.push(eq(publications.createdBy, user.id));
  } else if (statusFilter && isReviewer(user)) {
    conditions.push(eq(publications.status, statusFilter as "submitted"));
  } else {
    conditions.push(eq(publications.status, "approved"));
  }

  if (researchArea) conditions.push(ilike(publications.researchArea, `%${researchArea}%`));
  if (year) conditions.push(eq(publications.year, parseInt(year, 10)));
  if (q) {
    conditions.push(
      or(ilike(publications.title, `%${q}%`), ilike(publications.abstract, `%${q}%`)),
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(publications)
      .where(where)
      .orderBy(desc(publications.year), desc(publications.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(publications).where(where),
  ]);

  return NextResponse.json({ results: rows, count: countRows[0]?.count ?? 0, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json();
  if (!body.title || !body.year) return badRequest("Title and year are required.");

  const [row] = await db
    .insert(publications)
    .values({
      title: body.title,
      abstract: body.abstract || null,
      authors: body.authors || [],
      year: parseInt(body.year, 10),
      researchArea: body.researchArea || null,
      keywords: body.keywords || [],
      organization: body.organization || null,
      doi: body.doi || null,
      fileUrl: body.fileUrl || null,
      expeditionId: body.expeditionId ? parseInt(body.expeditionId, 10) : null,
      status: body.status === "submitted" ? "submitted" : "draft",
      createdBy: user.id,
    })
    .returning();

  return NextResponse.json({ result: row }, { status: 201 });
}
