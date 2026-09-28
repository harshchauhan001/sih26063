import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiJobs } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { isReviewer, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");

  const conditions = [];
  if (isReviewer(user) && searchParams.get("all") === "1") {
    if (statusFilter) conditions.push(eq(aiJobs.status, statusFilter as "submitted"));
  } else {
    conditions.push(eq(aiJobs.createdBy, user.id));
    if (statusFilter) conditions.push(eq(aiJobs.status, statusFilter as "submitted"));
  }

  const rows = await db
    .select()
    .from(aiJobs)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(aiJobs.createdAt));

  return NextResponse.json({ results: rows });
}
