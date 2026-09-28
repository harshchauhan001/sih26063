import { db } from "@/db";
import { educationalContent } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { EducationCard } from "@/components/cards";
import Pagination from "@/components/Pagination";
import FilterBar from "@/components/FilterBar";

export const dynamic = "force-dynamic";

const TYPES = [
  { value: "", label: "All Types" },
  { value: "article", label: "Articles" },
  { value: "module", label: "Learning Modules" },
  { value: "glossary", label: "Glossary" },
  { value: "quiz", label: "Quizzes" },
];

export default async function EducationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const type = sp.type || "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const pageSize = 9;

  const conditions = [eq(educationalContent.status, "approved")];
  if (type) conditions.push(eq(educationalContent.type, type as "article"));
  if (q) conditions.push(or(ilike(educationalContent.title, `%${q}%`), ilike(educationalContent.summary, `%${q}%`))!);
  const where = and(...conditions);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(educationalContent)
      .where(where)
      .orderBy(desc(educationalContent.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(educationalContent).where(where),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Education Centre</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Beginner-friendly explainers, learning modules, glossary terms and quizzes about polar
          climate, ice, oceans, biodiversity and expeditions.
        </p>
      </header>

      <FilterBar fields={[{ name: "type", label: "Type", options: TYPES }]} searchPlaceholder="Search education content…" />

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No content matches your filters yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((e) => (
            <EducationCard key={e.id} item={e} />
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} count={countRows[0]?.count ?? 0} />
    </main>
  );
}
