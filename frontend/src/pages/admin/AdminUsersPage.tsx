import { useState, useEffect } from "react";
import {
  UserCog,
  ChevronLeft,
  ChevronRight,
  Search,
  Shield,
  AlertCircle,
  CheckCircle2,
  Filter,
  RotateCcw,
  UserCheck,
  Copy,
  Check,
  User,
  Phone,
  Mail,
  Fingerprint,
  UserPlus,
  UserX,
  X,
  Lock,
  Sliders,
  ShieldAlert,
} from "lucide-react";
import client from "../../api/client";
import { formatDate } from "../../lib/utils";
import type { UserRole } from "../../types";
import AdminUserManagementModal, { type ManagedUser } from "../../components/admin/AdminUserManagementModal";

interface SystemUser {
  id: string;
  mobile_number: string;
  email?: string | null;
  role: UserRole;
  created_at: string;
  full_name?: string | null;
  is_disabled?: boolean;
  disabled_reason?: string | null;
  permissions?: {
    can_review?: boolean;
    can_approve?: boolean;
    can_reject?: boolean;
    can_export?: boolean;
    [key: string]: any;
  };
}

interface PaginatedUsers {
  data: SystemUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AdminUsersPage() {
  // Global / Top Search
  const [searchMobile, setSearchMobile] = useState("");
  const [searchUserId, setSearchUserId] = useState("");

  // Column Header Filters
  const [filterUserId, setFilterUserId] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterMobile, setFilterMobile] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterRole, setFilterRole] = useState("STAFF"); // Default: filter out role APPLICANT!
  const [showHeaderFilters, setShowHeaderFilters] = useState(true);

  // Add Admin User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: "",
    mobile_number: "",
    email: "",
    password: "",
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Super Admin Management Modal State
  const [selectedUserForManagement, setSelectedUserForManagement] = useState<ManagedUser | null>(null);

  // Debounced filters to prevent API spam
  const [debouncedParams, setDebouncedParams] = useState({
    user_id: "",
    mobile: "",
    name: "",
    email: "",
    role: "STAFF",
  });

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce search and header filters together
  useEffect(() => {
    const timer = setTimeout(() => {
      const effectiveUserId = (filterUserId || searchUserId).trim();
      const effectiveMobile = (filterMobile || searchMobile).trim();
      const effectiveName = filterName.trim();
      const effectiveEmail = filterEmail.trim();

      setDebouncedParams({
        user_id: effectiveUserId,
        mobile: effectiveMobile,
        name: effectiveName,
        email: effectiveEmail,
        role: filterRole,
      });
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchMobile, searchUserId, filterUserId, filterMobile, filterName, filterEmail, filterRole]);

  const fetchUsers = () => {
    setIsLoading(true);
    setError(null);

    const queryParams: Record<string, any> = {
      page,
      page_size: pageSize,
    };

    if (debouncedParams.user_id) queryParams.user_id = debouncedParams.user_id;
    if (debouncedParams.mobile) queryParams.mobile = debouncedParams.mobile;
    if (debouncedParams.name) queryParams.name = debouncedParams.name;
    if (debouncedParams.email) queryParams.email = debouncedParams.email;
    if (debouncedParams.role) queryParams.role = debouncedParams.role;

    client
      .get("/admin/users", { params: queryParams })
      .then((r) => setData(r.data))
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load system users.");
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [page, debouncedParams]);

  // Promote a user to Reviewer Admin (cannot assign APPLICANT)
  const handlePromoteToAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to promote this candidate to Reviewer Admin? They will receive administrative moderation privileges.")) {
      return;
    }

    setActionInProgressId(userId);
    setStatusMsg(null);

    try {
      await client.put(`/admin/users/${userId}/role`, { role: "REVIEWER_ADMIN" });
      setStatusMsg({ type: "success", text: "User promoted to Reviewer Admin successfully." });
      fetchUsers();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to update role.",
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  // Revoke an admin account
  const handleRevokeAdmin = async (userId: string, identifier: string) => {
    if (!confirm(`Are you sure you want to revoke administrator access for ${identifier}? This will permanently remove their admin credentials and terminate active sessions.`)) {
      return;
    }

    setActionInProgressId(userId);
    setStatusMsg(null);

    try {
      await client.delete(`/admin/users/${userId}`);
      setStatusMsg({ type: "success", text: "Administrator privileges revoked successfully." });
      fetchUsers();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.error || "Failed to revoke administrator access.",
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  // Handle Create Admin User
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddFormError(null);

    if (!addForm.full_name.trim()) {
      setAddFormError("Full Name is required.");
      return;
    }
    if (!/^\d{10}$/.test(addForm.mobile_number.trim())) {
      setAddFormError("Mobile Number must be exactly 10 digits.");
      return;
    }
    if (addForm.password.length < 8) {
      setAddFormError("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmittingAdd(true);
    try {
      await client.post("/admin/users", {
        full_name: addForm.full_name.trim(),
        mobile_number: addForm.mobile_number.trim(),
        email: addForm.email.trim() || undefined,
        password: addForm.password,
        role: "REVIEWER_ADMIN",
      });

      setStatusMsg({ type: "success", text: `Reviewer Admin "${addForm.full_name.trim()}" created successfully.` });
      setIsAddModalOpen(false);
      setAddForm({ full_name: "", mobile_number: "", email: "", password: "" });
      fetchUsers();
    } catch (err: any) {
      setAddFormError(err.response?.data?.error || "Failed to create administrator account.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetFilters = () => {
    setSearchMobile("");
    setSearchUserId("");
    setFilterUserId("");
    setFilterName("");
    setFilterMobile("");
    setFilterEmail("");
    setFilterRole("STAFF");
  };

  const hasActiveFilters = Boolean(
    searchMobile ||
    searchUserId ||
    filterUserId ||
    filterName ||
    filterMobile ||
    filterEmail ||
    filterRole !== "STAFF"
  );

  const getInitials = (name?: string | null) => {
    if (!name || !name.trim()) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center shadow-md">
              <UserCog className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">User &amp; RBAC Management</h1>
              <p className="text-xs text-slate-500 font-medium">Manage administrative staff accounts, authority levels, and moderation privileges</p>
            </div>
          </div>
        </div>

        {/* Top Action Bar: Add Admin Button, Searches, and Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Admin User Button (Super Admin Exclusive Authority) */}
          <button
            onClick={() => {
              setAddFormError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-blue-700 hover:bg-blue-800 text-white shadow-md transition cursor-pointer"
            title="Provision a new Reviewer Admin account"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Admin User</span>
          </button>

          {/* Search by Mobile */}
          <div className="relative w-full sm:w-48">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              placeholder="Search Mobile..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
            />
            {searchMobile && (
              <button
                onClick={() => setSearchMobile("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Search by User ID */}
          <div className="relative w-full sm:w-48">
            <Fingerprint className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              placeholder="Search User ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium font-mono"
            />
            {searchUserId && (
              <button
                onClick={() => setSearchUserId("")}
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
            title="Toggle column header filters"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{showHeaderFilters ? "Hide Filters" : "Show Filters"}</span>
          </button>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition cursor-pointer"
              title="Reset all filters to default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Security Authority Banner */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200/90 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-center gap-3">
          <Shield className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            <strong>Super Admin Authority:</strong> Only Super Administrators reserve the right to provision new administrative accounts. Assigning users to the Applicant role is prohibited, as applicants register independently through the public portal.
          </span>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role View:</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs font-bold px-2.5 py-1 rounded-lg border border-blue-300 bg-white text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          >
            <option value="STAFF">Administrative Staff (Default)</option>
            <option value="SUPER_ADMIN">Super Admins Only</option>
            <option value="REVIEWER_ADMIN">Reviewer Admins Only</option>
            <option value="ALL">All Accounts (Include Candidates)</option>
            <option value="APPLICANT">Candidates Only</option>
          </select>
        </div>
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
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              {/* Primary Column Header Row */}
              <tr>
                <th className="px-5 py-3.5">User ID</th>
                <th className="px-5 py-3.5">Full Name / Identity</th>
                <th className="px-5 py-3.5">Mobile Number</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">Current Role</th>
                <th className="px-5 py-3.5">Registered On</th>
                <th className="px-5 py-3.5 text-right">Administrative Actions</th>
              </tr>

              {/* Interactive Header Filters Row */}
              {showHeaderFilters && (
                <tr className="bg-slate-100/90 border-t border-slate-200 font-normal normal-case">
                  {/* User ID Header Filter */}
                  <th className="px-5 py-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={filterUserId}
                        onChange={(e) => setFilterUserId(e.target.value)}
                        placeholder="Filter ID..."
                        className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-normal"
                      />
                    </div>
                  </th>

                  {/* Name Header Filter */}
                  <th className="px-5 py-2">
                    <div className="relative">
                      <User className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="Filter Name..."
                        className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                      />
                    </div>
                  </th>

                  {/* Mobile Header Filter */}
                  <th className="px-5 py-2">
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={filterMobile}
                        onChange={(e) => setFilterMobile(e.target.value)}
                        placeholder="Filter Mobile..."
                        className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-normal"
                      />
                    </div>
                  </th>

                  {/* Email Header Filter */}
                  <th className="px-5 py-2">
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={filterEmail}
                        onChange={(e) => setFilterEmail(e.target.value)}
                        placeholder="Filter Email..."
                        className="w-full pl-7 pr-2 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-normal"
                      />
                    </div>
                  </th>

                  {/* Role Header Filter Dropdown */}
                  <th className="px-5 py-2">
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      aria-label="Filter role"
                      className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="STAFF">Staff (Default)</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                      <option value="REVIEWER_ADMIN">REVIEWER_ADMIN</option>
                      <option value="ALL">All Roles</option>
                      <option value="APPLICANT">APPLICANT</option>
                    </select>
                  </th>

                  {/* Registered On Filter */}
                  <th className="px-5 py-2">
                    <span className="text-[11px] text-slate-400 font-medium">All Dates</span>
                  </th>

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
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-16" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-28" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-36" /></td>
                    <td className="px-5 py-4"><div className="h-6 bg-slate-200 rounded-full w-24" /></td>
                    <td className="px-5 py-4"><div className="h-4 bg-slate-200 rounded w-24" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-8 bg-slate-200 rounded w-32 ml-auto" /></td>
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
                    <p className="font-bold text-slate-700">No users found matching current criteria</p>
                    <p className="text-xs text-slate-500">
                      Try adjusting filters or clicking &ldquo;Reset Filters&rdquo;.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                data.data.map((user) => {
                  const isSuper = user.role === "SUPER_ADMIN";
                  const isReviewer = user.role === "REVIEWER_ADMIN";
                  const isApplicant = user.role === "APPLICANT";
                  const fullName = user.full_name?.trim();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User ID with Copy action */}
                      <td className="px-5 py-4 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium" title={user.id}>
                            {user.id.slice(0, 8)}...
                          </span>
                          <button
                            onClick={() => handleCopyId(user.id)}
                            className="text-slate-400 hover:text-slate-700 transition p-1 rounded hover:bg-slate-200/60"
                            title="Copy full User ID"
                          >
                            {copiedId === user.id ? (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Full Name / Identity Display */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              isSuper
                                ? "bg-amber-100 text-amber-800 border border-amber-300"
                                : isReviewer
                                ? "bg-blue-100 text-blue-800 border border-blue-300"
                                : "bg-slate-100 text-slate-700 border border-slate-300"
                            }`}
                          >
                            {getInitials(fullName)}
                          </div>
                          <div>
                            {fullName ? (
                              <span className="font-bold text-slate-900 block leading-tight">{fullName}</span>
                            ) : (
                              <span className="text-slate-400 italic text-xs block leading-tight">— (No name recorded)</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mobile Number */}
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {user.mobile_number}
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 text-slate-600 text-xs">
                        {user.email || <span className="text-slate-400 italic">—</span>}
                      </td>

                      {/* Current Role & Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full border shadow-2xs ${
                              isSuper
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : isReviewer
                                ? "bg-blue-50 text-blue-800 border-blue-300"
                                : "bg-slate-100 text-slate-700 border-slate-300"
                            }`}
                          >
                            {isSuper ? (
                              <Shield className="w-3 h-3 text-amber-700" />
                            ) : isReviewer ? (
                              <UserCheck className="w-3 h-3 text-blue-700" />
                            ) : null}
                            {user.role}
                          </span>
                          {user.is_disabled && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-300">
                              <ShieldAlert className="w-2.5 h-2.5 text-rose-600" /> Disabled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Registered On */}
                      <td className="px-5 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(user.created_at)}
                      </td>

                      {/* Administrative Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isSuper ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-800 bg-amber-50/80 border border-amber-200/90 px-2.5 py-1 rounded-lg font-bold shadow-2xs">
                            <Lock className="w-3 h-3 text-amber-700" /> Fixed Root Authority
                          </span>
                        ) : isReviewer ? (
                          <button
                            onClick={() => setSelectedUserForManagement(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition cursor-pointer shadow-2xs"
                            title="Open Super Admin User Management Console"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Manage Admin</span>
                          </button>
                        ) : isApplicant ? (
                          <button
                            disabled={actionInProgressId === user.id}
                            onClick={() => handlePromoteToAdmin(user.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                            title="Promote Candidate to Reviewer Admin"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Promote to Admin</span>
                          </button>
                        ) : null}
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
              {" "}of <strong className="text-slate-900">{data.total}</strong> records
              {filterRole === "STAFF" && (
                <span className="ml-2 text-blue-700 font-semibold">(Administrative staff only)</span>
              )}
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

      {/* Modal: Add Administrator Account (Super Admin Exclusive Authority) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Add Administrator Account</h3>
                  <p className="text-[11px] text-slate-300">Super Admin Authorization Console</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              {addFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addFormError}</span>
                </div>
              )}

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                Only Super Administrators reserve the authority to add operational administrators. New accounts are provisioned with <strong>REVIEWER_ADMIN</strong> permissions.
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  placeholder="e.g. Anand Kumar"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Mobile Number (10 Digits) *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={addForm.mobile_number}
                  onChange={(e) => setAddForm({ ...addForm, mobile_number: e.target.value.replace(/\D/g, "") })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Email Address (Optional)</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="e.g. anand.kumar@handloom.gov.in"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Initial Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Assigned Role (Locked) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Assigned Privilege Role</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                  <UserCheck className="w-4 h-4 text-blue-700" />
                  <span>REVIEWER_ADMIN (Operational Reviewer Authority)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-blue-700 hover:bg-blue-800 text-white shadow transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingAdd ? "Provisioning..." : "Create Administrator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Super Admin User Management Modal */}
      <AdminUserManagementModal
        user={selectedUserForManagement}
        isOpen={Boolean(selectedUserForManagement)}
        onClose={() => setSelectedUserForManagement(null)}
        onUserUpdated={() => {
          fetchUsers();
          setSelectedUserForManagement(null);
        }}
      />
    </div>
  );
}
