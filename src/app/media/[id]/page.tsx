import { db } from "@/db";
import { media, expeditions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const mediaId = parseInt(id, 10);
  if (Number.isNaN(mediaId)) notFound();

  const [item] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  if (!item || item.status !== "approved") notFound();

  const [expedition] = item.expeditionId
    ? await db.select().from(expeditions).where(eq(expeditions.id, item.expeditionId)).limit(1)
    : [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="overflow-hidden rounded-2xl bg-slate-900">
        {item.mediaType === "video" ? (
          <video src={item.fileUrl} controls className="max-h-[560px] w-full bg-black" poster={item.thumbnailUrl || undefined} />
        ) : (
          <div className="relative aspect-video w-full">
            <Image src={item.fileUrl} alt={item.title} fill className="object-contain" />
          </div>
        )}
      </div>

      <h1 className="mt-6 text-2xl font-bold text-slate-900">{item.title}</h1>
      {item.description && <p className="mt-2 whitespace-pre-line text-slate-700">{item.description}</p>}

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm sm:grid-cols-4">
        <Info label="Location" value={item.location} />
        <Info label="Date" value={item.capturedOn} />
        <Info label="Credits" value={item.credits} />
        <Info label="Updated" value={formatDate(item.updatedAt)} />
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        {item.accessLevel === "public" && (
          <Link href={item.fileUrl} target="_blank" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
            ⬇ Download
          </Link>
        )}
        {expedition && (
          <Link href={`/expeditions/${expedition.id}`} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            🧭 Related expedition: {expedition.title}
          </Link>
        )}
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
    </div>
  );
}
