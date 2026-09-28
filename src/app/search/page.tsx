import Link from "next/link";
import { db } from "@/db";
import { expeditions, publications, datasets, media, educationalContent } from "@/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import SearchBar from "@/components/SearchBar";
import { truncate } from "@/lib/format";

export const dynamic = "force-dynamic";

const TYPE_TABS = [
  { value: "", label: "All" },
  { value: "expedition", label: "Expeditions" },
  { value: "publication", label: "Publications" },
  { value: "dataset", label: "Datasets" },
  { value: "media", label: "Media" },
  { value: "education", label: "Education" },
];

const TYPE_META: Record<string, { icon: string; href: (id: number) => string; label: string }> = {
  expedition: { icon: "🧭", href: (id) => `/expeditions/${id}`, label: "Expedition" },
  publication: { icon: "📄", href: (id) => `/research/${id}`, label: "Publication" },
  dataset: { icon: "🗄", href: (id) => `/datasets/${id}`, label: "Dataset" },
  media: { icon: "🖼", href: (id) => `/media/${id}`, label: "Media" },
  education: { icon: "🎓", href: (id) => `/education/${id}`, label: "Education" },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const type = sp.type || "";

  const like = `%${q}%`;
  const results: { id: number; type: string; title: string; description: string | null }[] = [];

  if (!type || type === "expedition") {
    const conds = [eq(expeditions.status, "approved")];
    if (q) conds.push(or(ilike(expeditions.title, like), ilike(expeditions.description, like))!);
    const rows = await db.select().from(expeditions).where(and(...conds)).limit(30);
    results.push(...rows.map((r) => ({ id: r.id, type: "expedition", title: r.title, description: r.description })));
  }
  if (!type || type === "publication") {
    const conds = [eq(publications.status, "approved")];
    if (q) conds.push(or(ilike(publications.title, like), ilike(publications.abstract, like))!);
    const rows = await db.select().from(publications).where(and(...conds)).limit(30);
    results.push(...rows.map((r) => ({ id: r.id, type: "publication", title: r.title, description: r.abstract })));
  }
  if (!type || type === "dataset") {
    const conds = [eq(datasets.status, "approved")];
    if (q) conds.push(or(ilike(datasets.title, like), ilike(datasets.description, like))!);
    const rows = await db.select().from(datasets).where(and(...conds)).limit(30);
    results.push(...rows.map((r) => ({ id: r.id, type: "dataset", title: r.title, description: r.description })));
  }
  if (!type || type === "media") {
    const conds = [eq(media.status, "approved")];
    if (q) conds.push(or(ilike(media.title, like), ilike(media.description, like))!);
    const rows = await db.select().from(media).where(and(...conds)).limit(30);
    results.push(...rows.map((r) => ({ id: r.id, type: "media", title: r.title, description: r.description })));
  }
  if (!type || type === "education") {
    const conds = [eq(educationalContent.status, "approved")];
    if (q) conds.push(or(ilike(educationalContent.title, like), ilike(educationalContent.summary, like))!);
    const rows = await db.select().from(educationalContent).where(and(...conds)).limit(30);
    results.push(...rows.map((r) => ({ id: r.id, type: "education", title: r.title, description: r.summary })));
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">Search the Polar Science Portal</h1>
      <p className="mt-2 text-slate-600">
        Search across expeditions, publications, datasets, media and educational content.
      </p>

      <div className="mt-6">
        <SearchBar />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/search?${new URLSearchParams({ ...(q ? { q } : {}), ...(tab.value ? { type: tab.value } : {}) }).toString()}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              type === tab.value ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {q && (
        <p className="mt-4 text-sm text-slate-500">
          {results.length} result{results.length === 1 ? "" : "s"} for &quot;{q}&quot;
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {results.map((r) => {
          const meta = TYPE_META[r.type];
          return (
            <li key={`${r.type}-${r.id}`} className="rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-sm">
              <Link href={meta.href(r.id)} className="flex items-start gap-3">
                <span className="text-xl">{meta.icon}</span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-cyan-700">{meta.label}</span>
                  <span className="block font-semibold text-slate-900">{r.title}</span>
                  <span className="block text-sm text-slate-600">{truncate(r.description, 150)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {results.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          {q ? "No results found. Try a different search term." : "Start typing to search the portal."}
        </p>
      )}
    </main>
  );
}
