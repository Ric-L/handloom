import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RotateCcw,
  Copy,
  Check,
  User,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  HelpCircle,
  Hash,
} from "lucide-react";
import client from "../../api/client";
import { formatDate } from "../../lib/utils";

interface Candidate {
  id: string;
  mobile_number: string;
  email?: string | null;
  full_name?: string | null;
  application_count?: number;
  applications_count?: number;
  latest_status?: string | null;
  social_category?: string | null;
  created_at: string;
}

interface PaginatedCandidates {
  data: Candidate[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AdminCandidatesPage() {
  const navigate = useNavigate();

  // Top General Search
  const [search, setSearch] = useState("");

  // Column Header Filters
  // 1. Text fields: Search
  const [filterName, setFilterName] = useState("");
  const [filterMobile, setFilterMobile] = useState("");
  const [filterEmail, setFilterEmail] = useState("");

  // 2. Numeric fields: Min-Max range
  const [filterMinApps, setFilterMinApps] = useState("");
  const [filterMaxApps, setFilterMaxApps] = useState("");

  // 3. Boolean field: Yes / No
  const [filterHasApps, setFilterHasApps] = useState("ALL"); // "ALL" | "YES" | "NO"

  // 4. Status / Category fields: Dropdown / multi-select
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");

  // 5. Date field: Date range (From - To)
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [showHeaderFilters, setShowHeaderFilters] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [data, setData] = useState<PaginatedCandidates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced filter object to avoid request flooding
  const [debouncedParams, setDebouncedParams] = useState({
    search: "",
    name: "",
    mobile: "",
    email: "",
    min_applications: "",
    max_applications: "",
    has_applications: "ALL",
    status: "ALL",
    social_category: "ALL",
    date_from: "",
    date_to: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedParams({
        search: search.trim(),
        name: filterName.trim(),
        mobile: filterMobile.trim(),
        email: filterEmail.trim(),
        min_applications: filterMinApps.trim(),
        max_applications: filterMaxApps.trim(),
        has_applications: filterHasApps,
        status: filterStatus,
        social_category: filterCategory,
        date_from: filterDateFrom,
        date_to: filterDateTo,
      });
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [
    search,
    filterName,
    filterMobile,
    filterEmail,
    filterMinApps,
    filterMaxApps,
    filterHasApps,
    filterStatus,
    filterCategory,
    filterDateFrom,
    filterDateTo,
  ]);

  // Fetch candidates with active filters
  const fetchCandidates = () => {
    setIsLoading(true);
    setError(null);

    const queryParams: Record<string, any> = {
      page,
      page_size: pageSize,
    };

    if (debouncedParams.search) queryParams.search = debouncedParams.search;
    if (debouncedParams.name) queryParams.name = debouncedParams.name;
    if (debouncedParams.mobile) queryParams.mobile = debouncedParams.mobile;
    if (debouncedParams.email) queryParams.email = debouncedParams.email;
    if (debouncedParams.min_applications !== "") queryParams.min_applications = debouncedParams.min_applications;
    if (debouncedParams.max_applications !== "") queryParams.max_applications = debouncedParams.max_applications;

    if (debouncedParams.has_applications === "YES") queryParams.has_applications = "true";
    if (debouncedParams.has_applications === "NO") queryParams.has_applications = "false";

    if (debouncedParams.status !== "ALL") queryParams.status = debouncedParams.status;
    if (debouncedParams.social_category !== "ALL") queryParams.social_category = debouncedParams.social_category;
    if (debouncedParams.date_from) queryParams.date_from = debouncedParams.date_from;
    if (debouncedParams.date_to) queryParams.date_to = debouncedParams.date_to;

    client
      .get("/admin/candidates", { params: queryParams })
      .then((r) => setData(r.data))
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load candidates.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCandidates();
  }, [page, debouncedParams]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetFilters = () => {
    setSearch("");
    setFilterName("");
    setFilterMobile("");
    setFilterEmail("");
    setFilterMinApps("");
    setFilterMaxApps("");
    setFilterHasApps("ALL");
    setFilterStatus("ALL");
    setFilterCategory("ALL");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const hasActiveFilters = Boolean(
    search ||
    filterName ||
    filterMobile ||
    filterEmail ||
    filterMinApps ||
    filterMaxApps ||
    filterHasApps !== "ALL" ||
    filterStatus !== "ALL" ||
    filterCategory !== "ALL" ||
    filterDateFrom ||
    filterDateTo
  );

  const getInitials = (name?: string | null) => {
    if (!name || !name.trim()) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Approved
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
            <Clock className="w-2.5 h-2.5 text-amber-600" /> Pending
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300">
            <XCircle className="w-2.5 h-2.5 text-rose-600" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
            <HelpCircle className="w-2.5 h-2.5 text-slate-400" /> Unapplied
          </span>
        );
    }
  };

  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Registered Candidates</h1>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive directory of artisan candidates, verification status, and submission records
              </p>
            </div>
          </div>
        </div>

        {/* Top Controls: General Search, Filter Toggle, and Reset */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Top Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, mobile, email..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Toggle Header Filters Row Button */}
          <button
            onClick={() => setShowHeaderFilters(!showHeaderFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showHeaderFilters
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
            title="Toggle column header filters row"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showHeaderFilters ? "Hide Header Filters" : "Show Header Filters"}</span>
          </button>

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              title="Reset all search filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              {/* Primary Column Header Row */}
              <tr>
                <th className="px-5 py-3.5">Candidate Name / Identity</th>
                <th className="px-5 py-3.5">Mobile Number</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5 text-center">Applications Filed</th>
                <th className="px-5 py-3.5 text-center">Latest Status / Category</th>
                <th className="px-5 py-3.5">Registered On</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>

              {/* Interactive Header Filters Row */}
              {showHeaderFilters && (
                <tr className="bg-slate-100/90 border-t border-slate-200 font-normal normal-case">
                  {/* 1. Candidate Name (Text Search) */}
                  <th className="px-5 py-2">
                    <div className="relative">
                      <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="Search name..."
                        className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                      />
                    </div>
                  </th>

                  {/* 2. Mobile Number (Text Search) */}
                  <th className="px-5 py-2">
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={filterMobile}
                        onChange={(e) => setFilterMobile(e.target.value)}
                        placeholder="Search mobile..."
                        className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-normal"
                      />
                    </div>
                  </th>

                  {/* 3. Email (Text Search) */}
                  <th className="px-5 py-2">
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={filterEmail}
                        onChange={(e) => setFilterEmail(e.target.value)}
                        placeholder="Search email..."
                        className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                      />
                    </div>
                  </th>

                  {/* 4. Applications Filed (Numeric Min-Max Range & Boolean Yes/No) */}
                  <th className="px-5 py-2">
                    <div className="flex flex-col gap-1 items-center max-w-[160px] mx-auto">
                      {/* Min-Max numeric inputs */}
                      <div className="flex items-center gap-1 w-full">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            value={filterMinApps}
                            onChange={(e) => setFilterMinApps(e.target.value)}
                            placeholder="Min"
                            aria-label="Minimum applications"
                            className="w-full px-1.5 py-0.5 text-[11px] border border-slate-300 rounded bg-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <span className="text-slate-400 text-[10px]">–</span>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            value={filterMaxApps}
                            onChange={(e) => setFilterMaxApps(e.target.value)}
                            placeholder="Max"
                            aria-label="Maximum applications"
                            className="w-full px-1.5 py-0.5 text-[11px] border border-slate-300 rounded bg-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      {/* Boolean Filed: All / Yes (1+) / No (0) */}
                      <select
                        value={filterHasApps}
                        onChange={(e) => setFilterHasApps(e.target.value)}
                        aria-label="Filter has filed applications"
                        className="w-full px-1.5 py-0.5 text-[10px] border border-slate-300 rounded bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="ALL">Filed: All</option>
                        <option value="YES">Yes (1+)</option>
                        <option value="NO">No (0)</option>
                      </select>
                    </div>
                  </th>

                  {/* 5. Latest Status & Category (Dropdown / Multi-Select Filters) */}
                  <th className="px-5 py-2">
                    <div className="flex flex-col gap-1 items-center max-w-[150px] mx-auto">
                      {/* Status Dropdown */}
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        aria-label="Filter status"
                        className="w-full px-1.5 py-0.5 text-[10px] border border-slate-300 rounded bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="ALL">Status: All</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PENDING">Pending</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="NONE">Unapplied</option>
                      </select>
                      {/* Social Category Dropdown */}
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        aria-label="Filter social category"
                        className="w-full px-1.5 py-0.5 text-[10px] border border-slate-300 rounded bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="ALL">Category: All</option>
                        <option value="GENERAL">General</option>
                        <option value="SC">SC</option>
                        <option value="ST">ST</option>
                        <option value="OBC">OBC</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </th>

                  {/* 6. Registered On (Date Range: From - To) */}
                  <th className="px-5 py-2">
                    <div className="flex flex-col gap-1 max-w-[160px]">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 w-7 shrink-0">From:</span>
                        <input
                          type="date"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                          aria-label="Registered date from"
                          className="w-full px-1 py-0.5 text-[10px] border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 w-7 shrink-0">To:</span>
                        <input
                          type="date"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                          aria-label="Registered date to"
                          className="w-full px-1 py-0.5 text-[10px] border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </th>

                  {/* 7. Action Reset Header */}
                  <th className="px-5 py-2 text-right">
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                        title="Clear all filters"
                      >
                        Clear Filters
                      </button>
                    )}
                  </th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-44" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-7 bg-slate-200 rounded-full w-7 mx-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-5 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-7 bg-slate-200 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-rose-600 font-semibold text-sm">
                    {error}
                  </td>
                </tr>
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 space-y-2">
                    <p className="font-bold text-slate-700">No candidates found matching criteria</p>
                    <p className="text-xs text-slate-500">
                      {hasActiveFilters
                        ? "Try clearing some header filters or widening numeric/date ranges."
                        : "No applicants have registered on the platform yet."}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data.data.map((candidate) => {
                  const fullName = candidate.full_name?.trim();
                  const appCount = candidate.application_count ?? candidate.applications_count ?? 0;

                  return (
                    <tr key={candidate.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Candidate Name / Identity Column */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 border border-blue-300 flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                            {getInitials(fullName)}
                          </div>
                          <div>
                            {fullName ? (
                              <span className="font-bold text-slate-900 block leading-tight text-sm">
                                {fullName}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs block leading-tight">
                                — (No application filed)
                              </span>
                            )}
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-400" title={candidate.id}>
                                ID: {candidate.id.slice(0, 8)}...
                              </span>
                              <button
                                onClick={() => handleCopyId(candidate.id)}
                                className="text-slate-400 hover:text-slate-700 transition p-0.5 rounded hover:bg-slate-200/60"
                                title="Copy Candidate ID"
                              >
                                {copiedId === candidate.id ? (
                                  <Check className="w-3 h-3 text-blue-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mobile Number */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap text-sm">
                        {candidate.mobile_number}
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 text-slate-600 text-xs">
                        {candidate.email || <span className="text-slate-400 italic">—</span>}
                      </td>

                      {/* Applications Filed (Numeric Badge) */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black border shadow-2xs ${
                            appCount > 0
                              ? "bg-blue-50 text-blue-800 border-blue-300 font-bold"
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          }`}
                        >
                          {appCount}
                        </span>
                      </td>

                      {/* Latest Status & Social Category */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          {getStatusBadge(candidate.latest_status)}
                          {candidate.social_category && candidate.social_category !== "NONE" && (
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {candidate.social_category}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Registered On */}
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(candidate.created_at)}
                      </td>

                      {/* Actions: View Applications Dossier */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {appCount > 0 ? (
                          <button
                            onClick={() => navigate(`/admin/applications?search=${candidate.mobile_number}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition cursor-pointer shadow-2xs"
                            title={`View applications filed by ${candidate.mobile_number}`}
                          >
                            <span>Dossier</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium italic">No Dossier</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Summary Bar */}
        {data && data.total > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <span>
              Showing{" "}
              <strong className="text-slate-900">{Math.min(data.total, (page - 1) * pageSize + 1)}</strong>
              {" "}to{" "}
              <strong className="text-slate-900">{Math.min(data.total, page * pageSize)}</strong>
              {" "}of <strong className="text-slate-900">{data.total}</strong> registered candidates
              {hasActiveFilters && (
                <span className="ml-2 text-blue-700 font-semibold">(Filters active)</span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="px-2 font-bold text-slate-800">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
