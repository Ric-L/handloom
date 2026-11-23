import client from "./client";
import { API_BASE_URL } from "../lib/constants";
import type {
  AuthResponse,
  Application,
  ApplicationDetail,
  ApprovedSlipData,
  TrackResponse,
  AdminMetrics,
  JobCategory,
  PaginatedApplicationsResponse,
} from "../types";

// Public Categories (Quota limits are stripped by backend for regular users)
export const getCategories = () => client.get<JobCategory[]>("/categories").then(r => r.data);

// Public Quick-Track (Allows tracking by Mobile Number or Reference ID + DOB)
export const trackApplication = (identifier: string, dob: string) =>
  client
    .get<TrackResponse>(`/applications/track?identifier=${encodeURIComponent(identifier)}&dob=${encodeURIComponent(dob)}`)
    .then(r => r.data);

// Candidate Authentication
export const register = (data: { mobile_number: string; password: string; email?: string }) =>
  client.post<AuthResponse>("/auth/register", data).then(r => r.data);

export const login = (data: { mobile_number: string; password: string }) =>
  client.post<AuthResponse>("/auth/login", data).then(r => r.data);

// Dedicated Admin Authentication
export const adminLogin = (data: { mobile_number: string; password: string }) =>
  client.post<AuthResponse>("/auth/admin-login", data).then(r => r.data);

// Session Management & Invalidation
export const logoutUser = () =>
  client.post<{ message: string }>("/auth/logout").then(r => r.data).catch(() => ({ message: "Logged out" }));

export const refreshSession = () =>
  client.post<{ message: string; expires_in: number }>("/auth/refresh-session").then(r => r.data);

export const getSessionStatus = () =>
  client.get<{ active: boolean; remaining_seconds: number; idle_timeout: number }>("/auth/session-status").then(r => r.data);

export const getCSRFToken = () =>
  client.get<{ csrf_token: string }>("/auth/csrf-token").then(r => r.data);

export const getCurrentUser = () =>
  client.get<{ user: any; remaining_seconds: number }>("/auth/me").then(r => r.data);

// Applicant Submission (JSON or FormData, persists to PostgreSQL)
export const submitApplication = (data: any) =>
  client
    .post<{ message: string; id: string; registration_no: string; status: string; submitted_at: string }>("/applications", data)
    .then(r => r.data);

export const getMyApplications = () => client.get<Application[]>("/applications/my").then(r => r.data);

export const getApprovedApplicationSlip = (id: string) =>
  client.get<ApprovedSlipData>(`/applications/${id}/approved-slip`).then(r => r.data);

export const getReceipt = (id: string) =>
  client.get(`/applications/my/${id}/receipt`, { responseType: "blob" }).then(r => r.data);

// Admin Moderation & Atomic Quota API
export const getAdminMetrics = () => client.get<AdminMetrics>("/admin/metrics").then(r => r.data);

export const getAdminApplications = (params: {
  page?: number;
  page_size?: number;
  category_id?: number | string;
  status?: string;
  district?: string;
  social_category?: string;
  search_query?: string;
}) =>
  client
    .get<PaginatedApplicationsResponse>("/admin/applications", { params })
    .then(r => r.data);

export const getAdminApplication = (id: string) =>
  client.get<ApplicationDetail>(`/admin/applications/${id}`).then(r => r.data);

export const approveApplication = (id: string) =>
  client.patch<{ message: string; approved_count: number; approval_limit: number; is_approval_open: boolean }>(
    `/admin/applications/${id}/approve`
  ).then(r => r.data);

export const rejectApplication = (id: string, reason: string) =>
  client.patch<{ message: string }>(`/admin/applications/${id}/reject`, { reason }).then(r => r.data);

// File Upload API with size and extension validation
export const uploadDocument = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await client.post<{ url: string; filename: string; size: number; message: string }>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// Candidate Dossier Retrieval & Updates
export const getApplicationDossier = (id: string) =>
  client.get<ApplicationDetail>(`/applications/${id}/dossier`).then(r => r.data);

export const updateApplicationDossier = (id: string, data: any) =>
  client.put<{ message: string; id: string }>(`/applications/${id}`, data).then(r => r.data);

// Super Admin Category Quota Management
export const updateCategoryQuota = (categoryId: number | string, approvalLimit: number) =>
  client
    .patch<{
      message: string;
      category_id: number;
      code: string;
      title: string;
      approval_limit: number;
      approved_count: number;
      remaining_quota: number;
      is_approval_open: boolean;
    }>(`/admin/categories/${categoryId}/quota`, { approval_limit: approvalLimit })
    .then(r => r.data);

export const downloadAdminCSV = async (categoryId?: number | string, status: string = "APPROVED") => {
  const res = await client.get("/admin/export/csv", {
    params: { category_id: categoryId || undefined, status },
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  const fileName = `handloom_trainees_${status.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Admin - Candidates Management
export const getAdminCandidates = (params: {
  page?: number;
  page_size?: number;
  search?: string;
  name?: string;
  mobile?: string;
  email?: string;
  min_applications?: number;
  max_applications?: number;
  has_applications?: string;
  status?: string;
  social_category?: string;
  date_from?: string;
  date_to?: string;
}) =>
  client.get("/admin/candidates", { params }).then(r => r.data);

// Admin - Users & RBAC Management
export const getAdminUsers = (params: {
  page?: number;
  page_size?: number;
  search?: string;
  user_id?: string;
  mobile?: string;
  name?: string;
  email?: string;
  role?: string;
  include_applicants?: boolean;
}) =>
  client.get("/admin/users", { params }).then(r => r.data);

export const updateAdminUserRole = (id: string, role: string) =>
  client.put(`/admin/users/${id}/role`, { role }).then(r => r.data);

export const createAdminUser = (data: {
  full_name: string;
  mobile_number: string;
  email?: string;
  password: string;
  role?: string;
}) => client.post("/admin/users", data).then(r => r.data);

export const deleteAdminUser = (id: string) =>
  client.delete(`/admin/users/${id}`).then(r => r.data);

export const disableAdminUser = (id: string, reason?: string) =>
  client.post(`/admin/users/${id}/disable`, { reason }).then(r => r.data);

export const enableAdminUser = (id: string) =>
  client.post(`/admin/users/${id}/enable`).then(r => r.data);

export const resetAdminUserPassword = (id: string, new_password: string) =>
  client.post(`/admin/users/${id}/reset-password`, { new_password }).then(r => r.data);

export const forceLogoutAdminUser = (id: string) =>
  client.post(`/admin/users/${id}/force-logout`).then(r => r.data);

export const updateAdminUserPermissions = (id: string, permissions: Record<string, boolean>) =>
  client.put(`/admin/users/${id}/permissions`, { permissions }).then(r => r.data);

export const getAdminUserActivity = (id: string) =>
  client.get(`/admin/users/${id}/activity`).then(r => r.data);

// Admin - Trade Categories Dynamic CRUD
export const createAdminCategory = (data: { code: string; title: string; approval_limit: number }) =>
  client.post("/admin/categories", data).then(r => r.data);

export const updateAdminCategory = (id: number, data: { title?: string; approval_limit?: number }) =>
  client.put(`/admin/categories/${id}`, data).then(r => r.data);

export const toggleAdminCategory = (id: number) =>
  client.patch(`/admin/categories/${id}/toggle`).then(r => r.data);

export const deleteAdminCategory = (id: number) =>
  client.delete(`/admin/categories/${id}`).then(r => r.data);

// Admin - Tamper-Resistant Audit Logs & Daily Files (Super Admin only)
export const getAdminAuditLogs = (params: {
  page?: number;
  page_size?: number;
  action?: string;
  actor_role?: string;
  resource_type?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}) =>
  client.get<import("../types").AuditLogResult>("/admin/audit-logs", { params }).then(r => r.data);

export const getAdminAuditFiles = () =>
  client.get<{ files: import("../types").AuditFileInfo[]; count: number }>("/admin/audit-logs/files").then(r => r.data);

