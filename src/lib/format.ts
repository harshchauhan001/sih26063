export const REGION_LABELS: Record<string, string> = {
  arctic: "Arctic",
  antarctic: "Antarctic",
  himalaya: "Himalaya",
  southern_ocean: "Southern Ocean",
  other: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  changes_requested: "Changes Requested",
  approved: "Published",
  rejected: "Rejected",
};

export const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-300",
  submitted: "bg-amber-50 text-amber-700 border-amber-300",
  changes_requested: "bg-orange-50 text-orange-700 border-orange-300",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-300",
  rejected: "bg-red-50 text-red-700 border-red-300",
};

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export function truncate(text: string | null | undefined, length = 160) {
  if (!text) return "";
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}
