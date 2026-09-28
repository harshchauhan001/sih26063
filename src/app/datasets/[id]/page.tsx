import { db } from "@/db";
import { datasets, expeditions, publications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { REGION_LABELS, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const datasetId = parseInt(id, 10);
  if (Number.isNaN(datasetId)) notFound();

  const [dataset] = await db.select().from(datasets).where(eq(datasets.id, datasetId)).limit(1);
  if (!dataset || dataset.status !== "approved") notFound();

  const [expedition] = dataset.expeditionId
    ? await db.select().from(expeditions).where(eq(expeditions.id, dataset.expeditionId)).limit(1)
    : [];
  const [publication] = dataset.publicationId
    ? await db.select().from(publications).where(eq(publications.id, dataset.publicationId)).limit(1)
    : [];

  const canDownload = dataset.accessLevel === "public" && dataset.fileUrl;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
        {REGION_LABELS[dataset.region]} Dataset
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{dataset.title}</h1>
      <p className="mt-4 whitespace-pre-line text-slate-700">{dataset.description}</p>

      <dl className="mt-8 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-sm sm:grid-cols-3">
        <Info label="Provider" value={dataset.provider} />
        <Info label="Research Area" value={dataset.researchArea} />
        <Info label="Collection Period" value={dataset.collectionPeriod} />
        <Info label="Format" value={dataset.format} />
        <Info label="Size" value={dataset.size} />
        <Info label="Version" value={dataset.version} />
        <Info label="Access Level" value={dataset.accessLevel} />
        <Info label="Updated" value={formatDate(dataset.updatedAt)} />
      </dl>

      {dataset.metadata && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">Metadata</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">{dataset.metadata}</p>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {canDownload ? (
          <Link href={dataset.fileUrl!} target="_blank" className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
            ⬇ Download Dataset
          </Link>
        ) : dataset.fileUrl ? (
          <span className="rounded-full bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-700">
            🔒 Restricted — contact NCPOR for access
          </span>
        ) : null}
        {expedition && (
          <Link href={`/expeditions/${expedition.id}`} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            🧭 Related expedition: {expedition.title}
          </Link>
        )}
        {publication && (
          <Link href={`/research/${publication.id}`} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            📄 Related publication: {publication.title}
          </Link>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize text-slate-800">{value}</dd>
    </div>
  );
}
