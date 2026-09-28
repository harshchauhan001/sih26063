import { NextResponse } from "next/server";
import type { SafeUser } from "@/lib/auth";

export function isReviewer(user: SafeUser | null): boolean {
  return !!user && (user.role === "admin" || user.role === "content_manager");
}

export function unauthorized() {
  return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "You do not have permission to do this." }, { status: 403 });
}

export function notFound() {
  return NextResponse.json({ error: "Not found." }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function parsePage(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") ?? "12", 10) || 12));
  return { page, pageSize, offset: (page - 1) * pageSize };
}
