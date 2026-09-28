import { db } from "@/db";
import { publications, datasets, expeditions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { DatasetCard } from "@/components/cards";

export const dynamic = "force-dynamic";

export default async function PublicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pubId = parseInt(id, 10);
  if (Number.isNaN(pubId)) notFound();

  const [publication] = await db.select().from(publications).where(eq(publications.id, pubId)).limit(1);
  if (!publication || publication.status !== "approved") notFound();

  const [expedition] = publication.expeditionId
    ? await db.select().from(expeditions).where(eq(expeditions.id, publication.expeditionId)).limit(1)
    : [];

  const relatedDatasets = await db
    .select()
    .from(datasets)
    .where(and(eq(datasets.publicationId, pubId), eq(datasets.status, "approved")));

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-700">
        {publication.researchArea || "Research Publication"} · {publication.year}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{publication.title}</h1>
      {publication.authors && publication.authors.length > 0 && (
        <p className="mt-2 text-slate-600">{publication.authors.join(", ")}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {publication.organization && <span className="rounded-full bg-slate-100 px-3 py-1">{publication.organization}</span>}
        {publication.doi && <span className="rounded-full bg-slate-100 px-3 py-1">DOI: {publication.doi}</span>}
        <span className="rounded-full bg-slate-100 px-3 py-1">Updated {formatDate(publication.updatedAt)}</span>
      </div>

      {publication.abstract && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">Abstract</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">{publication.abstract}</p>
        </section>
      )}

      {publication.keywords && publication.keywords.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {publication.keywords.map((k) => (
            <span key={k} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
              #{k}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {publication.fileUrl && (
          <Link href={publication.fileUrl} target="_blank" className="rounded-full bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">
            📄 Download PDF
          </Link>
        )}
        {expedition && (
          <Link href={`/expeditions/${expedition.id}`} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            🧭 View related expedition: {expedition.title}
          </Link>
        )}
      </div>

      {relatedDatasets.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900">Related Datasets</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {relatedDatasets.map((d) => (
              <DatasetCard key={d.id} item={d} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
