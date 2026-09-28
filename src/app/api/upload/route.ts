import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ALLOWED_EXTENSIONS = new Set([
  ".pdf",
  ".csv",
  ".xlsx",
  ".xls",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".mov",
  ".webm",
  ".txt",
  ".md",
  ".doc",
  ".docx",
]);

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

function safeExt(name: string) {
  const ext = path.extname(name).toLowerCase();
  return ALLOWED_EXTENSIONS.has(ext) ? ext : null;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return badRequest("No file provided.");
  if (file.size === 0) return badRequest("The uploaded file is empty.");
  if (file.size > MAX_SIZE) return badRequest("File exceeds the 50MB upload limit.");

  const ext = safeExt(file.name);
  if (!ext) return badRequest("Unsupported file type.");

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const safeName = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, safeName), buffer);

  return NextResponse.json({ url: `/uploads/${safeName}`, name: file.name, size: file.size });
}
