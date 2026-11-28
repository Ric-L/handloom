import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  User,
  Phone,
  Mail,
  Key,
  LogOut,
  UserX,
  UserCheck,
  ShieldAlert,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Fingerprint,
} from "lucide-react";
import {
  disableAdminUser,
  enableAdminUser,
  resetAdminUserPassword,
  forceLogoutAdminUser,
  updateAdminUserPermissions,
  getAdminUserActivity,
  deleteAdminUser,
} from "../../api";
import { formatDate } from "../../lib/utils";
import type { UserRole } from "../../types";

export interface ManagedUser {
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

interface AdminUserManagementModalProps {
  user: ManagedUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: () => void;
}

type TabType = "controls" | "password" | "permissions" | "activity";

export default function AdminUserManagementModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}: AdminUserManagementModalProps) {
  if (!isOpen || !user) return null;

  const [activeTab, setActiveTab] = useState<TabType>("controls");

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // In-modal confirmation prompt states
  const [confirmAction, setConfirmAction] = useState<
    "force_logout" | "disable" | "enable" | "revoke" | null
  >(null);
  const [disableReason, setDisableReason] = useState("");

  // Password reset form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [copiedGenerated, setCopiedGenerated] = useState(false);

  // Permissions state
  const [permissions, setPermissions] = useState({
    can_review: user.permissions?.can_review ?? true,
    can_approve: user.permissions?.can_approve ?? true,
    can_reject: user.permissions?.can_reject ?? true,
    can_export: user.permissions?.can_export ?? true,
  });

  // Activity logs
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Clear messages when tab or user changes
  useEffect(() => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setConfirmAction(null);
    setNewPassword("");
    setConfirmPassword("");
    if (user.permissions) {
      setPermissions({
        can_review: user.permissions.can_review ?? true,
        can_approve: user.permissions.can_approve ?? true,
        can_reject: user.permissions.can_reject ?? true,
        can_export: user.permissions.can_export ?? true,
      });
    }
  }, [activeTab, user]);

  // Load activity logs when activity tab is opened
  useEffect(() => {
    if (activeTab === "activity" && user) {
      loadActivity();
    }
  }, [activeTab, user]);

  const loadActivity = () => {
    setIsLoadingActivity(true);
    getAdminUserActivity(user.id)
      .then((res) => {
        setActivityLogs(res.data || []);
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.error || "Failed to load activity logs.");
      })
      .finally(() => setIsLoadingActivity(false));
  };

  // Generate strong random password
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    navigator.clipboard.writeText(pwd);
    setCopiedGenerated(true);
    setTimeout(() => setCopiedGenerated(false), 3000);
  };

  // 1. Force Logout
  const handleForceLogout = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await forceLogoutAdminUser(user.id);
      setSuccessMsg("All active sessions across devices have been terminated.");
      setConfirmAction(null);
      onUserUpdated();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to terminate sessions.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Disable Account
  const handleDisableAccount = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await disableAdminUser(user.id, disableReason.trim() || undefined);
      setSuccessMsg("Administrator account disabled and active sessions revoked.");
      setConfirmAction(null);
      setDisableReason("");
      onUserUpdated();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to disable account.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Enable Account
  const handleEnableAccount = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await enableAdminUser(user.id);
      setSuccessMsg("Administrator account reactivated successfully.");
      setConfirmAction(null);
      onUserUpdated();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to reactivate account.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Revoke Admin Access
  const handleRevokeAccess = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await deleteAdminUser(user.id);
      onUserUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to revoke admin privileges.");
      setIsProcessing(false);
    }
  };

  // 5. Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await resetAdminUserPassword(user.id, newPassword);
      setSuccessMsg("Password reset successfully. Active sessions were terminated for security.");
      setNewPassword("");
      setConfirmPassword("");
      onUserUpdated();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Update Permissions
  const handleSavePermissions = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await updateAdminUserPermissions(user.id, permissions);
      setSuccessMsg("Administrative permissions updated successfully.");
      onUserUpdated();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to update permissions.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isSuperAdmin = user.role === "SUPER_ADMIN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B3028]/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#D9C5A3] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-[#3B3028] text-white flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#8B5E3C] flex items-center justify-center font-black text-sm text-white shadow-md">
              {user.full_name?.slice(0, 2).toUpperCase() || user.mobile_number.slice(-2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  {user.full_name || "Unnamed Administrator"}
                </h2>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isSuperAdmin
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : "bg-blue-500/20 text-[#D9C5A3] border-[#8B5E3C]/40"
                  }`}
                >
                  {user.role}
                </span>
                {user.is_disabled ? (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Account Disabled
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-[#5C6B45]/40/40">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-mono">
                <span>{user.mobile_number}</span>
                {user.email && <span>• {user.email}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disabled Account Notice Banner */}
        {user.is_disabled && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-semibold shrink-0">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              This account is currently <strong>disabled</strong>. Login is blocked and active sessions are revoked.
              {user.disabled_reason ? ` Reason: "${user.disabled_reason}"` : ""}
            </span>
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-[#D9C5A3] bg-[#FAF6EE] px-6 shrink-0">
          <button
            onClick={() => setActiveTab("controls")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "controls"
                ? "border-[#8B5E3C] text-[#8B5E3C] bg-white"
                : "border-transparent text-[#6E5D50] hover:text-[#3B3028]"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Overview &amp; Actions</span>
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "password"
                ? "border-[#8B5E3C] text-[#8B5E3C] bg-white"
                : "border-transparent text-[#6E5D50] hover:text-[#3B3028]"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => setActiveTab("permissions")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "permissions"
                ? "border-[#8B5E3C] text-[#8B5E3C] bg-white"
                : "border-transparent text-[#6E5D50] hover:text-[#3B3028]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "activity"
                ? "border-[#8B5E3C] text-[#8B5E3C] bg-white"
                : "border-transparent text-[#6E5D50] hover:text-[#3B3028]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity Logs</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notification Banners */}
          {successMsg && (
            <div className="p-3.5 bg-[#EEF2E7] border border-[#5C6B45]/40 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#5C6B45]">
              <CheckCircle2 className="w-4 h-4 text-[#5C6B45] shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & ACCOUNT ACTIONS */}
          {activeTab === "controls" && (
            <div className="space-y-5">
              {/* Identity & Metadata Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">User ID</span>
                  <span className="font-mono text-[#3B3028] font-bold block truncate" title={user.id}>
                    {user.id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Registered On</span>
                  <span className="text-[#3B3028] font-bold block">{formatDate(user.created_at)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Assigned Role</span>
                  <span className="font-bold text-[#3B3028] block">{user.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[11px]">Account Status</span>
                  <span
                    className={`font-bold block ${
                      user.is_disabled ? "text-rose-600" : "text-[#5C6B45]"
                    }`}
                  >
                    {user.is_disabled ? "Disabled" : "Operational / Active"}
                  </span>
                </div>
              </div>

              {/* Confirmation Prompt Card */}
              {confirmAction && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {confirmAction === "force_logout" && "Confirm Force Session Termination"}
                      {confirmAction === "disable" && "Confirm Disabling Administrator Account"}
                      {confirmAction === "enable" && "Confirm Account Reactivation"}
                      {confirmAction === "revoke" && "Confirm Permanent Access Revocation"}
                    </span>
                  </div>

                  <p className="text-xs text-amber-800">
                    {confirmAction === "force_logout" &&
                      "This will immediately invalidate all active authentication sessions for this administrator across all web browsers and devices."}
                    {confirmAction === "disable" &&
                      "This will immediately invalidate active sessions and block this administrator from signing in until re-enabled by a Super Admin."}
                    {confirmAction === "enable" &&
                      "This will restore sign-in privileges for this administrator."}
                    {confirmAction === "revoke" &&
                      "This will permanently revoke administrator privileges, delete the administrator record, and invalidate all sessions. This action cannot be undone."}
                  </p>

                  {confirmAction === "disable" && (
                    <div>
                      <label className="text-[11px] font-bold text-amber-900 block mb-1">
                        Reason for Disabling (Optional):
                      </label>
                      <input
                        type="text"
                        value={disableReason}
                        onChange={(e) => setDisableReason(e.target.value)}
                        placeholder="e.g. Personnel audit, pending security review"
                        className="w-full px-3 py-1.5 text-xs border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setConfirmAction(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#D9C5A3] bg-white text-slate-700 hover:bg-[#FAF6EE] transition cursor-pointer"
                    >
                      Cancel
                    </button>

                    {confirmAction === "force_logout" && (
                      <button
                        onClick={handleForceLogout}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow transition cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? "Terminating..." : "Yes, Force Logout"}
                      </button>
                    )}

                    {confirmAction === "disable" && (
                      <button
                        onClick={handleDisableAccount}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow transition cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? "Disabling..." : "Yes, Disable Account"}
                      </button>
                    )}

                    {confirmAction === "enable" && (
                      <button
                        onClick={handleEnableAccount}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-[#5C6B45] hover:bg-[#5C6B45] text-white shadow transition cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? "Reactivating..." : "Yes, Reactivate"}
                      </button>
                    )}

                    {confirmAction === "revoke" && (
                      <button
                        onClick={handleRevokeAccess}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-black bg-rose-700 hover:bg-rose-800 text-white shadow transition cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? "Revoking..." : "Permanently Revoke Access"}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Action Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Administrative Account Actions
                </h4>

                {/* 1. Force Logout */}
                <div className="p-4 border border-[#D9C5A3] rounded-xl flex items-center justify-between gap-4 hover:border-[#D9C5A3] transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#3B3028]">Force Logout Across Devices</h5>
                      <p className="text-[11px] text-[#6E5D50]">
                        Terminate all active user sessions immediately without altering password or credentials.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmAction("force_logout")}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer shrink-0 shadow-2xs"
                  >
                    Force Logout
                  </button>
                </div>

                {/* 2. Disable / Reactivate Account */}
                <div className="p-4 border border-[#D9C5A3] rounded-xl flex items-center justify-between gap-4 hover:border-[#D9C5A3] transition">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                        user.is_disabled
                          ? "bg-[#EEF2E7] text-[#5C6B45] border-[#5C6B45]/40"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {user.is_disabled ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-[#3B3028]">
                        {user.is_disabled ? "Reactivate Account" : "Disable Account"}
                      </h5>
                      <p className="text-[11px] text-[#6E5D50]">
                        {user.is_disabled
                          ? "Restore administrative sign-in privileges for this account."
                          : "Temporarily suspend sign-in privileges and immediately revoke existing sessions."}
                      </p>
                    </div>
                  </div>

                  {user.is_disabled ? (
                    <button
                      onClick={() => setConfirmAction("enable")}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-[#5C6B45]/40 bg-[#EEF2E7] text-[#5C6B45] hover:bg-emerald-100 transition cursor-pointer shrink-0 shadow-2xs"
                    >
                      Reactivate Account
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmAction("disable")}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 transition cursor-pointer shrink-0 shadow-2xs"
                    >
                      Disable Account
                    </button>
                  )}
                </div>

                {/* 3. Revoke Access */}
                {!isSuperAdmin && (
                  <div className="p-4 border border-rose-200 bg-rose-50/40 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-300">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-rose-950">Revoke Administrator Privileges</h5>
                        <p className="text-[11px] text-rose-700">
                          Permanently remove this administrator account and all associated moderation authority.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmAction("revoke")}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-rose-300 bg-rose-600 text-white hover:bg-rose-700 transition cursor-pointer shrink-0 shadow-2xs"
                    >
                      Revoke Access
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {activeTab === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl text-xs text-[#3B3028] space-y-1">
                <span className="font-bold block flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#8B5E3C]" /> Secure Credential Provisioning
                </span>
                <p className="text-[#734C30] text-[11px]">
                  Existing passwords are cryptographically salted and hashed with bcrypt and are never exposed. Setting a new password will force session termination across all active devices.
                </p>
              </div>

              {/* Generate Password helper */}
              <div className="flex items-center justify-between pb-1">
                <label className="text-xs font-bold text-[#3B3028]">New Administrator Password *</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="text-xs font-bold text-[#8B5E3C] hover:text-[#3B3028] flex items-center gap-1 cursor-pointer"
                >
                  {copiedGenerated ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#5C6B45]" />
                      <span className="text-[#5C6B45]">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Generate Strong Password</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-1">
                <input
                  type="text"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password (min 8 characters)"
                  className="w-full px-3.5 py-2 text-xs border border-[#D9C5A3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3B3028]">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password to confirm"
                  className="w-full px-3.5 py-2 text-xs border border-[#D9C5A3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-[#8B5E3C] hover:bg-[#734C30] text-white shadow transition cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? "Resetting Password..." : "Reset Password & Terminate Sessions"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PERMISSIONS MANAGEMENT */}
          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl text-xs text-[#3B3028]">
                Configure operational permissions for <strong>{user.full_name || user.mobile_number}</strong>. Permissions dictate which moderation functions this administrator can execute on the MHHDC admissions portal.
              </div>

              <div className="space-y-2.5">
                {/* 1. Review Dossiers */}
                <label className="flex items-start gap-3 p-3.5 border border-[#D9C5A3] rounded-xl hover:bg-[#FAF6EE] transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.can_review}
                    onChange={(e) => setPermissions({ ...permissions, can_review: e.target.checked })}
                    className="mt-0.5 rounded border-[#D9C5A3] text-[#8B5E3C] focus:ring-[#8B5E3C]/30 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#3B3028] block">Can Review Applications</span>
                    <span className="text-[11px] text-[#6E5D50] block">
                      Inspect candidate dossiers, identity documents, bank proofs, and qualifications.
                    </span>
                  </div>
                </label>

                {/* 2. Approve Applications */}
                <label className="flex items-start gap-3 p-3.5 border border-[#D9C5A3] rounded-xl hover:bg-[#FAF6EE] transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.can_approve}
                    onChange={(e) => setPermissions({ ...permissions, can_approve: e.target.checked })}
                    className="mt-0.5 rounded border-[#D9C5A3] text-[#8B5E3C] focus:ring-[#8B5E3C]/30 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#3B3028] block">Can Approve Applications</span>
                    <span className="text-[11px] text-[#6E5D50] block">
                      Authorize candidate admissions subject to ACID quota limits and seat thresholds.
                    </span>
                  </div>
                </label>

                {/* 3. Reject Applications */}
                <label className="flex items-start gap-3 p-3.5 border border-[#D9C5A3] rounded-xl hover:bg-[#FAF6EE] transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.can_reject}
                    onChange={(e) => setPermissions({ ...permissions, can_reject: e.target.checked })}
                    className="mt-0.5 rounded border-[#D9C5A3] text-[#8B5E3C] focus:ring-[#8B5E3C]/30 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#3B3028] block">Can Reject Applications</span>
                    <span className="text-[11px] text-[#6E5D50] block">
                      Issue formal administrative rejections with mandatory statutory reasons.
                    </span>
                  </div>
                </label>

                {/* 4. Export CSV */}
                <label className="flex items-start gap-3 p-3.5 border border-[#D9C5A3] rounded-xl hover:bg-[#FAF6EE] transition cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.can_export}
                    onChange={(e) => setPermissions({ ...permissions, can_export: e.target.checked })}
                    className="mt-0.5 rounded border-[#D9C5A3] text-[#8B5E3C] focus:ring-[#8B5E3C]/30 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-[#3B3028] block">Can Export Moderation Data</span>
                    <span className="text-[11px] text-[#6E5D50] block">
                      Download candidate reports and audit-compliant CSV verification registers.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-[#8B5E3C] hover:bg-[#734C30] text-white shadow transition cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? "Saving Permissions..." : "Save Permissions"}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITY LOGS */}
          {activeTab === "activity" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Audit Trail History ({activityLogs.length} events recorded)
                </span>
                <button
                  onClick={loadActivity}
                  disabled={isLoadingActivity}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#8B5E3C] hover:text-[#3B3028] cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingActivity ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {isLoadingActivity ? (
                <div className="py-12 text-center text-xs text-slate-400 font-semibold animate-pulse">
                  Querying immutable audit logs...
                </div>
              ) : activityLogs.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-[#D9C5A3] rounded-xl text-xs text-slate-400">
                  No activity logs recorded for this administrator yet.
                </div>
              ) : (
                <div className="border border-[#D9C5A3] rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF6EE] text-[#6E5D50] font-bold uppercase tracking-wider text-[10px] border-b border-[#D9C5A3]">
                      <tr>
                        <th className="px-3 py-2">Action</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">IP Address</th>
                        <th className="px-3 py-2">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9DEC8]">
                      {activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#FAF6EE] font-mono text-[11px]">
                          <td className="px-3 py-2 font-bold text-[#3B3028]">{log.action}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                                log.status === "SUCCESS"
                                  ? "bg-[#EEF2E7] text-[#5C6B45] border border-[#5C6B45]/40"
                                  : "bg-rose-50 text-rose-800 border border-rose-200"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[#6E5D50]">{log.ip_address || "—"}</td>
                          <td className="px-3 py-2 text-[#6E5D50] whitespace-nowrap">
                            {formatDate(log.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-[#FAF6EE] border-t border-[#D9C5A3] flex items-center justify-between text-xs text-[#6E5D50] shrink-0">
          <span className="font-mono text-[11px]">Super Admin RBAC Authority Protocol</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-[#D9C5A3] bg-white text-slate-700 hover:bg-[#EDE3D2] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
