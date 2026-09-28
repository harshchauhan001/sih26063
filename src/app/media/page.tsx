import { db } from "@/db";
import { media } from "@/db/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { MediaCard } from "@/components/cards";
import Pagination from "@/components/Pagination";
import FilterBar from "@/components/FilterBar";

export const dynamic = "force-dynamic";

const TYPES = [
  { value: "", label: "Photos & Videos" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Videos" },
];

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const mediaType = sp.mediaType || "";
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const pageSize = 12;

  const conditions = [eq(media.status, "approved")];
  if (mediaType) conditions.push(eq(media.mediaType, mediaType as "photo"));
  if (q) conditions.push(or(ilike(media.title, `%${q}%`), ilike(media.description, `%${q}%`))!);
  const where = and(...conditions);

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(media)
      .where(where)
      .orderBy(desc(media.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ count: sql<number>`count(*)::int` }).from(media).where(where),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Media Gallery</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Photographs and videos from Indian polar expeditions and research stations.
        </p>
      </header>

      <FilterBar fields={[{ name: "mediaType", label: "Type", options: TYPES }]} searchPlaceholder="Search media…" />

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No media matches your filters yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((m) => (
            <MediaCard key={m.id} item={m} />
          ))}
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} count={countRows[0]?.count ?? 0} />
    </main>
  );
}
