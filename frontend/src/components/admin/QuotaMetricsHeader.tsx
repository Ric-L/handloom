import { AdminMetrics } from "../../types";
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
  if (isLoading && !metrics) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xs animate-pulse space-y-6">
        <div className="h-6 bg-slate-200 rounded-lg w-1/4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const totalSanctionedQuota = metrics.categories.reduce((acc, c) => acc + c.approval_limit, 0) || 3020;
  const overallApproved = metrics.approved;
  const overallPercentage = totalSanctionedQuota > 0 ? ((overallApproved / totalSanctionedQuota) * 100).toFixed(1) : "0.0";

  const cards = [
    {
      label: "TOTAL APPLICATIONS",
      value: metrics.total_applied,
      subtext: "Across all 9 job categories",
      icon: Users,
      border: "border-slate-200 hover:border-indigo-300",
      bg: "bg-white",
      iconBg: "bg-indigo-50 text-indigo-700 border border-indigo-100",
      accent: "bg-indigo-600",
      indicator: "text-slate-500",
    },
    {
      label: "PENDING REVIEW",
      value: metrics.pending,
      subtext: "Awaiting administrative action",
      icon: Clock,
      border: "border-slate-200 hover:border-amber-300",
      bg: "bg-white",
      iconBg: "bg-amber-50 text-amber-700 border border-amber-100",
      accent: "bg-amber-500",
      pulse: metrics.pending > 0,
      indicator: metrics.pending > 0 ? "text-amber-700 font-bold" : "text-slate-500",
    },
    {
      label: "APPROVED CANDIDATES",
      value: metrics.approved,
      subtext: `${overallApproved} of ${totalSanctionedQuota} capacity (${overallPercentage}%)`,
      icon: CheckCircle2,
      border: "border-slate-200 hover:border-emerald-300",
      bg: "bg-white",
      iconBg: "bg-emerald-50 text-emerald-700 border border-emerald-100",
      accent: "bg-emerald-600",
      indicator: "text-emerald-700 font-bold",
    },
    {
      label: "REJECTED APPLICATIONS",
      value: metrics.rejected,
      subtext: "Logged with mandatory reason",
      icon: XCircle,
      border: "border-slate-200 hover:border-rose-300",
      bg: "bg-white",
      iconBg: "bg-rose-50 text-rose-700 border border-rose-100",
      accent: "bg-rose-600",
      indicator: "text-slate-500",
    },
  ];

  const getTradeTheme = (code: string) => {
    switch (code) {
      case "MER-01":
        return {
          pill: "bg-indigo-50 text-indigo-800 border-indigo-200",
          accent: "from-indigo-600 to-blue-600",
          activeBg: "bg-indigo-50/30",
        };
      case "EMB-02":
        return {
          pill: "bg-purple-50 text-purple-800 border-purple-200",
          accent: "from-purple-600 to-pink-600",
          activeBg: "bg-purple-50/30",
        };
      case "JQW-03":
        return {
          pill: "bg-emerald-50 text-emerald-800 border-emerald-200",
          accent: "from-emerald-600 to-teal-600",
          activeBg: "bg-emerald-50/30",
        };
      case "LLW-04":
        return {
          pill: "bg-teal-50 text-teal-800 border-teal-200",
          accent: "from-teal-600 to-cyan-600",
          activeBg: "bg-teal-50/30",
        };
      case "BWA-05":
        return {
          pill: "bg-amber-50 text-amber-800 border-amber-200",
          accent: "from-amber-600 to-yellow-600",
          activeBg: "bg-amber-50/30",
        };
      case "APA-06":
        return {
          pill: "bg-orange-50 text-orange-800 border-orange-200",
          accent: "from-orange-600 to-amber-600",
          activeBg: "bg-orange-50/30",
        };
      case "TPM-07":
        return {
          pill: "bg-cyan-50 text-cyan-800 border-cyan-200",
          accent: "from-cyan-600 to-sky-600",
          activeBg: "bg-cyan-50/30",
        };
      case "CPW-08":
        return {
          pill: "bg-rose-50 text-rose-800 border-rose-200",
          accent: "from-rose-600 to-pink-600",
          activeBg: "bg-rose-50/30",
        };
      case "PPM-09":
        return {
          pill: "bg-violet-50 text-violet-800 border-violet-200",
          accent: "from-violet-600 to-fuchsia-600",
          activeBg: "bg-violet-50/30",
        };
      default:
        return {
          pill: "bg-slate-100 text-slate-800 border-slate-200",
          accent: "from-slate-600 to-slate-800",
          activeBg: "bg-slate-50",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Refresh & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Artisan Admission Quota Status
            </h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Strict category quota enforcement across 9 trades • 3,020 total sanctioned seats
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition self-start sm:self-auto cursor-pointer hover:shadow-xs active:translate-y-px"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary-700" : "text-slate-500"}`} />
          <span>Refresh Live Metrics</span>
        </button>
      </div>

      {/* 2. Executive Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden bg-white ${c.border} hover:shadow-md group`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-500 flex items-center gap-1.5">
                  {c.pulse && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />}
                  {c.label}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${c.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-mono">
                {c.value.toLocaleString()}
              </div>

              <div className="mt-2 text-xs text-slate-500 font-medium flex items-center justify-between">
                <span className={c.indicator}>{c.subtext}</span>
              </div>

              {/* Accent bottom accent line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${c.accent} opacity-80`} />
            </div>
          );
        })}
      </div>

      {/* 3. Trade Quota Monitor & Atomic Quota Guard Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-700" />
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Category Approval Quotas & Atomic Guard
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Row-level locked (SELECT FOR UPDATE). When approved headcount reaches limit, system automatically locks further approvals.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Unlock className="w-3.5 h-3.5 text-emerald-600" /> Approvals Open
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
              <Lock className="w-3.5 h-3.5 text-rose-600" /> Quota Locked (Full)
            </span>
          </div>
        </div>

        {/* 9 Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {metrics.categories.map(cat => {
            const percent =
              cat.approval_limit > 0
                ? Math.min(100, Math.round((cat.approved_count / cat.approval_limit) * 100))
                : 0;
            const isFull = !cat.is_approval_open || cat.approved_count >= cat.approval_limit;
            const isSelected = selectedCategoryId === String(cat.category_id);
            const theme = getTradeTheme(cat.code);

            return (
              <div
                key={cat.category_id}
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? "" : String(cat.category_id))}
                className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group relative overflow-hidden ${
                  isSelected
                    ? "ring-2 ring-primary-600 border-primary-500 bg-primary-50/25 shadow-md -translate-y-0.5"
                    : isFull
                    ? "bg-rose-50/30 border-rose-200 hover:border-rose-400 hover:shadow-sm"
                    : "bg-white border-slate-200 hover:border-primary-400 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                {/* Active Indicator Top Strip */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary-600" />
                )}

                <div className="p-5 space-y-3.5">
                  {/* Top Row: Code Pill + Quota Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-mono font-black px-2.5 py-1 rounded-lg border shadow-2xs ${theme.pill}`}
                    >
                      {cat.code}
                    </span>

                    {isFull ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-800 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                        <Lock className="w-3 h-3 text-rose-700" /> FULL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {cat.remaining_quota} left
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <h4
                      className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary-900 transition-colors"
                      title={cat.title}
                    >
                      {cat.title}
                    </h4>
                  </div>

                  {/* Key Metrics Chips */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Approved
                      </span>
                      <span className="font-mono font-black text-slate-900 text-sm mt-0.5">
                        {cat.approved_count} <span className="text-[11px] text-slate-400 font-medium">/ {cat.approval_limit}</span>
                      </span>
                    </div>

                    <div className={`rounded-xl p-2.5 border flex flex-col ${
                      cat.pending_count > 0 
                        ? "bg-amber-50/60 border-amber-200/80 text-amber-950" 
                        : "bg-slate-50 border-slate-100 text-slate-500"
                    }`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider flex items-center justify-between">
                        Pending
                        {cat.pending_count > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        )}
                      </span>
                      <span className={`font-mono font-black text-sm mt-0.5 ${cat.pending_count > 0 ? "text-amber-800" : "text-slate-600"}`}>
                        {cat.pending_count} {cat.pending_count === 1 ? "review" : "reviews"}
                      </span>
                    </div>
                  </div>

                  {/* Progress Meter with Percentage */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className="text-slate-500">Sanctioned Quota Filled</span>
                      <span className={isFull ? "text-rose-700 font-black" : "text-slate-700 font-mono"}>
                        {percent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner p-0.5 border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull
                            ? "bg-rose-600"
                            : percent > 85
                            ? "bg-amber-500"
                            : `bg-gradient-to-r ${theme.accent}`
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className={`px-5 py-2.5 border-t text-[11px] flex items-center justify-between transition-colors ${
                  isSelected 
                    ? "bg-primary-100/70 border-primary-200 text-primary-950 font-bold" 
                    : "bg-slate-50/80 border-slate-100 text-slate-500 group-hover:bg-slate-100/80 group-hover:text-slate-800"
                }`}>
                  <span className="font-semibold flex items-center gap-1">
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-primary-700" />
                        <span>Filter Active (Click to clear)</span>
                      </>
                    ) : (
                      <span>Capacity: {cat.approval_limit} seats</span>
                    )}
                  </span>
                  <span className="flex items-center gap-0.5 font-bold group-hover:translate-x-0.5 transition-transform">
                    {isSelected ? "Clear" : "Filter"} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}