import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expeditions } from "@/db/schema";
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
  const year = searchParams.get("year");
  const mine = searchParams.get("mine") === "1";
  const statusFilter = searchParams.get("status");

  const conditions = [];

  if (mine && user) {
    conditions.push(eq(expeditions.createdBy, user.id));
  } else if (statusFilter && isReviewer(user)) {
    conditions.push(eq(expeditions.status, statusFilter as "submitted" | "changes_requested"));
  } else {
    conditions.push(eq(expeditions.status, "approved"));
  }

  if (region) conditions.push(eq(expeditions.region, region as "arctic"));
  if (year) conditions.push(eq(expeditions.year, parseInt(year, 10)));
  if (q) {
    conditions.push(
      or(ilike(expeditions.title, `%${q}%`), ilike(expeditions.description, `%${q}%`)),
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(expeditions)
      .where(where)
      .orderBy(desc(expeditions.year), desc(expeditions.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(expeditions).where(where),
  ]);

  return NextResponse.json({
    results: rows,
    count: countRows[0]?.count ?? 0,
    page,
    pageSize,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const body = await req.json();
  if (!body.title || !body.year) return badRequest("Title and year are required.");

  const [row] = await db
    .insert(expeditions)
    .values({
      title: body.title,
      expeditionNumber: body.expeditionNumber || null,
      year: parseInt(body.year, 10),
      region: body.region || "antarctic",
      location: body.location || null,
      objectives: body.objectives || null,
      description: body.description || null,
      organizations: body.organizations || [],
      scientists: body.scientists || [],
      reportUrl: body.reportUrl || null,
      coverImageUrl: body.coverImageUrl || null,
      status: body.status === "submitted" ? "submitted" : "draft",
      createdBy: user.id,
    })
    .returning();

  return NextResponse.json({ result: row }, { status: 201 });
}
