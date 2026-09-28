import { db } from "@/db";
import { publications } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { PublicationCard } from "@/components/cards";
import Pagination from "@/components/Pagination";
import FilterBar from "@/components/FilterBar";

export const dynamic = "force-dynamic";

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const year = sp.year || "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const pageSize = 9;

  const conditions = [eq(publications.status, "approved")];
  if (year) conditions.push(eq(publications.year, parseInt(year, 10)));
  if (q) conditions.push(or(ilike(publications.title, `%${q}%`), ilike(publications.abstract, `%${q}%`))!);
  const where = and(...conditions);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(publications)
      .where(where)
      .orderBy(desc(publications.year))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(publications).where(where),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Research &amp; Publication Repository</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Scientific papers, reports and institutional publications from Indian polar science
          programmes.
        </p>
      </header>

      <FilterBar fields={[]} showYear searchPlaceholder="Search publications, authors, topics…" />

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No publications match your filters yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((p) => (
            <PublicationCard key={p.id} item={p} />
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} count={countRows[0]?.count ?? 0} />
    </main>
  );
}
