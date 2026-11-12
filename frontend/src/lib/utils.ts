import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function statusBadgeColor(status: string) {
  return { PENDING: "bg-yellow-100 text-yellow-800", APPROVED: "bg-green-100 text-green-800", REJECTED: "bg-red-100 text-red-800" }[status] ?? "bg-gray-100";
}
