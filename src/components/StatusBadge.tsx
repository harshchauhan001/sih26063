import { STATUS_LABELS, STATUS_STYLES } from "@/lib/format";

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700 border-slate-300"
      }`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
