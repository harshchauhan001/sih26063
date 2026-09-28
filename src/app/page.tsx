import Link from "next/link";
import { db } from "@/db";
import { expeditions, publications, datasets, media, educationalContent } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import SearchBar from "@/components/SearchBar";
import { ExpeditionCard, PublicationCard, DatasetCard, MediaCard, EducationCard } from "@/components/cards";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredExpeditions, latestPublications, featuredDatasets, latestMedia, educationHighlights, latestNews] =
    await Promise.all([
      db
        .select()
        .from(expeditions)
        .where(eq(expeditions.status, "approved"))
        .orderBy(desc(expeditions.year))
        .limit(3),
      db
        .select()
        .from(publications)
        .where(eq(publications.status, "approved"))
        .orderBy(desc(publications.year))
        .limit(3),
      db
        .select()
        .from(datasets)
        .where(eq(datasets.status, "approved"))
        .orderBy(desc(datasets.createdAt))
        .limit(3),
      db
        .select()
        .from(media)
        .where(eq(media.status, "approved"))
        .orderBy(desc(media.createdAt))
        .limit(4),
      db
        .select()
        .from(educationalContent)
        .where(eq(educationalContent.status, "approved"))
        .orderBy(desc(educationalContent.createdAt))
        .limit(3),
      db
        .select()
        .from(educationalContent)
        .where(eq(educationalContent.status, "approved"))
        .orderBy(desc(educationalContent.createdAt))
        .limit(4),
    ]);

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-900 text-white">
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
            National Centre for Polar and Ocean Research
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            Discover, understand and share India&apos;s polar science.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">
            A single home for Indian polar expeditions, research publications, scientific datasets,
            photographs, videos and AI-assisted outreach — from Antarctica to the Arctic and the
            Himalaya.
          </p>
          <div className="mt-8 max-w-xl">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            {[
              { href: "/expeditions", label: "🧭 Expeditions" },
              { href: "/research", label: "📄 Publications" },
              { href: "/datasets", label: "🗄 Datasets" },
              { href: "/media", label: "🖼 Media Gallery" },
              { href: "/education", label: "🎓 Education" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-white/30 bg-white/10 px-4 py-2 font-medium backdrop-blur transition hover:bg-white/20"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Section
        title="Featured Expeditions"
        subtitle="Chronicles from India's Antarctic, Arctic and Himalayan expeditions."
        href="/expeditions"
      >
        {featuredExpeditions.length === 0 ? (
          <EmptyState label="No expeditions published yet." />
        ) : (
          <Grid>
            {featuredExpeditions.map((e) => (
              <ExpeditionCard key={e.id} item={e} />
            ))}
          </Grid>
        )}
      </Section>

      <Section
        title="Latest Research & Publications"
        subtitle="Peer-reviewed and institutional publications from Indian polar scientists."
        href="/research"
        tone="light"
      >
        {latestPublications.length === 0 ? (
          <EmptyState label="No publications published yet." />
        ) : (
          <Grid>
            {latestPublications.map((p) => (
              <PublicationCard key={p.id} item={p} />
            ))}
          </Grid>
        )}
      </Section>

      <Section title="Featured Datasets" subtitle="Structured, citable polar research data." href="/datasets">
        {featuredDatasets.length === 0 ? (
          <EmptyState label="No datasets published yet." />
        ) : (
          <Grid>
            {featuredDatasets.map((d) => (
              <DatasetCard key={d.id} item={d} />
            ))}
          </Grid>
        )}
      </Section>

      <Section
        title="Photographs & Videos"
        subtitle="Field imagery from expeditions and research stations."
        href="/media"
        tone="light"
      >
        {latestMedia.length === 0 ? (
          <EmptyState label="No media published yet." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {latestMedia.map((m) => (
              <MediaCard key={m.id} item={m} />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Educational Highlights"
        subtitle="Beginner-friendly explainers, learning modules and quizzes."
        href="/education"
      >
        {educationHighlights.length === 0 ? (
          <EmptyState label="No educational content published yet." />
        ) : (
          <Grid>
            {educationHighlights.map((e) => (
              <EducationCard key={e.id} item={e} />
            ))}
          </Grid>
        )}
      </Section>

      <Section
        title="Latest News & Updates"
        subtitle="Public-friendly articles produced with human-reviewed AI assistance from source reports."
        href="/education"
        tone="light"
      >
        {latestNews.length === 0 ? (
          <EmptyState label="No news updates published yet." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {latestNews.map((n) => (
              <li key={n.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <Link href={`/education/${n.id}`} className="font-semibold text-slate-900 hover:text-cyan-800">
                  {n.title}
                </Link>
                {n.isAiGenerated && (
                  <span className="ml-2 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                    AI-assisted
                  </span>
                )}
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{n.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </main>
  );
}

function Section({
  title,
  subtitle,
  href,
  tone = "dark",
  children,
}: {
  title: string;
  subtitle: string;
  href: string;
  tone?: "dark" | "light";
  children: React.ReactNode;
}) {
  return (
    <section className={tone === "light" ? "bg-slate-50" : "bg-white"}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          </div>
          <Link href={href} className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
            View all →
          </Link>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}
