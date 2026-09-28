import { db } from "@/db";
import { expeditions } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { ExpeditionCard } from "@/components/cards";
import Pagination from "@/components/Pagination";
import FilterBar from "@/components/FilterBar";

export const dynamic = "force-dynamic";

const REGIONS = [
  { value: "", label: "All Regions" },
  { value: "antarctic", label: "Antarctic" },
  { value: "arctic", label: "Arctic" },
  { value: "himalaya", label: "Himalaya" },
  { value: "southern_ocean", label: "Southern Ocean" },
];

export default async function ExpeditionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const region = sp.region || "";
  const year = sp.year || "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const pageSize = 9;

  const conditions = [eq(expeditions.status, "approved")];
  if (region) conditions.push(eq(expeditions.region, region as "arctic"));
  if (year) conditions.push(eq(expeditions.year, parseInt(year, 10)));
  if (q) conditions.push(or(ilike(expeditions.title, `%${q}%`), ilike(expeditions.description, `%${q}%`))!);
  const where = and(...conditions);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(expeditions)
      .where(where)
      .orderBy(desc(expeditions.year))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(expeditions).where(where),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Expedition Repository</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Browse Indian Antarctic, Arctic and Himalayan expeditions with linked reports, publications,
          datasets and media.
        </p>
      </header>

      <FilterBar
        searchPlaceholder="Search expeditions…"
        fields={[{ name: "region", label: "Region", options: REGIONS }]}
        showYear
      />

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No expeditions match your filters yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((e) => (
            <ExpeditionCard key={e.id} item={e} />
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} count={countRows[0]?.count ?? 0} />
    </main>
  );
}
