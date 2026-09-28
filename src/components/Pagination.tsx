"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function Pagination({
  page,
  pageSize,
  count,
}: {
  page: number;
  pageSize: number;
  count: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-100"
      >
        ← Prev
      </button>
      <span className="text-sm text-slate-600">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-100"
      >
        Next →
      </button>
    </div>
  );
}
