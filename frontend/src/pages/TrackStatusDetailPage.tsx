import { useState } from "react";
import { Link, useLocation, useOutletContext, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { trackApplication } from "../api";
import { formatDate, statusBadgeColor } from "../lib/utils";
import type { TrackResponse } from "../types";
import type { AppOutletContext } from "../layouts/AppLayout";
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  Search,
  RotateCcw,
  FileText,
  User,
  GraduationCap,
  Landmark,
  ShieldCheck,
} from "lucide-react";

const QUAL_LABELS: Record<string, string> = {
  NO_FORMAL: "No formal schooling",
  CLASS_V: "Class V",
  CLASS_VIII: "Class VIII",
  CLASS_X: "Class X (Matric)",
  CLASS_XII: "Class XII (Higher Secondary)",
  GRADUATE: "Graduate / Diploma",
  OTHER: "Other",
};

const DOC_CHECKLIST: { key: string; label: string }[] = [
  { key: "photograph", label: "Recent Passport-Size Photograph" },
  { key: "id_proof", label: "Aadhaar / Government ID" },
  { key: "address_proof", label: "Address Proof" },
  { key: "edu_cert", label: "Education Certificate" },
  { key: "category_disability_cert", label: "ST / Minority Certificate" },
  { key: "bank_passbook", label: "Bank Passbook Copy (Optional)" },
  { key: "signature_thumb", label: "Signature / Thumb Impression (Optional)" },
];

function formatDOBReadOnly(raw?: string): string {
  const clean = (raw || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean || "—";
  const [y, m, d] = clean.split("-");
  return `${d}/${m}/${y}`;
}

export default function TrackStatusDetailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const outletCtx = useOutletContext<AppOutletContext | undefined>();

  const identifier = (searchParams.get("identifier") || "").trim();
  const dob = (searchParams.get("dob") || "").trim();
  const initialState = (location.state as { result?: TrackResponse } | null)?.result;

  const [copied, setCopied] = useState(false);

  const hasValidParams = Boolean(identifier && /^\d{4}-\d{2}-\d{2}$/.test(dob));

  const { data, isLoading, error } = useQuery({
    queryKey: ["trackApplication", identifier, dob],
    queryFn: () => trackApplication(identifier, dob),
    enabled: hasValidParams,
    initialData: initialState,
    retry: false,
  });

  const token = localStorage.getItem("token");

  if (!hasValidParams && !initialState) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-[#D9C5A3] p-8 text-center space-y-4">
        <Search className="w-10 h-10 text-[#8B5E3C] mx-auto" />
        <h1 className="font-serif text-2xl sm:text-3xl text-[#3B3028]">
          Track Your Application Status
        </h1>
        <p className="text-sm text-[#6E5D50]">
          Enter your Registration Number or Mobile Number along with Date of Birth to inspect full registration details.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => outletCtx?.openTrackModal?.()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] text-sm font-semibold transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Open Track Status Form</span>
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#D9C5A3] bg-[#FAF6EE] hover:bg-[#EDE3D2] text-[#3B3028] text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#8B5E3C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-[#6E5D50]">Retrieving registration details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-2xl p-8 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#8B5E3C] mx-auto" />
        <h2 className="font-serif text-2xl text-[#3B3028]">Matching Registration Not Found</h2>
        <p className="text-sm text-[#632919]">
          We could not locate a registration for those credentials. Please check your Registration Number (or 10-digit Mobile Number) and Date of Birth.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => outletCtx?.openTrackModal?.()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] text-sm font-semibold transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] text-[#3B3028] text-sm font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const copyRegNo = () => {
    if (!data.registration_no) return;
    navigator.clipboard.writeText(data.registration_no);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const docStatus = data.document_status || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#6E5D50] hover:text-[#8B5E3C] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <button
          type="button"
          onClick={() => outletCtx?.openTrackModal?.()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] text-xs font-semibold text-[#3B3028] transition cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-[#8B5E3C]" />
          <span>Check Another Application</span>
        </button>
      </div>

      {/* Main Summary & Progress Card */}
      <div className="bg-white rounded-2xl border border-[#D9C5A3] shadow-xs overflow-hidden">
        <div className="bg-[#3B3028] text-[#F5EFE3] px-6 sm:px-8 py-6 border-b border-[#D9C5A3]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D9C5A3] block">
              REGISTRATION STATUS &amp; SUMMARY
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#F5EFE3]">
              {data.category_code ? `${data.category_code} — ` : ""}
              {data.category}
            </h1>
            <p className="text-xs sm:text-sm text-[#D9C5A3]/90">
              Applicant: <strong className="text-[#F5EFE3]">{data.full_name}</strong> • Submitted on{" "}
              <strong className="text-[#F5EFE3]">{formatDate(data.submitted_at)}</strong>
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <span className={`px-3.5 py-1 rounded-full text-xs ${statusBadgeColor(data.status)}`}>
              {data.status === "PENDING"
                ? "Under Review"
                : data.status === "APPROVED"
                ? "Approved"
                : "Rejected"}
            </span>
            {data.registration_no && (
              <div className="inline-flex items-center gap-2 bg-[#2A211B] border border-[#D9C5A3]/30 px-3 py-1.5 rounded-lg">
                <span className="font-mono text-xs font-bold text-[#F5EFE3]">{data.registration_no}</span>
                <button
                  type="button"
                  onClick={copyRegNo}
                  title="Copy Registration Number"
                  className="text-[#D9C5A3] hover:text-white cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#9BBF7A]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Step Timeline */}
          <div className="grid grid-cols-3 gap-2 pb-6 border-b border-[#E9DEC8] text-center bg-[#FAF6EE] rounded-xl p-4 border">
            <div className="flex flex-col items-center gap-1.5">
              <span className="w-8 h-8 rounded-full bg-[#5C6B45] text-[#F5EFE3] text-xs font-bold flex items-center justify-center">
                ✓
              </span>
              <span className="text-xs font-semibold text-[#3B3028]">Application Submitted</span>
              <span className="text-[11px] text-[#6E5D50]">{formatDate(data.submitted_at)}</span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                  data.status === "PENDING" ? "bg-[#8B5E3C] text-[#F5EFE3]" : "bg-[#5C6B45] text-[#F5EFE3]"
                }`}
              >
                {data.status === "PENDING" ? "2" : "✓"}
              </span>
              <span className="text-xs font-semibold text-[#3B3028]">Verification &amp; Review</span>
              <span className="text-[11px] text-[#6E5D50]">
                {data.status === "PENDING" ? "In Progress" : data.reviewed_at ? formatDate(data.reviewed_at) : "Completed"}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${
                  data.status === "APPROVED"
                    ? "bg-[#5C6B45] text-[#F5EFE3]"
                    : data.status === "REJECTED"
                    ? "bg-[#A9442A] text-[#F5EFE3]"
                    : "bg-[#D9C5A3] text-[#3B3028]"
                }`}
              >
                {data.status === "APPROVED" ? "✓" : data.status === "REJECTED" ? "!" : "3"}
              </span>
              <span className="text-xs font-semibold text-[#3B3028]">
                {data.status === "REJECTED" ? "Returned / Rejected" : "Final Decision"}
              </span>
              <span className="text-[11px] text-[#6E5D50]">
                {data.status === "PENDING" ? "Awaiting Review" : data.status}
              </span>
            </div>
          </div>

          {/* Rejection Remarks & Resubmit Callout */}
          {data.status === "REJECTED" && (
            <div className="p-5 bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-xl space-y-3">
              <div className="flex items-start gap-3 text-sm text-[#632919]">
                <AlertCircle className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Remarks from Reviewer:</strong>
                  <p className="mt-0.5 leading-relaxed">
                    {data.rejection_reason || "Application was not approved in this review cycle."}
                  </p>
                </div>
              </div>
              <Link
                to={
                  token
                    ? data.category_id
                      ? `/apply?category=${data.category_id}`
                      : "/apply"
                    : data.category_id
                    ? `/login?redirect=${encodeURIComponent(`/apply?category=${data.category_id}`)}`
                    : "/login?redirect=%2Fapply"
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{token ? "Submit New Application for This Trade" : "Sign In to Reapply"}</span>
              </Link>
            </div>
          )}

          {/* Section 1: Personal & Address Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45] flex items-center gap-2 border-b border-[#E9DEC8] pb-2">
              <User className="w-4 h-4" />
              1. Personal &amp; Address Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <DetailTile label="Full Name" value={data.full_name} />
              <DetailTile label="Father's / Guardian's Name" value={data.guardian_name || "—"} />
              <DetailTile label="Date of Birth" value={formatDOBReadOnly(data.dob)} />
              <DetailTile label="Gender" value={data.gender || "—"} />
              <DetailTile
                label="Social Category"
                value={data.social_category === "OTHER" ? "Minority / Other" : data.social_category || "—"}
              />
              <DetailTile label="Contact Number" value={data.alt_mobile || "—"} mono />
              <DetailTile
                label="Government ID Proof"
                value={
                  data.gov_id_type
                    ? `${data.gov_id_type}${data.gov_id_last4 ? ` (•••• ${data.gov_id_last4})` : ""}`
                    : "—"
                }
              />
              <DetailTile
                label="District"
                value={data.district || data.district_state_pin || "—"}
              />
              <DetailTile label="District / State" value={data.district_state_pin || "Manipur"} />
              <div className="sm:col-span-2 lg:col-span-3 p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
                  Full Residential Address
                </span>
                <span className="text-sm font-medium text-[#3B3028] mt-1 block">
                  {data.address_full || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Education & Training */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45] flex items-center gap-2 border-b border-[#E9DEC8] pb-2">
              <GraduationCap className="w-4 h-4" />
              2. Education &amp; Training Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <DetailTile
                label="Selected Training Trade"
                value={`${data.category_code ? `${data.category_code} — ` : ""}${data.category}`}
              />
              <DetailTile
                label="Highest Qualification"
                value={(data.highest_qual && QUAL_LABELS[data.highest_qual]) || data.highest_qual || "—"}
              />
              <DetailTile label="School / Institution" value={data.institution_name || "—"} />
              <DetailTile label="Occupation" value={data.occupation || "—"} />
              <DetailTile label="Training Mode" value={data.training_mode || "CLASSROOM"} />
              <DetailTile
                label="Prior Craft Experience"
                value={
                  data.prior_experience?.has_experience
                    ? data.prior_experience.details || "Yes"
                    : "None"
                }
              />
            </div>
          </div>

          {/* Section 3: DBT Bank Details (Masked) */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45] flex items-center gap-2 border-b border-[#E9DEC8] pb-2">
              <Landmark className="w-4 h-4" />
              3. DBT Bank Account Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <DetailTile label="Account Holder" value={data.bank_holder_name || "—"} />
              <DetailTile label="Bank & Branch" value={data.bank_name_branch || "—"} />
              <DetailTile label="Account Number (Masked)" value={data.account_number || "—"} mono />
              <DetailTile label="IFSC Code" value={data.ifsc_code || "—"} mono />
            </div>
          </div>

          {/* Section 4: Document Verification Checklist */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45] flex items-center gap-2 border-b border-[#E9DEC8] pb-2">
              <FileText className="w-4 h-4" />
              4. Submitted Documents Checklist
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {DOC_CHECKLIST.map((doc) => {
                const uploaded = Boolean(docStatus[doc.key]);
                return (
                  <div
                    key={doc.key}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                      uploaded
                        ? "bg-[#EEF2E7]/70 border-[#5C6B45]/35 text-[#3B3028]"
                        : "bg-[#FAF6EE] border-[#D9C5A3] text-[#6E5D50]"
                    }`}
                  >
                    <span className="font-semibold">{doc.label}</span>
                    {uploaded ? (
                      <span className="inline-flex items-center gap-1 text-[#3E492D] font-bold shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#5C6B45]" /> Attached
                      </span>
                    ) : (
                      <span className="text-[11px] shrink-0">Not provided</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <div className="pt-5 border-t border-[#E9DEC8] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#6E5D50]">
              <ShieldCheck className="w-4 h-4 text-[#5C6B45] shrink-0" />
              <span>Sensitive identifiers and bank account digits are masked for privacy.</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {token ? (
                <Link
                  to={data.application_id ? `/applications/${data.application_id}` : "/dashboard"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] text-xs font-semibold transition"
                >
                  <span>{data.application_id ? "View Uploaded Files & Dossier" : "Open My Dashboard"}</span>
                </Link>
              ) : (
                <Link
                  to="/login?redirect=%2Fdashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] text-xs font-semibold transition"
                >
                  <span>Sign In to View Files / Download Slip</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailTile({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="p-3.5 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6E5D50] block">
        {label}
      </span>
      <span
        className={`text-sm font-semibold text-[#3B3028] mt-1 block break-words ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
