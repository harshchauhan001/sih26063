import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, forbidden, notFound, unauthorized } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userId = parseInt(id, 10);
  const currentUser = await getCurrentUser();
  if (!currentUser) return unauthorized();
  if (currentUser.role !== "admin") return forbidden();

  const body = await req.json();
  const updates: Partial<typeof users.$inferInsert> = {};
  if (body.role && ["researcher", "content_manager", "admin"].includes(body.role)) {
    updates.role = body.role;
  }
  if (body.status && ["active", "suspended"].includes(body.status)) {
    updates.status = body.status;
  }
  if (Object.keys(updates).length === 0) return badRequest("Nothing to update.");

  const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!existing) return notFound();

  const [updated] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning({ id: users.id, name: users.name, role: users.role, status: users.status });

  return NextResponse.json({ result: updated });
}
