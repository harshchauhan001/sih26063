import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { aiJobs } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { badRequest, unauthorized } from "@/lib/api-helpers";
import { generateAiContent } from "@/lib/ai";
import { extractTextFromFile } from "@/lib/extractText";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const contentType = req.headers.get("content-type") || "";
  let sourceText = "";
  let sourceTitle = "";
  let sourceFileName: string | null = null;
  let requestedOutputs: string[] = [
    "summary",
    "keywords",
    "article",
    "educationalExplanation",
    "socialPost",
  ];

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      sourceTitle = (form.get("sourceTitle") as string) || "";
      const pastedText = (form.get("sourceText") as string) || "";
      const file = form.get("file") as File | null;
      const outputsRaw = form.get("outputs") as string | null;
      if (outputsRaw) {
        try {
          requestedOutputs = JSON.parse(outputsRaw);
        } catch {
          /* keep defaults */
        }
      }

      if (file && file.size > 0) {
        if (file.size > 15 * 1024 * 1024) return badRequest("File is too large (max 15MB).");
        sourceFileName = file.name;
        sourceText = await extractTextFromFile(file);
      } else {
        sourceText = pastedText;
      }
    } else {
      const body = await req.json();
      sourceTitle = body.sourceTitle || "";
      sourceText = body.sourceText || "";
      if (Array.isArray(body.outputs)) requestedOutputs = body.outputs;
    }
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : "Could not read uploaded document.");
  }

  if (!sourceText || sourceText.trim().length < 40) {
    return badRequest(
      "Please provide at least a few sentences of source material (paste text or upload a .txt/.md/.pdf file).",
    );
  }

  const generated = await generateAiContent(sourceText, sourceTitle);

  const [job] = await db
    .insert(aiJobs)
    .values({
      sourceTitle: sourceTitle || null,
      sourceText,
      sourceFileName,
      requestedOutputs,
      model: generated.model,
      generatedTitle: generated.generatedTitle,
      summary: generated.summary,
      keyPoints: generated.keyPoints,
      keywords: generated.keywords,
      article: generated.article,
      educationalExplanation: generated.educationalExplanation,
      socialPost: generated.socialPost,
      suggestedTags: generated.suggestedTags,
      suggestedCategory: generated.suggestedCategory,
      createdBy: user.id,
      status: "draft",
    })
    .returning();

  return NextResponse.json({ result: job }, { status: 201 });
}
