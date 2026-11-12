import client from "./client";
import type { AuthResponse, Application, TrackResponse, AdminMetrics, JobCategory } from "../types";

// Public
export const getCategories = () => client.get<JobCategory[]>("/categories").then(r => r.data);
export const trackApplication = (reg_no: string, dob: string) =>
  client.get<TrackResponse>(`/applications/track?reg_no=${encodeURIComponent(reg_no)}&dob=${encodeURIComponent(dob)}`).then(r => r.data);

// Auth
export const register = (data: { mobile_number: string; password: string; email?: string }) =>
  client.post<AuthResponse>("/auth/register", data).then(r => r.data);
export const login = (data: { mobile_number: string; password: string }) =>
  client.post<AuthResponse>("/auth/login", data).then(r => r.data);

// Applicant
export const submitApplication = (data: FormData) =>
  client.post<{ registration_no: string }>("/applications", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);
export const getMyApplications = () => client.get<Application[]>("/applications/my").then(r => r.data);
export const getReceipt = (id: string) => client.get(`/applications/my/${id}/receipt`, { responseType: "blob" }).then(r => r.data);

// Admin
export const getAdminMetrics = () => client.get<AdminMetrics>("/admin/metrics").then(r => r.data);
export const getAdminApplications = (params: Record<string, string | number | undefined>) =>
  client.get<{ data: Application[]; total: number; page: number; page_size: number }>("/admin/applications", { params }).then(r => r.data);
export const approveApplication = (id: string) => client.patch(`/admin/applications/${id}/approve`).then(r => r.data);
export const rejectApplication = (id: string, reason: string) =>
  client.patch(`/admin/applications/${id}/reject`, { reason }).then(r => r.data);
export const exportCSV = (params: Record<string, string | number>) =>
  client.get("/admin/export/csv", { params, responseType: "blob" }).then(r => r.data);
