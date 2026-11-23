export type UserRole = "APPLICANT" | "REVIEWER_ADMIN" | "SUPER_ADMIN";
export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type SocialCategory = "GENERAL" | "SC" | "ST" | "OBC" | "OTHER";
export type HighestQual = "NO_FORMAL" | "CLASS_V" | "CLASS_VIII" | "CLASS_X" | "CLASS_XII" | "GRADUATE" | "OTHER";
export type Occupation = "STUDENT" | "UNEMPLOYED" | "EMPLOYED" | "SELF_EMPLOYED" | "OTHER";
export type TrainingMode = "CLASSROOM" | "PRACTICAL_WORKSHOP" | "OTHER";

export interface User {
  id: string;
  mobile_number: string;
  email?: string;
  role: UserRole;
  created_at: string;
  full_name?: string;
}

export interface JobCategory {
  id: number;
  code: string;
  title: string;
  is_approval_open: boolean;
  approval_limit?: number; // Only present for Admins
  approved_count?: number; // Only present for Admins
}

export interface Application {
  id: string;
  user_id: string;
  category_id: number;
  category_code?: string;
  category_title?: string;
  full_name: string;
  guardian_name: string;
  dob: string;
  gender: Gender;
  alt_mobile?: string;
  gov_id_type: string;
  gov_id_last4: string;
  social_category: SocialCategory;
  address_full?: string;
  district_state_pin: string;
  emergency_contact?: { name: string; relationship: string; mobile: string };
  highest_qual: HighestQual;
  institution_name?: string;
  occupation?: Occupation;
  prev_training?: string;
  prior_experience?: { has_experience: boolean; details?: string };
  disability_req?: { has_disability: boolean; accommodation?: string };
  preferred_centre?: string;
  training_mode: TrainingMode;
  bank_holder_name?: string;
  bank_name_branch?: string;
  account_number?: string;
  ifsc_code?: string;
  documents?: Record<string, string>;
  status: ApplicationStatus;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  submitted_at: string;
  registration_no?: string; // Official registration / tracking reference number
}

export interface ApplicationDetail extends Application {
  approval_limit: number;
  approved_count: number;
  is_approval_open: boolean;
  registration_no: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TrackResponse {
  full_name: string;
  category: string;
  category_code?: string;
  submitted_at: string;
  status: ApplicationStatus;
  rejection_reason?: string;
  registration_no?: string;
}

export interface CategoryMetric {
  category_id: number;
  code: string;
  title: string;
  approval_limit: number;
  approved_count: number;
  remaining_quota: number;
  pending_count: number;
  is_approval_open: boolean;
}

export interface AdminMetrics {
  total_applied: number;
  pending: number;
  approved: number;
  rejected: number;
  categories: CategoryMetric[];
}

export interface ApprovedSlipData {
  id: string;
  registration_no: string;
  category_id: number;
  category_code: string;
  category_title: string;
  full_name: string;
  guardian_name: string;
  dob: string;
  gender: Gender;
  alt_mobile?: string;
  gov_id_type: string;
  gov_id_last4: string;
  social_category: SocialCategory;
  address_full: string;
  district_state_pin: string;
  highest_qual: HighestQual;
  institution_name?: string;
  occupation?: Occupation;
  prev_training?: string;
  preferred_centre?: string;
  training_mode: TrainingMode;
  bank_holder_name?: string;
  bank_name_branch?: string;
  account_number?: string;
  ifsc_code?: string;
  status: "APPROVED";
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface PaginatedApplicationsResponse {
  data: Application[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuditLogRowItem {
  id: number;
  actor_id?: string;
  actor_role: string;
  action: string;
  target_id?: string;
  resource_type?: string;
  ip_address?: string;
  user_agent?: string;
  before_state?: any;
  after_state?: any;
  details?: any;
  status: string;
  created_at: string;
}

export interface AuditLogResult {
  total: number;
  page: number;
  page_size: number;
  entries: AuditLogRowItem[];
}

export interface AuditFileInfo {
  date: string;
  filename: string;
  size_bytes: number;
  last_modified: string;
}

