import { useState } from "react";
import { AdminMetrics } from "../../types";
import CategoryQuotaModal from "./CategoryQuotaModal";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  RefreshCw,
  BarChart3,
  ChevronRight,
  Check,
  Sliders,
} from "lucide-react";

interface QuotaMetricsHeaderProps {
  metrics?: AdminMetrics;
  isLoading: boolean;
  onRefresh: () => void;
  selectedCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export default function QuotaMetricsHeader({
  metrics,
  isLoading,
  onRefresh,
  selectedCategoryId,
  onSelectCategory,
}: QuotaMetricsHeaderProps) {
  const [quotaModalOpen, setQuotaModalOpen] = useState(false);

  const userJson = localStorage.getItem("user");
  let isSuperAdmin = false;
  try {
    if (userJson) isSuperAdmin = JSON.parse(userJson).role === "SUPER_ADMIN";
  } catch {
    isSuperAdmin = false;
  }

  if (isLoading && !metrics) {
    return (
      <div className="bg-white rounded-2xl border border-[#D9C5A3] p-8 shadow-2xs animate-pulse space-y-6">
        <div className="h-6 bg-[#EDE3D2] rounded-lg w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#FAF6EE] rounded-2xl border border-[#D9C5A3]" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const totalSanctionedQuota = metrics.categories.reduce((acc, c) => acc + c.approval_limit, 0) || 3020;
  const overallApproved = metrics.approved;
  const overallPercentage =
    totalSanctionedQuota > 0 ? ((overallApproved / totalSanctionedQuota) * 100).toFixed(1) : "0.0";

  const cards = [
    {
      label: "TOTAL APPLICATIONS",
      value: metrics.total_applied,
      subtext: `Across ${metrics.categories.length} trades`,
      icon: Users,
      border: "border-[#D9C5A3] hover:border-[#8B5E3C]",
      iconBg: "bg-[#FAF6EE] text-[#3B3028] border border-[#D9C5A3]",
      accent: "bg-[#3B3028]",
      indicator: "text-[#6E5D50]",
    },
    {
      label: "PENDING REVIEW",
      value: metrics.pending,
      subtext: "Awaiting administrative review",
      icon: Clock,
      border: "border-[#D9C5A3] hover:border-[#8B5E3C]",
      iconBg: "bg-[#F3EAE2] text-[#8B5E3C] border border-[#D9C5A3]",
      accent: "bg-[#8B5E3C]",
      pulse: metrics.pending > 0,
      indicator: metrics.pending > 0 ? "text-[#8B5E3C] font-semibold" : "text-[#6E5D50]",
    },
    {
      label: "APPROVED CANDIDATES",
      value: metrics.approved,
      subtext: `${overallApproved} of ${totalSanctionedQuota} capacity (${overallPercentage}%)`,
      icon: CheckCircle2,
      border: "border-[#D9C5A3] hover:border-[#5C6B45]",
      iconBg: "bg-[#EEF2E7] text-[#5C6B45] border border-[#5C6B45]/30",
      accent: "bg-[#5C6B45]",
      indicator: "text-[#5C6B45] font-semibold",
    },
    {
      label: "REJECTED APPLICATIONS",
      value: metrics.rejected,
      subtext: "Logged with audit reason",
      icon: XCircle,
      border: "border-[#D9C5A3] hover:border-[#A9442A]",
      iconBg: "bg-[#FDF2EE] text-[#A9442A] border border-[#C97B65]/40",
      accent: "bg-[#A9442A]",
      indicator: "text-[#6E5D50]",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#3B3028] tracking-tight">
              Admission Quota Status
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase bg-[#EEF2E7] text-[#3E492D] border border-[#5C6B45]/30 px-2.5 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5C6B45] animate-pulse" />
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-[#6E5D50] mt-1">
            Category quota enforcement across {metrics.categories.length} training trades
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => setQuotaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#F5EFE3] bg-[#8B5E3C] hover:bg-[#734C30] rounded-lg shadow-2xs transition cursor-pointer"
              title="Super Admin: Modify category quota allocations"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Modify Quota Limits</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#3B3028] bg-white hover:bg-[#FAF6EE] border border-[#D9C5A3] rounded-lg shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#8B5E3C]" : "text-[#6E5D50]"}`} />
            <span>Refresh Metrics</span>
          </button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-2xl border p-5 shadow-2xs transition-all duration-200 relative overflow-hidden bg-white ${c.border} hover:shadow-md group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#6E5D50] flex items-center gap-1.5">
                  {c.pulse && <span className="w-2 h-2 rounded-full bg-[#8B5E3C] animate-ping inline-block" />}
                  {c.label}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="font-serif text-3xl sm:text-4xl tracking-tight text-[#3B3028]">
                {c.value.toLocaleString()}
              </div>

              <div className="mt-2 text-xs font-medium">
                <span className={c.indicator}>{c.subtext}</span>
              </div>

              <div className={`absolute bottom-0 left-0 right-0 h-1 ${c.accent} opacity-85`} />
            </div>
          );
        })}
      </div>

      {/* 3. Trade Quota Monitor */}
      <div className="bg-white rounded-2xl border border-[#D9C5A3] shadow-2xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E9DEC8] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#8B5E3C]" />
              <h3 className="text-xs font-bold text-[#3B3028] uppercase tracking-[0.14em]">
                Category Approval Quotas &amp; Atomic Guard
              </h3>
            </div>
            <p className="text-xs text-[#6E5D50] mt-0.5">
              Row-level locked (SELECT FOR UPDATE). Further approvals pause automatically when capacity is reached.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2E7] text-[#3E492D] border border-[#5C6B45]/30">
              <Unlock className="w-3.5 h-3.5 text-[#5C6B45]" /> Open
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2EE] text-[#7A3526] border border-[#C97B65]/40">
              <Lock className="w-3.5 h-3.5 text-[#A9442A]" /> Quota Full
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {metrics.categories.map((cat) => {
            const percent =
              cat.approval_limit > 0
                ? Math.min(100, Math.round((cat.approved_count / cat.approval_limit) * 100))
                : 0;
            const isFull = !cat.is_approval_open || cat.approved_count >= cat.approval_limit;
            const isSelected = selectedCategoryId === String(cat.category_id);

            return (
              <div
                key={cat.category_id}
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? "" : String(cat.category_id))}
                className={`rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                  isSelected
                    ? "ring-2 ring-[#8B5E3C] border-[#8B5E3C] bg-[#FAF6EE] shadow-md -translate-y-0.5"
                    : isFull
                    ? "bg-[#FDF2EE]/50 border-[#C97B65]/50 hover:border-[#A9442A]"
                    : "bg-white border-[#D9C5A3] hover:border-[#8B5E3C] hover:shadow-sm"
                }`}
              >
                {isSelected && <div className="absolute top-0 left-0 right-0 h-1 bg-[#8B5E3C]" />}

                <div className="p-5 space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-[#D9C5A3] bg-[#FAF6EE] text-[#8B5E3C]">
                      {cat.code}
                    </span>

                    {isFull ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7A3526] bg-[#FDF2EE] border border-[#C97B65]/40 px-2.5 py-0.5 rounded-full shrink-0">
                        <Lock className="w-3 h-3 text-[#A9442A]" /> FULL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3E492D] bg-[#EEF2E7] border border-[#5C6B45]/30 px-2.5 py-0.5 rounded-full shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5C6B45] inline-block" />
                        {cat.remaining_quota} left
                      </span>
                    )}
                  </div>

                  <div>
                    <h4
                      className="font-serif font-medium text-[#3B3028] text-base leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-[#8B5E3C] transition-colors"
                      title={cat.title}
                    >
                      {cat.title}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-[#FAF6EE] rounded-lg p-2.5 border border-[#E9DEC8] flex flex-col">
                      <span className="text-[10px] font-bold text-[#6E5D50] uppercase tracking-wider">
                        Approved
                      </span>
                      <span className="font-mono font-bold text-[#3B3028] text-sm mt-0.5">
                        {cat.approved_count}{" "}
                        <span className="text-[11px] text-[#6E5D50] font-normal">/ {cat.approval_limit}</span>
                      </span>
                    </div>

                    <div
                      className={`rounded-lg p-2.5 border flex flex-col ${
                        cat.pending_count > 0
                          ? "bg-[#F3EAE2] border-[#D9C5A3] text-[#8B5E3C]"
                          : "bg-[#FAF6EE] border-[#E9DEC8] text-[#6E5D50]"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                        Pending
                        {cat.pending_count > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B5E3C] animate-pulse" />
                        )}
                      </span>
                      <span className="font-mono font-bold text-sm mt-0.5">
                        {cat.pending_count} {cat.pending_count === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[11px] font-semibold">
                      <span className="text-[#6E5D50]">Quota Filled</span>
                      <span className={isFull ? "text-[#A9442A] font-bold" : "text-[#3B3028] font-mono"}>
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full bg-[#FAF6EE] rounded-full h-2 overflow-hidden border border-[#D9C5A3]">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? "bg-[#A9442A]"
                            : percent > 85
                            ? "bg-[#8B5E3C]"
                            : "bg-gradient-to-r from-[#8B5E3C] to-[#5C6B45]"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className={`px-5 py-2.5 border-t text-[11px] flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-[#F3EAE2] border-[#D9C5A3] text-[#3B3028] font-bold"
                      : "bg-[#FAF6EE] border-[#E9DEC8] text-[#6E5D50] group-hover:bg-[#EDE3D2]"
                  }`}
                >
                  <span className="font-semibold flex items-center gap-1">
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#8B5E3C]" />
                        <span>Filter Active (Click to clear)</span>
                      </>
                    ) : (
                      <span>Capacity: {cat.approval_limit} seats</span>
                    )}
                  </span>
                  <span className="flex items-center gap-0.5 font-semibold group-hover:translate-x-0.5 transition-transform">
                    {isSelected ? "Clear" : "Filter"} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Super Admin Quota Management Modal */}
      {isSuperAdmin && (
        <CategoryQuotaModal
          isOpen={quotaModalOpen}
          onClose={() => setQuotaModalOpen(false)}
          categories={metrics.categories}
        />
      )}
    </div>
  );
}
