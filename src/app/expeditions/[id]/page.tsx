import { db } from "@/db";
import { expeditions, publications, datasets, media } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { REGION_LABELS, formatDate } from "@/lib/format";
import { PublicationCard, DatasetCard, MediaCard } from "@/components/cards";

export const dynamic = "force-dynamic";

export default async function ExpeditionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const expeditionId = parseInt(id, 10);
  if (Number.isNaN(expeditionId)) notFound();

  const [expedition] = await db.select().from(expeditions).where(eq(expeditions.id, expeditionId)).limit(1);
  if (!expedition || expedition.status !== "approved") notFound();

  const [relatedPublications, relatedDatasets, relatedMedia] = await Promise.all([
    db.select().from(publications).where(and(eq(publications.expeditionId, expeditionId), eq(publications.status, "approved"))),
    db.select().from(datasets).where(and(eq(datasets.expeditionId, expeditionId), eq(datasets.status, "approved"))),
    db.select().from(media).where(and(eq(media.expeditionId, expeditionId), eq(media.status, "approved"))),
  ]);

  return (
    <main>
      <div className="relative h-64 w-full overflow-hidden bg-gradient-to-br from-blue-950 to-cyan-800 sm:h-80">
        {expedition.coverImageUrl && (
          <Image src={expedition.coverImageUrl} alt={expedition.title} fill className="object-cover opacity-80" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-end px-4 pb-8 text-white sm:px-6">
          <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
            {REGION_LABELS[expedition.region] ?? expedition.region} · {expedition.year}
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{expedition.title}</h1>
          {expedition.location && <p className="mt-1 text-slate-200">{expedition.location}</p>}
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {expedition.objectives && (
            <>
              <h2 className="text-lg font-semibold text-slate-900">Objectives</h2>
              <p className="mt-2 whitespace-pre-line text-slate-700">{expedition.objectives}</p>
            </>
          )}
          {expedition.description && (
            <>
              <h2 className="mt-6 text-lg font-semibold text-slate-900">Overview</h2>
              <p className="mt-2 whitespace-pre-line text-slate-700">{expedition.description}</p>
            </>
          )}

          {relatedPublications.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">Related Publications</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {relatedPublications.map((p) => (
                  <PublicationCard key={p.id} item={p} />
                ))}
              </div>
            </section>
          )}

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

          {relatedMedia.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900">Photographs &amp; Videos</h2>
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {relatedMedia.map((m) => (
                  <MediaCard key={m.id} item={m} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-900">Expedition Details</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {expedition.expeditionNumber && (
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-500">Expedition No.</dt>
                  <dd className="font-medium text-slate-800">{expedition.expeditionNumber}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Year</dt>
                <dd className="font-medium text-slate-800">{expedition.year}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Region</dt>
                <dd className="font-medium text-slate-800">{REGION_LABELS[expedition.region]}</dd>
              </div>
              {expedition.organizations && expedition.organizations.length > 0 && (
                <div>
                  <dt className="text-slate-500">Organizations</dt>
                  <dd className="mt-1 font-medium text-slate-800">{expedition.organizations.join(", ")}</dd>
                </div>
              )}
              {expedition.scientists && expedition.scientists.length > 0 && (
                <div>
                  <dt className="text-slate-500">Scientists</dt>
                  <dd className="mt-1 font-medium text-slate-800">{expedition.scientists.join(", ")}</dd>
                </div>
              )}
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">Updated</dt>
                <dd className="font-medium text-slate-800">{formatDate(expedition.updatedAt)}</dd>
              </div>
            </dl>
          </div>

          {expedition.reportUrl && (
            <Link
              href={expedition.reportUrl}
              target="_blank"
              className="block rounded-2xl bg-cyan-700 p-4 text-center text-sm font-semibold text-white hover:bg-cyan-800"
            >
              📄 Download Expedition Report
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}
