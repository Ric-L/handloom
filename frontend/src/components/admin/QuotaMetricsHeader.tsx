import { AdminMetrics } from "../../types";
import { Users, Clock, CheckCircle2, XCircle, Lock, Unlock, RefreshCw } from "lucide-react";

interface QuotaMetricsHeaderProps {
  metrics?: AdminMetrics;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function QuotaMetricsHeader({ metrics, isLoading, onRefresh }: QuotaMetricsHeaderProps) {
  if (isLoading && !metrics) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const totalQuota = metrics.categories.reduce((acc, c) => acc + c.approval_limit, 0);
  const totalApproved = metrics.approved;
  const overallPercent = totalQuota > 0 ? Math.round((totalApproved / totalQuota) * 100) : 0;

  const summaryCards = [
    {
      label: "Total Applications",
      value: metrics.total_applied,
      icon: Users,
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-200",
      description: "Across all 9 job categories",
    },
    {
      label: "Pending Review",
      value: metrics.pending,
      icon: Clock,
      color: "text-amber-700",
      bg: "bg-amber-50 border-amber-200",
      description: "Awaiting administrative action",
    },
    {
      label: "Approved Candidates",
      value: metrics.approved,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50 border-emerald-200",
      description: `${overallPercent}% of total 3,020 capacity`,
    },
    {
      label: "Rejected Applications",
      value: metrics.rejected,
      icon: XCircle,
      color: "text-rose-700",
      bg: "bg-rose-50 border-rose-200",
      description: "Logged with mandatory reason",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Artisan Admission Quota Status</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Strict category quota enforcement across 9 trades • 3,020 total sanctioned seats
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg shadow-sm transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary-700" : ""}`} />
          Refresh Live Metrics
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className={`rounded-xl border p-4.5 ${c.bg} shadow-sm transition hover:shadow-md`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">{c.label}</span>
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">
                {c.value.toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-gray-500 font-medium">{c.description}</div>
            </div>
          );
        })}
      </div>

      {/* 9 Categories Visual Progress Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-gray-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Category Approval Quotas & Atomic Guard
            </h3>
            <p className="text-xs text-gray-500">
              When approved count hits quota limit, approvals lock atomically via database row lock (FOR UPDATE).
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
              <Unlock className="w-3 h-3" /> Approvals Open
            </span>
            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-200">
              <Lock className="w-3 h-3" /> Quota Locked (Full)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.categories.map(cat => {
            const percent = cat.approval_limit > 0
              ? Math.min(100, Math.round((cat.approved_count / cat.approval_limit) * 100))
              : 0;
            const isFull = !cat.is_approval_open || cat.approved_count >= cat.approval_limit;

            return (
              <div
                key={cat.category_id}
                className={`rounded-xl border p-4 transition ${
                  isFull
                    ? "bg-rose-50/40 border-rose-200"
                    : "bg-gray-50/70 border-gray-200 hover:border-primary-300 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-800">
                      {cat.code}
                    </span>
                    <h4 className="text-xs font-bold text-gray-900 mt-1.5 leading-snug line-clamp-1" title={cat.title}>
                      {cat.title}
                    </h4>
                  </div>
                  {isFull ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full shrink-0">
                      <Lock className="w-3 h-3" /> FULL
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      {cat.remaining_quota} left
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                    <span>
                      Approved: <strong className="text-gray-900">{cat.approved_count}</strong> / {cat.approval_limit}
                    </span>
                    <span className={isFull ? "font-bold text-rose-700" : "font-semibold text-gray-700"}>
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        isFull
                          ? "bg-rose-600"
                          : percent > 80
                          ? "bg-amber-500"
                          : "bg-primary-600"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2.5 flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-gray-200/60">
                  <span>Pending review: <strong className="text-amber-700">{cat.pending_count}</strong></span>
                  <span className="font-mono text-[10px]">Max: {cat.approval_limit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

