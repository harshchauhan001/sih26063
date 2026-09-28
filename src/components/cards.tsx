import Link from "next/link";
import Image from "next/image";
import { REGION_LABELS, truncate } from "@/lib/format";

type Expedition = {
  id: number;
  title: string;
  year: number;
  region: string;
  location: string | null;
  description: string | null;
  coverImageUrl: string | null;
};

export function ExpeditionCard({ item }: { item: Expedition }) {
  return (
    <Link
      href={`/expeditions/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-cyan-700 to-blue-950">
        {item.coverImageUrl && (
          <Image
            src={item.coverImageUrl}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition group-hover:scale-105"
          />
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
          {REGION_LABELS[item.region] ?? item.region} · {item.year}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-cyan-800">{item.title}</h3>
        {item.location && <p className="mt-1 text-xs text-slate-500">{item.location}</p>}
        <p className="mt-2 flex-1 text-sm text-slate-600">{truncate(item.description, 120)}</p>
      </div>
    </Link>
  );
}

type Publication = {
  id: number;
  title: string;
  abstract: string | null;
  authors: string[] | null;
  year: number;
  researchArea: string | null;
};

export function PublicationCard({ item }: { item: Publication }) {
  return (
    <Link
      href={`/research/${item.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-cyan-700">
        <span>📄 {item.researchArea || "Research"}</span>
        <span className="text-slate-300">•</span>
        <span>{item.year}</span>
      </div>
      <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-cyan-800">{item.title}</h3>
      {item.authors && item.authors.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">{item.authors.join(", ")}</p>
      )}
      <p className="mt-2 flex-1 text-sm text-slate-600">{truncate(item.abstract, 140)}</p>
    </Link>
  );
}

type Dataset = {
  id: number;
  title: string;
  description: string | null;
  region: string;
  researchArea: string | null;
  format: string | null;
  accessLevel: string;
};

export function DatasetCard({ item }: { item: Dataset }) {
  return (
    <Link
      href={`/datasets/${item.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-700">
        <span>🗄 {REGION_LABELS[item.region] ?? item.region}</span>
        {item.format && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">{item.format}</span>
        )}
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{item.accessLevel}</span>
      </div>
      <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-cyan-800">{item.title}</h3>
      {item.researchArea && <p className="mt-1 text-xs text-slate-500">{item.researchArea}</p>}
      <p className="mt-2 flex-1 text-sm text-slate-600">{truncate(item.description, 130)}</p>
    </Link>
  );
}

type Media = {
  id: number;
  title: string;
  mediaType: string;
  fileUrl: string;
  thumbnailUrl: string | null;
  location: string | null;
};

export function MediaCard({ item }: { item: Media }) {
  return (
    <Link
      href={`/media/${item.id}`}
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <Image
        src={item.thumbnailUrl || item.fileUrl}
        alt={item.title}
        fill
        sizes="(max-width: 768px) 50vw, 25vw"
        className="object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      {item.mediaType === "video" && (
        <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-sm">▶</span>
      )}
      <div className="relative p-3">
        <p className="line-clamp-2 text-sm font-semibold text-white">{item.title}</p>
        {item.location && <p className="text-xs text-slate-200">{item.location}</p>}
      </div>
    </Link>
  );
}

type Education = {
  id: number;
  title: string;
  type: string;
  summary: string | null;
  difficulty: string;
  isAiGenerated: boolean;
};

export function EducationCard({ item }: { item: Education }) {
  const typeIcon: Record<string, string> = { article: "📘", module: "🧩", glossary: "📖", quiz: "❓" };
  return (
    <Link
      href={`/education/${item.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-indigo-700">
        <span>{typeIcon[item.type] ?? "📘"} {item.type}</span>
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 capitalize text-indigo-700">{item.difficulty}</span>
        {item.isAiGenerated && (
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">AI-assisted</span>
        )}
      </div>
      <h3 className="mt-2 text-base font-semibold text-slate-900 group-hover:text-cyan-800">{item.title}</h3>
      <p className="mt-2 flex-1 text-sm text-slate-600">{truncate(item.summary, 130)}</p>
    </Link>
  );
}
