"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  compact = false,
  onNavigate,
}: {
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const [value, setValue] = useState("");
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    onNavigate?.();
  }

  return (
    <form onSubmit={submit} className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search expeditions, publications, datasets, media…"
        aria-label="Search the polar science portal"
        className={`w-full rounded-full border border-slate-300 bg-white pl-4 pr-10 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-200 ${
          compact ? "py-2 text-sm" : "py-3 text-base"
        }`}
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-slate-900 text-white hover:bg-cyan-700"
      >
        🔍
      </button>
    </form>
  );
}
