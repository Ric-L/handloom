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
      PENDING: "bg-[#EFE6D5] text-[#8B5E3C] border border-[#D9C5A3] font-semibold",
      APPROVED: "bg-[#EEF2E7] text-[#3E492D] border border-[#5C6B45]/40 font-bold",
      REJECTED: "bg-[#F7E5DF] text-[#7A3526] border border-[#C97B65]/50 font-semibold",
    }[status] ?? "bg-[#EFE6D5] text-[#3B3028] border border-[#D9C5A3]"
  );
}
