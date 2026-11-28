import { useState, useEffect } from "react";
import {
  FileText,
  ShieldAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  HardDrive,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  Globe,
  Database,
  Lock,
  Layers,
  ArrowRight,
  Filter,
} from "lucide-react";
import { getAdminAuditLogs, getAdminAuditFiles } from "../../api";
import type { AuditLogRowItem, AuditFileInfo } from "../../types";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRowItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [files, setFiles] = useState<AuditFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Inspect Modal
  const [selectedEntry, setSelectedEntry] = useState<AuditLogRowItem | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminAuditLogs({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        action: actionFilter || undefined,
        actor_role: roleFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setLogs(data.entries || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load audit trail records.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const data = await getAdminAuditFiles();
      setFiles(data.files || []);
    } catch {
      // Non-blocking file metadata
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, debouncedSearch, actionFilter, roleFilter, startDate, endDate]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const totalPages = Math.ceil(total / pageSize) || 1;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-purple-100 text-purple-800 border border-purple-200">SUPER ADMIN</span>;
      case "REVIEWER_ADMIN":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-[#EFE6D5] text-[#734C30] border border-[#D9C5A3]">REVIEWER</span>;
      case "APPLICANT":
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-100 text-[#5C6B45] border border-[#5C6B45]/40">APPLICANT</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-[#FAF6EE] text-slate-700 border border-[#D9C5A3]">{role || "ANONYMOUS"}</span>;
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes("APPROVE")) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-[#5C6B45] border border-[#5C6B45]/40">{action}</span>;
    }
    if (action.includes("REJECT") || action.includes("DENIED") || action.includes("FAILED")) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200">{action}</span>;
    }
    if (action.includes("QUOTA") || action.includes("ROLE") || action.includes("UPDATE") || action.includes("TOGGLE")) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">{action}</span>;
    }
    if (action.includes("EXPORT")) {
      return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#EFE6D5] text-[#734C30] border border-[#D9C5A3]">{action}</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#FAF6EE] text-[#3B3028] border border-[#D9C5A3]">{action}</span>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="flex items-center gap-1 text-xs text-[#5C6B45] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5C6B45]" /> Success
          </span>
        );
      case "FAILED":
        return (
          <span className="flex items-center gap-1 text-xs text-rose-700 font-semibold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Failed
          </span>
        );
      case "DENIED":
        return (
          <span className="flex items-center gap-1 text-xs text-amber-700 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Denied
          </span>
        );
      default:
        return <span className="text-xs text-[#6E5D50]">{status}</span>;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner & Security Summary */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#5C6B45] text-white p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-[#5C6B45]/40/30 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" /> Tamper-Resistant Ledger
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/20 text-sky-300 border border-[#8B5E3C]/30 rounded-full flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-sky-400" /> Persistent Date Files
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7 text-amber-400" />
              Administrative Audit Ledger &amp; Security Trail
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              Every administrative operation across Reviewer and Super Administrator roles is immutably recorded in dual persistent storage: date-partitioned server disk logs (<code className="text-amber-300 font-mono text-xs">audit-YYYY-MM-DD.log</code>) and PostgreSQL database tables protected by database triggers that strictly prohibit updates or deletions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                fetchLogs();
                fetchFiles();
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-[#8B5E3C] hover:bg-[#8B5E3C] disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Daily Persistent Files Inventory */}
      <div className="bg-white rounded-xl shadow-xs border border-[#D9C5A3] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#8B5E3C]" />
            <h2 className="font-bold text-[#3B3028] text-base">Persistent Daily Server Log Files</h2>
          </div>
          <span className="text-xs text-[#6E5D50]">
            {files.length} active daily partition{files.length === 1 ? "" : "s"} on disk
          </span>
        </div>

        {isLoadingFiles ? (
          <div className="text-center py-4 text-xs text-slate-400">Loading daily file inventory...</div>
        ) : files.length === 0 ? (
          <div className="text-xs text-[#6E5D50] bg-[#FAF6EE] p-3 rounded-lg border border-[#D9C5A3]">
            No daily audit files created on disk yet. Activity will automatically initialize date-partitioned files.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {files.map((file) => (
              <div
                key={file.filename}
                className="bg-[#FAF6EE] hover:bg-[#FAF6EE] transition border border-[#D9C5A3] rounded-lg p-3 text-xs flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#3B3028]">{file.filename}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-[#5C6B45]">
                    {(file.size_bytes / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#6E5D50] text-[11px]">
                  <span>Date: {file.date}</span>
                  <span>Mod: {new Date(file.last_modified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-xs border border-[#D9C5A3] p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-[#D9C5A3] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#6E5D50]" />
            <span className="font-bold text-[#3B3028] text-sm">Filter Audit Records</span>
          </div>
          <span className="text-xs text-[#6E5D50] font-medium">
            Total Audit Records: <strong className="text-[#3B3028]">{total}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search action, resource, target ID, IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FAF6EE] border border-[#D9C5A3] rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B5E3C]/30/20 focus:border-[#8B5E3C]"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#FAF6EE] border border-[#D9C5A3] rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B5E3C]/30/20 focus:border-[#8B5E3C]"
            >
              <option value="">All Actions</option>
              <option value="APPLICATION_APPROVED">APPLICATION_APPROVED</option>
              <option value="APPLICATION_REJECTED">APPLICATION_REJECTED</option>
              <option value="APPLICATION_INSPECTED">APPLICATION_INSPECTED</option>
              <option value="APPLICATION_DOSSIER_UPDATED">APPLICATION_DOSSIER_UPDATED</option>
              <option value="APPLICATIONS_LIST_VIEWED">APPLICATIONS_LIST_VIEWED</option>
              <option value="CANDIDATES_LIST_VIEWED">CANDIDATES_LIST_VIEWED</option>
              <option value="CATEGORY_QUOTA_UPDATED">CATEGORY_QUOTA_UPDATED</option>
              <option value="CATEGORY_CREATED">CATEGORY_CREATED</option>
              <option value="CATEGORY_UPDATED">CATEGORY_UPDATED</option>
              <option value="CATEGORY_TOGGLED">CATEGORY_TOGGLED</option>
              <option value="CATEGORY_DELETED">CATEGORY_DELETED</option>
              <option value="USER_ROLE_UPDATED">USER_ROLE_UPDATED</option>
              <option value="USERS_LIST_VIEWED">USERS_LIST_VIEWED</option>
              <option value="DATA_EXPORTED">DATA_EXPORTED</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="AUDIT_LOGS_VIEWED">AUDIT_LOGS_VIEWED</option>
            </select>
          </div>

          {/* Actor Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#FAF6EE] border border-[#D9C5A3] rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B5E3C]/30/20 focus:border-[#8B5E3C]"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
              <option value="REVIEWER_ADMIN">REVIEWER_ADMIN</option>
              <option value="APPLICANT">APPLICANT</option>
              <option value="ANONYMOUS">ANONYMOUS</option>
            </select>
          </div>

          {/* Date Range Start */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-[#FAF6EE] border border-[#D9C5A3] rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B5E3C]/30/20 focus:border-[#8B5E3C]"
              title="Start Date"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl shadow-xs border border-[#D9C5A3] overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-50 text-rose-800 border-b border-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6EE] border-b border-[#D9C5A3] text-[#6E5D50] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource / Target</th>
                <th className="py-3 px-4">Client IP</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9DEC8]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#8B5E3C] mb-2" />
                    Querying immutable audit ledger...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[#6E5D50]">
                    No audit records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#FAF6EE] transition">
                    <td className="py-3 px-4 font-mono text-[#6E5D50] whitespace-nowrap">
                      {formatTimestamp(entry.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <div>{getRoleBadge(entry.actor_role)}</div>
                        {entry.actor_id && (
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={entry.actor_id}>
                            {entry.actor_id.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(entry.action)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-[#3B3028] capitalize">
                          {entry.resource_type || "—"}
                        </span>
                        {entry.target_id && (
                          <span className="font-mono text-[10px] text-[#6E5D50] truncate max-w-[140px]" title={entry.target_id}>
                            ID: {entry.target_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#6E5D50] whitespace-nowrap">
                      {entry.ip_address || "—"}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(entry.status)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="px-2.5 py-1.5 bg-[#FAF6EE] hover:bg-[#EFE6D5] hover:text-[#734C30] text-slate-700 rounded-md font-medium text-xs flex items-center gap-1.5 transition ml-auto border border-[#D9C5A3]"
                        title="Inspect full audit record"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#8B5E3C]" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 bg-[#FAF6EE] border-t border-[#D9C5A3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6E5D50]">
          <div>
            Showing <strong className="text-[#3B3028]">{logs.length > 0 ? (page - 1) * pageSize + 1 : 0}</strong> to{" "}
            <strong className="text-[#3B3028]">{Math.min(page * pageSize, total)}</strong> of{" "}
            <strong className="text-[#3B3028]">{total}</strong> records
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="px-3 py-1.5 bg-white border border-[#D9C5A3] rounded-md font-medium text-slate-700 hover:bg-[#FAF6EE] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="font-semibold text-[#3B3028] px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages || isLoading}
              className="px-3 py-1.5 bg-white border border-[#D9C5A3] rounded-md font-medium text-slate-700 hover:bg-[#FAF6EE] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-2xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Redaction Notice */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Automated Redaction Guarantee:</strong> In accordance with portal cybersecurity guidelines, all sensitive attributes including passwords, cryptographic tokens, bank account numbers, credentials, and session secrets are scrubbed at ingestion to <code className="font-mono text-amber-800 font-bold bg-amber-100 px-1 py-0.5 rounded">[REDACTED]</code> before any persistent record is written.
        </div>
      </div>

      {/* Entry Inspection Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-[#3B3028]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#D9C5A3] max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-sky-400" />
                <div>
                  <h3 className="font-bold text-base text-white">
                    Audit Entry #{selectedEntry.id}
                  </h3>
                  <p className="text-slate-300 text-xs font-mono">
                    {selectedEntry.action} • {formatTimestamp(selectedEntry.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="w-8 h-8 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs text-slate-700">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF6EE] p-4 rounded-xl border border-[#D9C5A3]">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Role</span>
                  <div className="mt-0.5">{getRoleBadge(selectedEntry.actor_role)}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedEntry.status)}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Resource Type</span>
                  <span className="font-semibold text-[#3B3028] capitalize block mt-0.5">
                    {selectedEntry.resource_type || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Target ID</span>
                  <span className="font-mono text-[#3B3028] truncate block mt-0.5" title={selectedEntry.target_id}>
                    {selectedEntry.target_id || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Actor ID</span>
                  <span className="font-mono text-[#3B3028] truncate block mt-0.5" title={selectedEntry.actor_id}>
                    {selectedEntry.actor_id || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Client IP</span>
                  <span className="font-mono text-[#3B3028] block mt-0.5">
                    {selectedEntry.ip_address || "—"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">User Agent</span>
                  <span className="font-mono text-slate-700 text-[10px] truncate block mt-0.5" title={selectedEntry.user_agent}>
                    {selectedEntry.user_agent || "—"}
                  </span>
                </div>
              </div>

              {/* Before vs After State Comparison */}
              {(selectedEntry.before_state || selectedEntry.after_state) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-[#D9C5A3] rounded-xl overflow-hidden">
                    <div className="bg-[#FAF6EE] px-3 py-1.5 font-bold text-slate-700 text-[11px] border-b border-[#D9C5A3]">
                      Before State
                    </div>
                    <pre className="p-3 bg-[#3B3028] text-sky-300 font-mono text-[11px] overflow-x-auto max-h-48">
                      {selectedEntry.before_state ? JSON.stringify(selectedEntry.before_state, null, 2) : "null"}
                    </pre>
                  </div>
                  <div className="border border-[#D9C5A3] rounded-xl overflow-hidden">
                    <div className="bg-[#FAF6EE] px-3 py-1.5 font-bold text-slate-700 text-[11px] border-b border-[#D9C5A3]">
                      After State
                    </div>
                    <pre className="p-3 bg-[#3B3028] text-emerald-300 font-mono text-[11px] overflow-x-auto max-h-48">
                      {selectedEntry.after_state ? JSON.stringify(selectedEntry.after_state, null, 2) : "null"}
                    </pre>
                  </div>
                </div>
              )}

              {/* Details JSON */}
              {selectedEntry.details && (
                <div className="border border-[#D9C5A3] rounded-xl overflow-hidden">
                  <div className="bg-[#FAF6EE] px-3 py-1.5 font-bold text-slate-700 text-[11px] border-b border-[#D9C5A3]">
                    Operation Details &amp; Parameters
                  </div>
                  <pre className="p-3 bg-[#3B3028] text-amber-200 font-mono text-[11px] overflow-x-auto max-h-48">
                    {JSON.stringify(selectedEntry.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF6EE] border-t border-[#D9C5A3] flex justify-end">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-[#3B3028] text-white rounded-lg text-xs font-semibold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
