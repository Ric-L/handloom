import { AdminMetrics } from "../../types";
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  RefreshCw,
  TrendingUp,
  Sparkles,
  BarChart3,
  ShieldAlert,
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
      label: "TOTAL SUBMISSIONS",
      value: metrics.total_applied,
      subtext: "Candidate dossiers in system",
      icon: Users,
      border: "border-indigo-200/80 hover:border-indigo-400",
      bg: "bg-gradient-to-br from-indigo-50/60 via-white to-white",
      text: "text-indigo-950",
      iconColor: "text-indigo-600 bg-indigo-100/80",
      accent: "bg-indigo-600",
    },
    {
      label: "PENDING VERIFICATION",
      value: metrics.pending,
      subtext: "Awaiting administrative decision",
      icon: Clock,
      border: "border-amber-200/80 hover:border-amber-400",
      bg: "bg-gradient-to-br from-amber-50/60 via-white to-white",
      text: "text-amber-950",
      iconColor: "text-amber-600 bg-amber-100/80",
      accent: "bg-amber-500",
      pulse: metrics.pending > 0,
    },
    {
      label: "APPROVED CANDIDATES",
      value: metrics.approved,
      subtext: `${overallApproved} of ${totalSanctionedQuota} capacity (${overallPercentage}%)`,
      icon: CheckCircle2,
      border: "border-emerald-200/80 hover:border-emerald-400",
      bg: "bg-gradient-to-br from-emerald-50/60 via-white to-white",
      text: "text-emerald-950",
      iconColor: "text-emerald-600 bg-emerald-100/80",
      accent: "bg-emerald-600",
    },
    {
      label: "REJECTED DOSSIERS",
      value: metrics.rejected,
      subtext: "Logged with mandatory audit trail",
      icon: XCircle,
      border: "border-rose-200/80 hover:border-rose-400",
      bg: "bg-gradient-to-br from-rose-50/60 via-white to-white",
      text: "text-rose-950",
      iconColor: "text-rose-600 bg-rose-100/80",
      accent: "bg-rose-600",
    },
  ];

  const getCodeColor = (code: string) => {
    switch (code) {
      case "MER-01":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "EMB-02":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "JQW-03":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "LLW-04":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "BWA-05":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "APA-06":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "TPM-07":
        return "bg-cyan-100 text-cyan-800 border-cyan-200";
      case "CPW-08":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "PPM-09":
        return "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Refresh & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Artisan Admission Quota Status
            </h2>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
              Live Monitor
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict category quota enforcement across 9 trades • 3,020 total sanctioned seats
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition self-start sm:self-auto cursor-pointer"
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
              className={`rounded-2xl border p-5 shadow-xs transition-all duration-200 relative overflow-hidden ${c.bg} ${c.border}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-600 flex items-center gap-1.5">
                  {c.pulse && <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />}
                  {c.label}
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-slate-950 font-mono">
                {c.value.toLocaleString()}
              </div>

              <div className="mt-2 text-xs text-slate-500 font-medium flex items-center justify-between">
                <span>{c.subtext}</span>
              </div>

              {/* Bottom decorative bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${c.accent} opacity-80`} />
            </div>
          );
        })}
      </div>

      {/* 3. Trade Quota Monitor & Atomic Quota Guard Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Unlock className="w-3 h-3 text-emerald-600" /> Approvals Open
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
              <Lock className="w-3 h-3 text-rose-600" /> Quota Locked (Full)
            </span>
          </div>
        </div>

        {/* 9 Category Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.categories.map(cat => {
            const percent = cat.approval_limit > 0
              ? Math.min(100, Math.round((cat.approved_count / cat.approval_limit) * 100))
              : 0;
            const isFull = !cat.is_approval_open || cat.approved_count >= cat.approval_limit;
            const isSelected = selectedCategoryId === String(cat.category_id);

            return (
              <div
                key={cat.category_id}
                onClick={() => onSelectCategory && onSelectCategory(isSelected ? "" : String(cat.category_id))}
                className={`rounded-2xl border p-4.5 transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                  isSelected
                    ? "ring-2 ring-primary-600 bg-primary-50/20 border-primary-400 shadow-md"
                    : isFull
                    ? "bg-rose-50/30 border-rose-200 hover:border-rose-400"
                    : "bg-slate-50/60 border-slate-200/90 hover:bg-white hover:border-primary-300 hover:shadow-sm"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${getCodeColor(
                        cat.code
                      )}`}
                    >
                      {cat.code}
                    </span>

                    {isFull ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
                        <Lock className="w-3 h-3" /> FULL
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                        {cat.remaining_quota} left
                      </span>
                    )}
                  </div>

                  <h4
                    className="font-bold text-slate-900 text-sm leading-snug line-clamp-1 group-hover:text-primary-800 transition-colors"
                    title={cat.title}
                  >
                    {cat.title}
                  </h4>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                    <span>
                      Approved: <strong className="text-slate-900 font-mono">{cat.approved_count}</strong> /{" "}
                      {cat.approval_limit}
                    </span>
                    <span className={isFull ? "font-bold text-rose-700" : "font-extrabold text-slate-800"}>
                      {percent}%
                    </span>
                  </div>

                  {/* Gradient Meter */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isFull
                          ? "bg-rose-600"
                          : percent > 80
                          ? "bg-amber-500"
                          : "bg-gradient-to-r from-primary-600 to-emerald-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Pending Review:{" "}
                      <strong className={`font-bold ${cat.pending_count > 0 ? "text-amber-700 font-mono" : "text-slate-600"}`}>
                        {cat.pending_count}
                      </strong>
                    </span>
                    <span className="text-[10px] text-slate-400 group-hover:text-primary-700 font-medium">
                      {isSelected ? "✓ Filter Active" : "Click to Filter →"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
