import { db } from "@/db";
import { educationalContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import QuizPlayer from "@/components/QuizPlayer";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  article: "Article",
  module: "Learning Module",
  glossary: "Glossary",
  quiz: "Quiz",
};

export default async function EducationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contentId = parseInt(id, 10);
  if (Number.isNaN(contentId)) notFound();

  const [item] = await db.select().from(educationalContent).where(eq(educationalContent.id, contentId)).limit(1);
  if (!item || item.status !== "approved") notFound();

  const quiz = item.type === "quiz" ? (item.quizData as { questions?: { question: string; options: string[]; answerIndex: number }[] } | null) : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-indigo-700">
        <span className="rounded-full bg-indigo-50 px-3 py-1">{TYPE_LABEL[item.type] ?? item.type}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 capitalize text-slate-600">{item.difficulty}</span>
        {item.isAiGenerated && (
          <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">
            ✨ AI-assisted content — reviewed and approved by NCPOR editors
          </span>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-bold text-slate-900">{item.title}</h1>
      {item.summary && <p className="mt-3 text-lg text-slate-600">{item.summary}</p>}
      <p className="mt-2 text-xs text-slate-400">Last updated {formatDate(item.updatedAt)}</p>

      {item.tags && item.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.map((t) => (
            <span key={t} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
              #{t}
            </span>
          ))}
        </div>
      )}

      {item.type === "quiz" && quiz?.questions?.length ? (
        <div className="mt-8">
          <QuizPlayer questions={quiz.questions} />
        </div>
      ) : (
        item.content && (
          <article className="prose prose-slate mt-8 max-w-none whitespace-pre-line text-slate-800">
            {item.content}
          </article>
        )
      )}
    </main>
  );
}
