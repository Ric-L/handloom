import { useState, useEffect } from "react";
import { UserCog, ChevronLeft, ChevronRight, Search, Shield, AlertCircle, CheckCircle2 } from "lucide-react";
import client from "../../api/client";
import { formatDate } from "../../lib/utils";
import type { UserRole } from "../../types";

interface SystemUser {
  id: string;
  mobile_number: string;
  email?: string | null;
  role: UserRole;
  created_at: string;
}

interface PaginatedUsers {
  data: SystemUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = () => {
    setIsLoading(true);
    setError(null);
    client
      .get("/admin/users", {
        params: { page, page_size: pageSize, search: debouncedSearch || undefined },
      })
      .then((r) => setData(r.data))
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load system users.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedSearch]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    setUpdatingId(userId);
    setStatusMsg(null);

    try {
      await client.put(`/admin/users/${userId}/role`, { role: newRole });
      setStatusMsg({ type: "success", text: "User role updated successfully." });
      fetchUsers();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to update role.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-700 flex items-center justify-center shadow-md">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">User &amp; RBAC Management</h1>
              <p className="text-xs text-slate-500 font-medium">Manage system users, privileges, and role permissions</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search mobile number..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
          />
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-xl flex items-center gap-3 text-xs text-blue-900">
        <Shield className="w-4 h-4 text-blue-700 shrink-0" />
        <span>
          <strong>Super Admin Console:</strong> You can reassign operational staff roles between Candidate (Applicant) and Reviewer Admin. Root Super Admin permissions are immutable for system security.
        </span>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-semibold ${
            statusMsg.type === "success"
              ? "bg-blue-50 text-blue-800 border-blue-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Mobile Number</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Current Role</th>
                <th className="px-6 py-4">Registered On</th>
                <th className="px-6 py-4 text-right">Role Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="px-6 py-4"><div className="h-6 bg-slate-200 rounded-full w-24" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="px-6 py-4 text-right"><div className="h-8 bg-slate-200 rounded w-32 ml-auto" /></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-rose-600 font-semibold text-sm">
                    {error}
                  </td>
                </tr>
              ) : !data || data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 space-y-2">
                    <p className="font-bold text-slate-700">No users found</p>
                    <p className="text-xs text-slate-500">Try adjusting your search criteria.</p>
                  </td>
                </tr>
              ) : (
                data.data.map((user) => {
                  const isSuper = user.role === "SUPER_ADMIN";
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                        {user.id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {user.mobile_number}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{user.email || "—"}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border shadow-2xs ${
                            isSuper
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : user.role === "REVIEWER_ADMIN"
                              ? "bg-blue-50 text-blue-800 border-blue-300"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isSuper ? (
                          <span className="text-xs text-slate-400 font-medium italic">Fixed Root Authority</span>
                        ) : (
                          <select
                            disabled={updatingId === user.id}
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer disabled:opacity-50"
                          >
                            <option value="APPLICANT">APPLICANT</option>
                            <option value="REVIEWER_ADMIN">REVIEWER_ADMIN</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
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
              {" "}of <strong className="text-slate-900">{data.total}</strong> users
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
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

