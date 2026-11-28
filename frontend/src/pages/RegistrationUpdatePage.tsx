import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  getApplicationDossier,
  getCategories,
  getMyApplications,
  getApprovedApplicationSlip,
} from "../api";
import { generateApprovedApplicationPDF } from "../lib/generateApprovedApplicationPDF";
import { formatDate, statusBadgeColor } from "../lib/utils";
import FileUploadField from "../components/FileUploadField";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Lock,
  RotateCcw,
} from "lucide-react";

function formatDOBReadOnly(raw?: string): string {
  const clean = (raw || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean || "—";
  const [y, m, d] = clean.split("-");
  return `${d}/${m}/${y}`;
}

export default function RegistrationUpdatePage() {
  const { id } = useParams<{ id: string }>();
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: myApps } = useQuery({
    queryKey: ["myApplications"],
    queryFn: getMyApplications,
  });

  const { data: dossier, isLoading, error } = useQuery({
    queryKey: ["appDossier", id],
    queryFn: () => (id ? getApplicationDossier(id) : null),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-[#8B5E3C] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-[#6E5D50]">Loading submitted application record...</p>
      </div>
    );
  }

  if (error || !dossier) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-[#8B5E3C] mx-auto" />
        <h3 className="text-base font-serif text-[#3B3028]">Application Not Found</h3>
        <p className="text-xs text-[#6E5D50]">
          The requested application could not be loaded or you do not have access to view it.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-2 px-4 py-2 bg-[#8B5E3C] text-[#F5EFE3] rounded-lg text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const docs = (dossier.documents as Record<string, string>) || {};
  const priorExp = (dossier.prior_experience as { has_experience?: boolean; details?: string }) || {};
  const hasActiveSameCategory = Boolean(
    myApps?.some(
      (a) =>
        a.category_id === dossier.category_id &&
        (a.status === "PENDING" || a.status === "APPROVED")
    )
  );
  const canReapply = dossier.status === "REJECTED" && !hasActiveSameCategory;

  const handleDownloadPDF = async () => {
    try {
      setDownloadError(null);
      setDownloading(true);
      const slipData = await getApprovedApplicationSlip(dossier.id);
      generateApprovedApplicationPDF(slipData);
    } catch (err: any) {
      setDownloadError(
        err.response?.data?.error || "Could not download the approval letter. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  };

  const readFieldCls =
    "w-full border border-[#D9C5A3] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-[#3B3028] bg-[#FAF6EE]/75 cursor-default";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#6E5D50] hover:text-[#8B5E3C] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Applications
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#FAF6EE] text-[#3B3028] px-3 py-1 rounded-full border border-[#D9C5A3]">
            <Lock className="w-3.5 h-3.5 text-[#8B5E3C]" />
            View-Only Record
          </span>
          {dossier.registration_no && (
            <span className="text-xs font-mono font-bold bg-white text-[#3B3028] px-3 py-1 rounded-full border border-[#D9C5A3]">
              {dossier.registration_no}
            </span>
          )}
        </div>
      </div>

      {/* Read-Only Lock Notice */}
      <div className="p-4 bg-[#FAF6EE] border border-[#D9C5A3] rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-[#3B3028]">
        <Lock className="w-4 h-4 text-[#8B5E3C] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Submitted Application (Read-Only):</span> Once submitted, applications are strictly view-only and cannot be edited or modified.
          {canReapply && (
            <span>
              {" "}Because this application was rejected, you may submit a{" "}
              <Link
                to={`/apply?category=${dossier.category_id}`}
                className="font-bold text-[#8B5E3C] underline hover:text-[#734C30]"
              >
                new application under the same category
              </Link>
              .
            </span>
          )}
        </div>
      </div>

      {/* Rejection Reason Banner */}
      {dossier.status === "REJECTED" && dossier.rejection_reason && (
        <div className="p-4 sm:p-5 bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-2xl space-y-3">
          <div className="flex items-start gap-3 text-sm text-[#632919]">
            <AlertCircle className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
            <div>
              <strong className="block">Application Rejected — Reviewer Remarks:</strong>
              <p className="mt-0.5 leading-relaxed">{dossier.rejection_reason}</p>
            </div>
          </div>
          {canReapply && (
            <Link
              to={`/apply?category=${dossier.category_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] text-xs font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Submit New Application for This Trade</span>
            </Link>
          )}
        </div>
      )}

      {downloadError && (
        <div className="p-4 bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-xl text-sm text-[#632919] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#8B5E3C] shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Read-Only Dossier Document */}
      <div className="bg-white rounded-2xl border border-[#D9C5A3] shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-[#D9C5A3] bg-[#FAF6EE] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-[#5C6B45] uppercase">
                SUBMITTED ENROLMENT RECORD
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#3B3028] mt-0.5">
                {dossier.category_title || "Artisan Skill Training"}
              </h1>
            </div>
            <span className={`px-3.5 py-1 rounded-full text-xs ${statusBadgeColor(dossier.status)}`}>
              {dossier.status === "PENDING"
                ? "Under Review"
                : dossier.status === "APPROVED"
                ? "Approved"
                : "Rejected"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#E9DEC8] text-xs text-[#6E5D50]">
            <div>
              <span className="block">Trade Code</span>
              <strong className="font-mono text-[#3B3028]">{dossier.category_code || "—"}</strong>
            </div>
            <div>
              <span className="block">Registration Number</span>
              <strong className="font-mono text-[#3B3028]">{dossier.registration_no || "—"}</strong>
            </div>
            <div>
              <span className="block">Submitted On</span>
              <strong className="text-[#3B3028]">{formatDate(dossier.submitted_at)}</strong>
            </div>
          </div>
        </div>

        <fieldset disabled className="p-6 sm:p-8 space-y-8 divide-y divide-[#E9DEC8] text-xs text-[#3B3028]">
          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
              1. Personal Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Full Name</label>
                <input type="text" readOnly value={dossier.full_name || ""} className={readFieldCls} />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">
                  Father&apos;s / Guardian&apos;s Name
                </label>
                <input type="text" readOnly value={dossier.guardian_name || ""} className={readFieldCls} />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Date of Birth</label>
                <input
                  type="text"
                  readOnly
                  value={formatDOBReadOnly(dossier.dob)}
                  className={readFieldCls}
                />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Gender</label>
                <input type="text" readOnly value={dossier.gender || "—"} className={readFieldCls} />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Contact / Alt Mobile</label>
                <input type="text" readOnly value={dossier.alt_mobile || "—"} className={readFieldCls} />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Social Category</label>
                <input
                  type="text"
                  readOnly
                  value={dossier.social_category === "OTHER" ? "Minority / Other" : dossier.social_category || "—"}
                  className={readFieldCls}
                />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Government ID Type &amp; Last 4</label>
                <input
                  type="text"
                  readOnly
                  value={`${dossier.gov_id_type || "ID"} (${dossier.gov_id_last4 || "—"})`}
                  className={readFieldCls}
                />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">District / State</label>
                <input
                  type="text"
                  readOnly
                  value={dossier.district_state_pin || dossier.district || "—"}
                  className={readFieldCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[#6E5D50] font-semibold mb-1">Full Residential Address</label>
                <textarea rows={2} readOnly value={dossier.address_full || "—"} className={readFieldCls} />
              </div>
            </div>
          </div>

          {/* Section 2: Education & Experience */}
          <div className="space-y-4 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
              2. Education &amp; Training Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Selected Training Trade</label>
                <input
                  type="text"
                  readOnly
                  value={
                    categories?.find((c) => c.id === dossier.category_id)?.title ||
                    dossier.category_title ||
                    "—"
                  }
                  className={readFieldCls}
                />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Highest Qualification</label>
                <input type="text" readOnly value={dossier.highest_qual || "—"} className={readFieldCls} />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Prior Craft Experience</label>
                <input
                  type="text"
                  readOnly
                  value={priorExp.has_experience ? priorExp.details || "Yes" : "None"}
                  className={readFieldCls}
                />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Preferred Training Mode</label>
                <input type="text" readOnly value={dossier.training_mode || "CLASSROOM"} className={readFieldCls} />
              </div>
            </div>
          </div>

          {/* Section 3: Bank Details */}
          <div className="space-y-4 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
              3. DBT Bank Account Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Account Holder Name</label>
                <input type="text" readOnly value={dossier.bank_holder_name || "—"} className={readFieldCls} />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Bank &amp; Branch</label>
                <input type="text" readOnly value={dossier.bank_name_branch || "—"} className={readFieldCls} />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">Account Number (Masked)</label>
                <input
                  type="text"
                  readOnly
                  value={dossier.account_number || "—"}
                  className={`${readFieldCls} font-mono`}
                />
              </div>
              <div>
                <label className="block text-[#6E5D50] font-semibold mb-1">IFSC Code</label>
                <input
                  type="text"
                  readOnly
                  value={dossier.ifsc_code || "—"}
                  className={`${readFieldCls} font-mono`}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Uploaded Documents (View-Only) */}
          <div className="space-y-4 pt-6">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
              4. Submitted Documents (View-Only)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUploadField
                label="Passport-Size Photograph"
                value={docs["photograph"]}
                onChange={() => {}}
                readOnly
                required
              />
              <FileUploadField
                label="Aadhaar Card"
                value={docs["id_proof"]}
                onChange={() => {}}
                readOnly
                required
              />
              <FileUploadField
                label="Address Proof"
                value={docs["address_proof"]}
                onChange={() => {}}
                readOnly
                required
              />
              <FileUploadField
                label="Education Certificate"
                value={docs["edu_cert"]}
                onChange={() => {}}
                readOnly
                required
              />
              <FileUploadField
                label="ST / Minority Certificate"
                value={docs["category_disability_cert"]}
                onChange={() => {}}
                readOnly
                required
              />
              <FileUploadField
                label="Bank Passbook Copy"
                value={docs["bank_passbook"]}
                onChange={() => {}}
                readOnly
              />
            </div>
          </div>
        </fieldset>

        {/* Footer Actions */}
        <div className="p-6 bg-[#FAF6EE] border-t border-[#D9C5A3] flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] text-xs font-semibold text-[#3B3028] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Applications</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            {canReapply && (
              <Link
                to={`/apply?category=${dossier.category_id}`}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] text-xs font-semibold transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Submit New Application</span>
              </Link>
            )}

            {dossier.status === "APPROVED" && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#5C6B45] hover:bg-[#4A5737] text-[#F5EFE3] text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? "Generating PDF..." : "Download Approval Letter (PDF)"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
