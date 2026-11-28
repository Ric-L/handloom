import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminApplications, downloadAdminCSV, getCategories, getAdminMetrics } from "../../api";
import { MANIPUR_DISTRICTS } from "../../lib/constants";
import { formatDate, statusBadgeColor } from "../../lib/utils";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCcw,
  SlidersHorizontal,
  Copy,
  Check,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminApplicationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters State (initialized from query params for direct Dashboard drill-down)
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search_query") || "");
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category_id") || "");
  const [selectedStatus, setSelectedStatus] = useState<string>(searchParams.get("status") || "");
  const [selectedSocial, setSelectedSocial] = useState<string>(searchParams.get("social_category") || "");
  const [districtQuery, setDistrictQuery] = useState<string>(searchParams.get("district") || "");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const dist = searchParams.get("district") || "";
    const cat = searchParams.get("category_id") || "";
    setDistrictQuery(dist);
    setSelectedCategory(cat);
  }, [searchParams]);

  // Fetch Live Metrics for status counts
  const { data: metrics } = useQuery({
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
  const { data: appsData, isLoading: isAppsLoading } = useQuery({
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
    setSearchParams({});
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

  const selectedCategoryObj = categoryList?.find((c) => String(c.id) === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45] block">
            SCRUTINY QUEUE
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#3B3028] tracking-tight">
            Application Dossier Verification
          </h1>
          <p className="text-xs text-[#6E5D50] font-medium">
            Review verified candidate documents, validate identity records, and approve or reject applications
          </p>
        </div>

        {/* Quick Export Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport("APPROVED")}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#F5EFE3] bg-[#5C6B45] hover:bg-[#4A5737] rounded-lg transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            {isExporting ? "Generating..." : "Export Approved"}
          </button>
          <button
            type="button"
            onClick={() => handleExport("PENDING")}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#3B3028] bg-white hover:bg-[#FAF6EE] border border-[#D9C5A3] rounded-lg transition shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#8B5E3C]" />
            Export Queue
          </button>
        </div>
      </div>

      {/* Filterable Applications Moderation Console */}
      <div className="bg-white rounded-2xl border border-[#D9C5A3] shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-[#E9DEC8] space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#8B5E3C]" />
              <h3 className="font-serif text-xl text-[#3B3028] tracking-tight">
                Artisan Enrolment Queue
              </h3>
              {selectedCategoryObj && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#F3EAE2] text-[#8B5E3C] px-2.5 py-0.5 rounded-full border border-[#D9C5A3]">
                  Trade: {selectedCategoryObj.code}
                  <button
                    onClick={() => setSelectedCategory("")}
                    className="ml-1 text-[#8B5E3C] hover:text-[#3B3028] font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
              {districtQuery && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-[#EEF2E7] text-[#3E492D] px-2.5 py-0.5 rounded-full border border-[#5C6B45]/30">
                  District: {districtQuery}
                  <button
                    onClick={() => {
                      setDistrictQuery("");
                      setSearchParams({});
                    }}
                    className="ml-1 hover:text-[#3B3028] font-bold cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E9DEC8]">
            {[
              { id: "", label: "All Applications", count: metrics?.total_applied ?? 0 },
              { id: "PENDING", label: "Pending Verification", count: metrics?.pending ?? 0 },
              { id: "APPROVED", label: "Approved Candidates", count: metrics?.approved ?? 0 },
              { id: "REJECTED", label: "Rejected Applications", count: metrics?.rejected ?? 0 },
            ].map((tab) => {
              const active = selectedStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedStatus(tab.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                    active
                      ? "bg-[#3B3028] text-[#F5EFE3] shadow-xs"
                      : "bg-[#FAF6EE] text-[#6E5D50] hover:bg-[#EDE3D2] hover:text-[#3B3028] border border-[#D9C5A3]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      active ? "bg-white/20 text-[#F5EFE3]" : "bg-white text-[#3B3028] border border-[#D9C5A3]"
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
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8D7B6D]" />
              <input
                type="text"
                placeholder="Search Reg No or Name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#D9C5A3] rounded-lg bg-[#FAF6EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 transition font-medium text-[#3B3028]"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-xs border border-[#D9C5A3] rounded-lg bg-[#FAF6EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 transition text-[#3B3028] font-medium cursor-pointer"
              >
                <option value="">All Trades ({categoryList?.length ?? 0})</option>
                {categoryList?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title.slice(0, 26)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedSocial}
                onChange={(e) => {
                  setSelectedSocial(e.target.value);
                  setPage(1);
                }}
                className="w-full py-2 px-3 text-xs border border-[#D9C5A3] rounded-lg bg-[#FAF6EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 transition text-[#3B3028] font-medium cursor-pointer"
              >
                <option value="">All Social Categories</option>
                <option value="ST">ST</option>
                <option value="SC">SC</option>
                <option value="OBC">OBC</option>
                <option value="OTHER">Minority / Other</option>
              </select>
            </div>

            <div>
              <select
                value={districtQuery}
                onChange={(e) => {
                  setDistrictQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-xs border border-[#D9C5A3] rounded-lg bg-[#FAF6EE] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 transition text-[#3B3028] font-medium cursor-pointer"
              >
                <option value="">All Manipur Districts</option>
                {MANIPUR_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full py-2 px-3 text-xs font-semibold text-[#3B3028] hover:bg-[#EDE3D2] bg-[#FAF6EE] border border-[#D9C5A3] rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8B5E3C]" /> Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Applications Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF6EE] text-[#6E5D50] uppercase tracking-wider font-bold border-b border-[#D9C5A3] text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Registration No</th>
                <th className="px-6 py-3.5">Candidate &amp; Guardian</th>
                <th className="px-6 py-3.5">Artisan Trade</th>
                <th className="px-6 py-3.5">District &amp; Social</th>
                <th className="px-6 py-3.5">Submitted</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9DEC8]">
              {isAppsLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#6E5D50]">
                    <div className="animate-spin w-7 h-7 border-3 border-[#8B5E3C] border-t-transparent rounded-full mx-auto mb-2" />
                    Loading verification queue...
                  </td>
                </tr>
              ) : !appsData?.data?.length ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-[#6E5D50] space-y-2">
                    <p className="font-bold text-[#3B3028] text-sm">No applications found in this filter.</p>
                    <p className="text-xs text-[#6E5D50]">Try adjusting your status, district, or trade criteria.</p>
                    <button
                      onClick={handleResetFilters}
                      className="inline-block mt-2 text-xs font-semibold text-[#8B5E3C] hover:underline cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </td>
                </tr>
              ) : (
                appsData.data.map((app) => {
                  const isCopied = copiedId === app.id;
                  const initials = app.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/admin/applications/${app.id}`)}
                      className="hover:bg-[#FAF6EE] transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-[#FAF6EE] group-hover:bg-white text-[#3B3028] px-2.5 py-1 rounded-md border border-[#D9C5A3]">
                          <span>{app.registration_no || "N/A"}</span>
                          <button
                            type="button"
                            title="Copy Registration Number"
                            onClick={(e) => copyToClipboard(app.registration_no || "", app.id, e)}
                            className="text-[#8D7B6D] hover:text-[#3B3028] p-0.5 rounded transition cursor-pointer"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-[#5C6B45]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F3EAE2] text-[#8B5E3C] font-bold flex items-center justify-center text-xs shrink-0 border border-[#D9C5A3]">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[#3B3028] text-sm leading-tight group-hover:text-[#8B5E3C] transition-colors">
                              {app.full_name}
                            </div>
                            <div className="text-[11px] text-[#6E5D50] font-medium">
                              c/o {app.guardian_name}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-xs">
                        <span className="font-mono text-[11px] font-bold bg-[#FAF6EE] text-[#8B5E3C] px-2 py-0.5 rounded border border-[#D9C5A3] mr-2">
                          {app.category_code}
                        </span>
                        <span className="text-[#3B3028] font-semibold text-xs">{app.category_title}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-[#3B3028] font-semibold">{app.district_state_pin}</div>
                        <div className="text-[11px] text-[#6E5D50] font-mono">
                          Category: {app.social_category}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-[#6E5D50] font-medium whitespace-nowrap">
                        {formatDate(app.submitted_at)}
                      </td>

                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs ${statusBadgeColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/applications/${app.id}`)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#8B5E3C] bg-[#FAF6EE] hover:bg-[#EDE3D2] border border-[#D9C5A3] rounded-lg transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review Dossier
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
          <div className="px-6 py-4 bg-[#FAF6EE] border-t border-[#D9C5A3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E5D50] font-medium">
            <div>
              Showing <strong className="text-[#3B3028]">{Math.min(appsData.total, (page - 1) * pageSize + 1)}</strong> to{" "}
              <strong className="text-[#3B3028]">{Math.min(appsData.total, page * pageSize)}</strong> of{" "}
              <strong className="text-[#3B3028]">{appsData.total}</strong> candidates
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-[#D9C5A3] rounded-lg px-2 py-1 text-xs bg-white text-[#3B3028] font-medium cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 font-bold text-[#3B3028]">
                  {page} / {appsData.total_pages || 1}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => (appsData.total_pages && p < appsData.total_pages ? p + 1 : p))}
                  disabled={!appsData.total_pages || page >= appsData.total_pages}
                  className="p-1.5 rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
