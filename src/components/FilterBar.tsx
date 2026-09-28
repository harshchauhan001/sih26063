"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";

type Option = { value: string; label: string };
type Field = { name: string; label: string; options: Option[] };

export default function FilterBar({
  fields,
  showYear = false,
  searchPlaceholder = "Search…",
}: {
  fields: Field[];
  showYear?: boolean;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function updateParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", q);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <form onSubmit={submitSearch} className="flex min-w-[220px] flex-1 items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-600 focus:outline-none"
        />
        <button type="submit" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Search
        </button>
      </form>

      {fields.map((field) => (
        <select
          key={field.name}
          defaultValue={searchParams.get(field.name) ?? ""}
          onChange={(e) => updateParam(field.name, e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-600 focus:outline-none"
          aria-label={field.label}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {showYear && (
        <input
          type="number"
          placeholder="Year"
          defaultValue={searchParams.get("year") ?? ""}
          onBlur={(e) => updateParam("year", e.target.value)}
          className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-cyan-600 focus:outline-none"
          aria-label="Year"
        />
      )}
    </div>
  );
}
