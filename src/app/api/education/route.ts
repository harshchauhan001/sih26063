import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { educationalContent } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, isReviewer, parsePage, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user = await getCurrentUser();
  const { page, pageSize, offset } = parsePage(searchParams);
  const q = searchParams.get("q");
  const type = searchParams.get("type");
  const difficulty = searchParams.get("difficulty");
  const mine = searchParams.get("mine") === "1";
  const statusFilter = searchParams.get("status");

  const conditions = [];
  if (mine && user) {
    conditions.push(eq(educationalContent.createdBy, user.id));
  } else if (statusFilter && isReviewer(user)) {
    conditions.push(eq(educationalContent.status, statusFilter as "submitted"));
  } else {
    conditions.push(eq(educationalContent.status, "approved"));
  }

  if (type) conditions.push(eq(educationalContent.type, type as "article"));
  if (difficulty) conditions.push(eq(educationalContent.difficulty, difficulty as "beginner"));
  if (q) {
    conditions.push(
      or(ilike(educationalContent.title, `%${q}%`), ilike(educationalContent.summary, `%${q}%`)),
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(educationalContent)
      .where(where)
      .orderBy(desc(educationalContent.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(educationalContent).where(where),
  ]);

  return NextResponse.json({ results: rows, count: countRows[0]?.count ?? 0, page, pageSize });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const body = await req.json();
  if (!body.title) return badRequest("Title is required.");

  const [row] = await db
    .insert(educationalContent)
    .values({
      title: body.title,
      type: body.type || "article",
      summary: body.summary || null,
      content: body.content || null,
      difficulty: body.difficulty || "beginner",
      tags: body.tags || [],
      quizData: body.quizData || null,
      coverImageUrl: body.coverImageUrl || null,
      isAiGenerated: !!body.isAiGenerated,
      status: body.status === "submitted" ? "submitted" : "draft",
      createdBy: user.id,
    })
    .returning();

  return NextResponse.json({ result: row }, { status: 201 });
}
