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

// Applicant Submission (JSON or FormData, persists to PostgreSQL)
export const submitApplication = (data: any) =>
  client
    .post<{ message: string; id: string; status: string; submitted_at: string }>("/applications", data)
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
