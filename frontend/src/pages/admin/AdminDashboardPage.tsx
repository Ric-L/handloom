import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminMetrics, getAdminApplications, downloadAdminCSV, getCategories } from "../../api";
import QuotaMetricsHeader from "../../components/admin/QuotaMetricsHeader";
import { formatDate, statusBadgeColor } from "../../lib/utils";
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  SlidersHorizontal,
  Copy,
  Check,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSocial, setSelectedSocial] = useState<string>("");
  const [districtQuery, setDistrictQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch Live Metrics
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["adminMetrics"],
    queryFn: getAdminMetrics,
    refetchInterval: 15000,
  });

  // Fetch Categories for Dropdown
  const { data: categoryList } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Fetch Applications with Active Filters
  const {
    data: appsData,
    isLoading: isAppsLoading,
    refetch: refetchApps,
  } = useQuery({
    queryKey: [
      "adminApps",
      page,
      pageSize,
      selectedCategory,
      selectedStatus,
      selectedSocial,
      districtQuery,
      searchQuery,
    ],
    queryFn: () =>
      getAdminApplications({
        page,
        page_size: pageSize,
        category_id: selectedCategory || undefined,
        status: selectedStatus || undefined,
        social_category: selectedSocial || undefined,
        district: districtQuery || undefined,
        search_query: searchQuery || undefined,
      }),
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSelectedSocial("");
    setDistrictQuery("");
    setPage(1);
  };

  const handleExport = async (status: string = "APPROVED") => {
    try {
      setIsExporting(true);
      await downloadAdminCSV(selectedCategory || undefined, status);
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedCategoryObj = categoryList?.find(c => String(c.id) === selectedCategory);

  return (
    <div className="space-y-8">
      {/* 1. Live Executive Quota & Metrics Header */}
      <QuotaMetricsHeader
        metrics={metrics}
        isLoading={isMetricsLoading}
        onRefresh={() => {
          refetchMetrics();
          refetchApps();
        }}
        selectedCategoryId={selectedCategory}
        onSelectCategory={catId => {
          setSelectedCategory(catId);
          setPage(1);
        }}
      />

      {/* 2. Filterable Applications Moderation Console */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
        {/* Top Control Bar with Status Tabs & Export */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary-700" />
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Artisan Enrolment Verification Queue
                </h3>
                {selectedCategoryObj && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary-100 text-primary-900 px-2.5 py-0.5 rounded-full border border-primary-200">
                    Trade: {selectedCategoryObj.code}
                    <button
                      onClick={() => setSelectedCategory("")}
                      className="ml-1 text-primary-700 hover:text-primary-950 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review verified documentation, validate DBT accounts, and approve candidates with atomic quota checks.
              </p>
            </div>

            {/* Quick Export Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleExport("APPROVED")}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-xl transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {isExporting ? "Generating CSV..." : "Export Approved Trainees"}
              </button>
              <button
                type="button"
                onClick={() => handleExport("PENDING")}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Queue
              </button>
            </div>
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            {[
              { id: "", label: "All Applications", count: metrics?.total_applied ?? 0 },
              { id: "PENDING", label: "Pending Verification", count: metrics?.pending ?? 0, color: "text-amber-700" },
              { id: "APPROVED", label: "Approved Candidates", count: metrics?.approved ?? 0, color: "text-blue-700" },
              { id: "REJECTED", label: "Rejected Applications", count: metrics?.rejected ?? 0, color: "text-rose-700" },
            ].map(tab => {
              const active = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedStatus(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      active ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Search & Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Reg No or Name..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition font-medium"
              />
            </div>

            {/* Trade Category Dropdown */}
            <div>
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-slate-700 font-medium"
              >
                <option value="">All Artisan Trades (9)</option>
                {categoryList?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title.slice(0, 26)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Social Category Dropdown */}
            <div>
              <select
                value={selectedSocial}
                onChange={e => {
                  setSelectedSocial(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-slate-700 font-medium"
              >
                <option value="">All Social Categories</option>
                <option value="GENERAL">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* District Filter Input */}
            <div>
              <input
                type="text"
                placeholder="Filter District / State..."
                value={districtQuery}
                onChange={e => {
                  setDistrictQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition font-medium"
              />
            </div>

            {/* Reset Filters Button */}
            <div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Applications Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/90 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="px-6 py-4">Registration No</th>
                <th className="px-6 py-4">Candidate & Guardian</th>
                <th className="px-6 py-4">Artisan Trade</th>
                <th className="px-6 py-4">Location & Social</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isAppsLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <div className="animate-spin w-7 h-7 border-3 border-primary-600 border-t-transparent rounded-full mx-auto mb-2" />
                    Loading verification queue...
                  </td>
                </tr>
              ) : !appsData?.data?.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 space-y-2">
                    <p className="font-bold text-slate-700 text-sm">No applications found in this filter.</p>
                    <p className="text-xs text-slate-500">Try adjusting your status or trade filter criteria.</p>
                    <button
                      onClick={handleResetFilters}
                      className="inline-block mt-2 text-xs font-bold text-primary-700 hover:underline"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                appsData.data.map(app => {
                  const isCopied = copiedId === app.id;
                  const initials = app.full_name
                    .split(" ")
                    .map(n => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/admin/applications/${app.id}`)}
                      className="hover:bg-primary-50/40 transition-colors group cursor-pointer"
                    >
                      {/* Monospace Registration Number with 1-Click Copy */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-extrabold bg-slate-100 group-hover:bg-white text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          <span>{app.registration_no || "N/A"}</span>
                          <button
                            type="button"
                            title="Copy Registration Number"
                            onClick={e => copyToClipboard(app.registration_no || "", app.id, e)}
                            className="text-slate-400 hover:text-slate-800 p-0.5 rounded transition"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Candidate Avatar & Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-900 font-extrabold flex items-center justify-center text-xs shrink-0 border border-primary-200">
                            {initials}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm leading-tight group-hover:text-primary-900 transition-colors">
                              {app.full_name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              c/o {app.guardian_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Trade Badge */}
                      <td className="px-6 py-4 max-w-xs">
                        <span className="font-mono text-[11px] font-extrabold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 mr-2">
                          {app.category_code}
                        </span>
                        <span className="text-slate-800 font-bold text-xs">{app.category_title}</span>
                      </td>

                      {/* Location & Social */}
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-semibold">{app.district_state_pin}</div>
                        <div className="text-[11px] text-slate-500 font-mono font-bold">
                          Category: {app.social_category}
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                        {formatDate(app.submitted_at)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-black tracking-wide ${statusBadgeColor(
                            app.status
                          )}`}
                        >
                          {app.status}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="px-6 py-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/applications/${app.id}`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-primary-900 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-xl transition shadow-2xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary-700" /> Review Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {appsData && appsData.total > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <div>
              Showing <strong className="text-slate-900 font-bold">{Math.min(appsData.total, (page - 1) * pageSize + 1)}</strong> to{" "}
              <strong className="text-slate-900 font-bold">{Math.min(appsData.total, page * pageSize)}</strong> of{" "}
              <strong className="text-slate-900 font-bold">{appsData.total}</strong> registered candidates
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Rows:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-slate-300 rounded-lg px-2 py-1 text-xs bg-white text-slate-800 font-medium"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 font-bold text-slate-800">
                  {page} / {appsData.total_pages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => (appsData.total_pages && p < appsData.total_pages ? p + 1 : p))}
                  disabled={!appsData.total_pages || page >= appsData.total_pages}
                  className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
