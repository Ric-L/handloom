import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function statusBadgeColor(status: string) {
  return (
    {
      PENDING: "bg-amber-50 text-amber-800 border border-amber-200",
      APPROVED: "bg-blue-50 text-blue-800 border border-blue-200 font-bold",
      REJECTED: "bg-rose-50 text-rose-800 border border-rose-200 font-medium",
    }[status] ?? "bg-slate-100 text-slate-700 border border-slate-200"
  );
}
