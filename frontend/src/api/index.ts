import client from "./client";
import { API_BASE_URL } from "../lib/constants";
import type {
  AuthResponse,
  Application,
  ApplicationDetail,
  TrackResponse,
  AdminMetrics,
  JobCategory,
  PaginatedApplicationsResponse,
} from "../types";

// Public
export const getCategories = () => client.get<JobCategory[]>("/categories").then(r => r.data);

export const trackApplication = (reg_no: string, dob: string) =>
  client
    .get<TrackResponse>(`/applications/track?reg_no=${encodeURIComponent(reg_no)}&dob=${encodeURIComponent(dob)}`)
    .then(r => r.data);

// Candidate Auth
export const register = (data: { mobile_number: string; password: string; email?: string }) =>
  client.post<AuthResponse>("/auth/register", data).then(r => r.data);

export const login = (data: { mobile_number: string; password: string }) =>
  client.post<AuthResponse>("/auth/login", data).then(r => r.data);

// Dedicated Admin Auth
export const adminLogin = (data: { mobile_number: string; password: string }) =>
  client.post<AuthResponse>("/auth/admin-login", data).then(r => r.data);

// Applicant Endpoints
export const submitApplication = (data: FormData) =>
  client
    .post<{ registration_no: string }>("/applications", data, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(r => r.data);

export const getMyApplications = () => client.get<Application[]>("/applications/my").then(r => r.data);

export const getReceipt = (id: string) =>
  client.get(`/applications/my/${id}/receipt`, { responseType: "blob" }).then(r => r.data);

// Admin Moderation & Atomic Quota Endpoints
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

export const getExportCSVUrl = (categoryId?: number | string, status: string = "APPROVED") => {
  const token = localStorage.getItem("token") || "";
  let url = `${API_BASE_URL}/admin/export/csv?status=${encodeURIComponent(status)}`;
  if (categoryId) {
    url += `&category_id=${encodeURIComponent(categoryId)}`;
  }
  return { url, token };
};

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
