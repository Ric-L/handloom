import { useState, useEffect } from "react";
import { Users, ChevronLeft, ChevronRight, Search } from "lucide-react";
import client from "../../api/client";
import { formatDate } from "../../lib/utils";

interface Candidate {
  id: string;
  mobile_number: string;
  email?: string | null;
  application_count?: number;
  applications_count?: number;
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [data, setData] = useState<PaginatedCandidates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch candidates
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    client
      .get("/admin/candidates", {
        params: { page, page_size: pageSize, search: debouncedSearch || undefined },
      })
      .then((r) => setData(r.data))
      .catch(() => setError("Failed to load candidates."))
      .finally(() => setIsLoading(false));
  }, [page, debouncedSearch]);

  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center shadow-md">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Registered Candidates</h1>
              <p className="text-xs text-slate-500 font-medium">All applicants registered on the platform</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by mobile number..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Mobile Number</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4 text-center">Applications Filed</th>
                <th className="px-6 py-4">Registered On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-40" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="h-6 bg-slate-200 rounded-full w-8 mx-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-24" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-rose-600 font-medium">
                    {error}
                  </td>
                </tr>
              ) : !data?.data?.length ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 space-y-2">
                    <p className="font-bold text-slate-700">No candidates found</p>
                    <p className="text-xs text-slate-500">
                      {debouncedSearch ? "Try a different mobile number." : "No applicants have registered yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                data.data.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {candidate.mobile_number}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{candidate.email || "—"}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        {candidate.application_count ?? candidate.applications_count ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                      {formatDate(candidate.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-600 font-medium">
            <span>
              Showing{" "}
              <strong className="text-slate-900">{Math.min(data.total, (page - 1) * pageSize + 1)}</strong>
              {" "}to{" "}
              <strong className="text-slate-900">{Math.min(data.total, page * pageSize)}</strong>
              {" "}of{" "}
              <strong className="text-slate-900">{data.total}</strong> candidates
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2.5 font-bold text-slate-800">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
