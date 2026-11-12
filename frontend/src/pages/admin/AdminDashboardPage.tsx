import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminMetrics, getAdminApplications, downloadAdminCSV, getCategories } from "../../api";
import QuotaMetricsHeader from "../../components/admin/QuotaMetricsHeader";
import ApplicationReviewDrawer from "../../components/admin/ApplicationReviewDrawer";
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
} from "lucide-react";

export default function AdminDashboardPage() {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSocial, setSelectedSocial] = useState<string>("");
  const [districtQuery, setDistrictQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isExporting, setIsExporting] = useState<boolean>(false);

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

  // Fetch Applications with Debounced/Active Filters
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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await downloadAdminCSV(selectedCategory || undefined, selectedStatus || "APPROVED");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Live Quota & Metrics Header */}
      <QuotaMetricsHeader
        metrics={metrics}
        isLoading={isMetricsLoading}
        onRefresh={() => {
          refetchMetrics();
          refetchApps();
        }}
      />

      {/* 2. Filterable Applications Moderation Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-5 border-b border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary-700" /> Candidate Applications
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review registrations, examine identity documents, and enforce category quotas
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? "Generating CSV..." : "Export Trainees CSV"}
              </button>
            </div>
          </div>

          {/* Filter Bar Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search Reg No or Name..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-gray-700"
              >
                <option value="">All Job Categories (9)</option>
                {categoryList?.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title.slice(0, 28)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={e => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-gray-700 font-medium"
              >
                <option value="">All Statuses (Pending, Approved, Rejected)</option>
                <option value="PENDING">🟡 PENDING Only</option>
                <option value="APPROVED">🟢 APPROVED Only</option>
                <option value="REJECTED">🔴 REJECTED Only</option>
              </select>
            </div>

            {/* Social Category Filter */}
            <div>
              <select
                value={selectedSocial}
                onChange={e => {
                  setSelectedSocial(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-gray-700"
              >
                <option value="">All Social Categories</option>
                <option value="GENERAL">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* District Filter & Reset */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Filter District..."
                value={districtQuery}
                onChange={e => {
                  setDistrictQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              />
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset Filters"
                className="p-2 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Applications Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200/80 text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Registration No</th>
                <th className="px-5 py-3.5">Candidate & Guardian</th>
                <th className="px-5 py-3.5">Job Role Trade</th>
                <th className="px-5 py-3.5">Location & Social</th>
                <th className="px-5 py-3.5">Submitted</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isAppsLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <div className="animate-spin w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading candidate applications...
                  </td>
                </tr>
              ) : !appsData?.data?.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <p className="font-medium text-gray-600">No applications match the selected filter criteria.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 text-xs text-primary-700 hover:underline font-semibold"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                appsData.data.map(app => (
                  <tr
                    key={app.id}
                    className="hover:bg-primary-50/30 transition group cursor-pointer"
                    onClick={() => setSelectedAppId(app.id)}
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-primary-800 whitespace-nowrap">
                      {app.registration_no}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-gray-900">{app.full_name}</div>
                      <div className="text-[11px] text-gray-500">c/o {app.guardian_name}</div>
                    </td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <span className="font-mono text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold mr-1.5">
                        {app.category_code}
                      </span>
                      <span className="text-gray-800 font-medium">{app.category_title}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-gray-800 font-medium">{app.district_state_pin}</div>
                      <div className="text-[11px] text-gray-500 font-semibold">{app.social_category}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                      {formatDate(app.submitted_at)}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusBadgeColor(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedAppId(app.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-primary-800 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {appsData && appsData.total > 0 && (
          <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div>
              Showing <strong className="text-gray-900">{Math.min(appsData.total, (page - 1) * pageSize + 1)}</strong> to{" "}
              <strong className="text-gray-900">{Math.min(appsData.total, page * pageSize)}</strong> of{" "}
              <strong className="text-gray-900">{appsData.total}</strong> candidate records
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Per Page:</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white text-gray-800"
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
                  className="p-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium">
                  Page {page} of {appsData.total_pages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(p => (appsData.total_pages && p < appsData.total_pages ? p + 1 : p))}
                  disabled={!appsData.total_pages || page >= appsData.total_pages}
                  className="p-1 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Detailed Application Review Drawer */}
      {selectedAppId && (
        <ApplicationReviewDrawer
          applicationId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
          onActionComplete={() => {
            refetchApps();
            refetchMetrics();
          }}
        />
      )}
    </div>
  );
}
