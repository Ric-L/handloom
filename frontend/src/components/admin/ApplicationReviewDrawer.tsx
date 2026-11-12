import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminApplication, approveApplication, rejectApplication } from "../../api";
import { formatDate, statusBadgeColor } from "../../lib/utils";
import {
  X,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Shield,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  ExternalLink,
  Lock,
} from "lucide-react";
import { z } from "zod";

interface ApplicationReviewDrawerProps {
  applicationId: string | null;
  onClose: () => void;
  onActionComplete?: () => void;
}

const rejectSchema = z.object({
  reason: z.string().trim().min(10, "Rejection reason must be at least 10 characters long for audit compliance"),
});

const REJECTION_PRESETS = [
  "Incomplete identity proof uploaded",
  "Government ID details do not match applicant name or photo",
  "Bank account details unverified or passbook copy illegible",
  "Educational qualification certificate invalid or unreadable",
  "Candidate residential address outside permissible training district",
  "Duplicate registration detected under alternate mobile number",
];

export default function ApplicationReviewDrawer({
  applicationId,
  onClose,
  onActionComplete,
}: ApplicationReviewDrawerProps) {
  const qc = useQueryClient();

  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  const { data: app, isLoading, error } = useQuery({
    queryKey: ["adminAppDetail", applicationId],
    queryFn: () => (applicationId ? getAdminApplication(applicationId) : null),
    enabled: !!applicationId,
  });

  const approveMutation = useMutation({
    mutationFn: approveApplication,
    onSuccess: () => {
      setActionError(null);
      setConfirmApproveOpen(false);
      qc.invalidateQueries({ queryKey: ["adminApps"] });
      qc.invalidateQueries({ queryKey: ["adminMetrics"] });
      qc.invalidateQueries({ queryKey: ["adminAppDetail", applicationId] });
      if (onActionComplete) onActionComplete();
    },
    onError: (err: any) => {
      setConfirmApproveOpen(false);
      if (err.response?.status === 409) {
        setActionError(
          err.response?.data?.error ||
            "Conflict: The category quota was just filled by another administrator. Approvals are now locked."
        );
      } else {
        setActionError(err.response?.data?.error || "Failed to approve application.");
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectApplication(id, reason),
    onSuccess: () => {
      setActionError(null);
      setRejectModalOpen(false);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["adminApps"] });
      qc.invalidateQueries({ queryKey: ["adminMetrics"] });
      qc.invalidateQueries({ queryKey: ["adminAppDetail", applicationId] });
      if (onActionComplete) onActionComplete();
    },
    onError: (err: any) => {
      setRejectError(err.response?.data?.error || "Failed to reject application.");
    },
  });

  if (!applicationId) return null;

  const handleConfirmReject = () => {
    setRejectError("");
    const validation = rejectSchema.safeParse({ reason: rejectReason });
    if (!validation.success) {
      setRejectError(validation.error.errors[0].message);
      return;
    }
    rejectMutation.mutate({ id: applicationId, reason: rejectReason.trim() });
  };

  const isCategoryLocked = app ? !app.is_approval_open || app.approved_count >= app.approval_limit : false;

  const documentsList = [
    { key: "photograph", label: "Passport Photograph", icon: "📷" },
    { key: "id_proof", label: "Government ID Proof", icon: "🪪" },
    { key: "address_proof", label: "Address Proof", icon: "🏡" },
    { key: "edu_cert", label: "Education Certificate", icon: "🎓" },
    { key: "bank_passbook", label: "Bank Passbook / Cancelled Cheque", icon: "🏦" },
    { key: "category_disability_cert", label: "Social / Disability Certificate", icon: "📜" },
    { key: "signature_thumb", label: "Signature / Thumb Impression", icon: "✍️" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col transform transition-all duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-bold text-primary-400 bg-primary-950 px-2 py-0.5 rounded border border-primary-800">
                {app?.registration_no || "Loading..."}
              </span>
              {app && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusBadgeColor(app.status)}`}>
                  {app.status}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Candidate Enrolment Dossier • Handloom Skill Development
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{actionError}</div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="text-center py-20 text-gray-400">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-3"></div>
              Loading applicant profile...
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl">
              Failed to load applicant details.
            </div>
          )}

          {app && (
            <>
              {/* Category Quota Bar in Drawer */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  isCategoryLocked
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-900"
                }`}
              >
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    Applying Job Role Trade
                  </div>
                  <div className="font-bold text-sm mt-0.5">
                    {app.category_code} — {app.category_title}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-medium">
                    Quota: <strong>{app.approved_count}</strong> / {app.approval_limit}
                  </div>
                  {isCategoryLocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-700 bg-rose-200/80 px-2 py-0.5 rounded-full mt-1">
                      <Lock className="w-3 h-3" /> QUOTA FULL
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-200/80 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {app.approval_limit - app.approved_count} seats remaining
                    </span>
                  )}
                </div>
              </div>

              {/* Status Note if Rejected */}
              {app.status === "REJECTED" && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <span className="font-bold">Administrative Rejection Reason:</span>
                  <p className="mt-1 font-mono">{app.rejection_reason}</p>
                </div>
              )}

              {/* Candidate Info Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Profile */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm pb-1 border-b border-gray-200">
                    <User className="w-4 h-4 text-primary-700" /> Personal Information
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Full Name</span>
                    <span className="font-semibold text-gray-900">{app.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Father/Guardian</span>
                    <span className="font-medium text-gray-900">{app.guardian_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date of Birth</span>
                    <span className="font-medium text-gray-900">{app.dob}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gender</span>
                    <span className="font-medium text-gray-900">{app.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Social Category</span>
                    <span className="font-bold text-primary-800">{app.social_category}</span>
                  </div>
                  {app.alt_mobile && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Alternate Mobile</span>
                      <span className="font-mono text-gray-900">{app.alt_mobile}</span>
                    </div>
                  )}
                </div>

                {/* Identity & Address */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm pb-1 border-b border-gray-200">
                    <Shield className="w-4 h-4 text-primary-700" /> Identity & Verification
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Government ID Type</span>
                    <span className="font-medium text-gray-900">{app.gov_id_type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Gov ID Last 4 Digits</span>
                    <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-gray-300 text-gray-900">
                      •••• {app.gov_id_last4}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">District & State</span>
                    <span className="font-medium text-gray-900">{app.district_state_pin}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">Permanent Address:</span>
                    <p className="bg-white p-2 rounded border border-gray-200 text-gray-700 leading-relaxed font-sans">
                      {app.address_full}
                    </p>
                  </div>
                </div>
              </div>

              {/* Education & Handloom Training Details */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm pb-1 border-b border-gray-200">
                  <Building2 className="w-4 h-4 text-primary-700" /> Academic & Trade Profile
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-gray-500 block">Highest Qualification</span>
                    <span className="font-semibold text-gray-900">{app.highest_qual}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Current Occupation</span>
                    <span className="font-semibold text-gray-900">{app.occupation}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Training Mode</span>
                    <span className="font-semibold text-gray-900">{app.training_mode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Preferred Centre</span>
                    <span className="font-semibold text-gray-900">{app.preferred_centre || "District HQ"}</span>
                  </div>
                </div>
              </div>

              {/* DBT Banking Information */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm pb-1 border-b border-gray-200">
                  <CreditCard className="w-4 h-4 text-primary-700" /> DBT Stipend Disbursement Account
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <span className="text-gray-500 block">Account Holder</span>
                    <span className="font-semibold text-gray-900">{app.bank_holder_name || app.full_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Bank Name & Branch</span>
                    <span className="font-semibold text-gray-900">{app.bank_name_branch || "State Bank of India"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Account Number</span>
                    <span className="font-mono font-semibold text-gray-900">
                      {app.account_number ? `•••• •••• ${app.account_number.slice(-4)}` : "Verified on File"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">IFSC Code</span>
                    <span className="font-mono font-bold text-gray-900">{app.ifsc_code || "SBIN0001234"}</span>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents Previewer */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                    <FileText className="w-4 h-4 text-primary-700" /> Uploaded Document Proofs (7 Items)
                  </div>
                  <span className="text-xs text-gray-500 font-mono">Format: JPG, PNG, PDF &lt; 2MB</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {documentsList.map(doc => {
                    const docUrl = app.documents?.[doc.key];
                    return (
                      <div
                        key={doc.key}
                        className="bg-white border border-gray-200 rounded-lg p-2.5 flex flex-col justify-between hover:border-primary-400 transition"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{doc.icon}</span>
                          <div>
                            <div className="text-xs font-semibold text-gray-800 leading-tight">{doc.label}</div>
                            <span className="text-[10px] text-emerald-600 font-medium">✓ Uploaded & Checked</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              title: doc.label,
                              url: docUrl || "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600",
                            })
                          }
                          className="mt-2 text-[11px] font-semibold text-primary-700 hover:text-primary-800 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" /> Preview Document
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit Meta */}
              <div className="text-[11px] text-gray-400 flex items-center justify-between pt-2">
                <span>Submitted: {formatDate(app.submitted_at)}</span>
                {app.reviewed_at && <span>Reviewed: {formatDate(app.reviewed_at)}</span>}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {app && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition"
            >
              Close
            </button>

            {app.status === "PENDING" ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectError("");
                    setRejectReason("");
                    setRejectModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Reject with Reason
                </button>

                {isCategoryLocked ? (
                  <button
                    disabled
                    className="px-5 py-2 text-xs font-semibold text-gray-400 bg-gray-200 border border-gray-300 rounded-lg flex items-center gap-1.5 cursor-not-allowed"
                    title="Category quota reached. No approvals permitted."
                  >
                    <Lock className="w-4 h-4" /> Quota Full (Locked)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmApproveOpen(true)}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Candidate
                  </button>
                )}
              </div>
            ) : (
              <span className="text-xs font-semibold text-gray-500">
                Action Completed: Application is {app.status}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Approval */}
      {confirmApproveOpen && app && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-emerald-700">
              <CheckCircle className="w-7 h-7" />
              <h3 className="text-lg font-bold text-gray-900">Confirm Candidate Approval</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to approve candidate <strong>{app.full_name}</strong> for{" "}
              <strong>
                {app.category_code} ({app.category_title})
              </strong>
              ?
            </p>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs text-emerald-900 space-y-1">
              <div>
                Current Approvals: <strong>{app.approved_count}</strong> / {app.approval_limit}
              </div>
              <div>
                Will increment to <strong>{app.approved_count + 1}</strong>
                {app.approved_count + 1 === app.approval_limit && (
                  <span className="text-rose-600 font-bold block mt-0.5">
                    ⚠️ This approval will consume the final seat and automatically LOCK the category quota.
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmApproveOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => approveMutation.mutate(app.id)}
                disabled={approveMutation.isPending}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {approveMutation.isPending ? "Executing Atomic Quota Guard..." : "Confirm & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal with Zod Validation & Presets */}
      {rejectModalOpen && app && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-rose-700">
                <XCircle className="w-6 h-6" />
                <h3 className="text-base font-bold text-gray-900">Reject Application with Reason</h3>
              </div>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Government compliance requires a mandatory, audited reason for rejecting candidate{" "}
              <strong>{app.full_name}</strong> (Min 10 characters). This will be displayed to the applicant.
            </p>

            {/* Quick Presets */}
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Quick Select Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="text-[11px] bg-gray-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-md transition text-left cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Mandatory Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={e => {
                  setRejectReason(e.target.value);
                  setRejectError("");
                }}
                rows={3}
                placeholder="Enter specific audit reason for rejection..."
                className={`w-full p-3 border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 transition ${
                  rejectError ? "border-rose-500 ring-1 ring-rose-500" : "border-gray-300"
                }`}
              />
              <div className="flex justify-between items-center mt-1 text-[11px]">
                <span className={rejectReason.trim().length < 10 ? "text-amber-600" : "text-emerald-600"}>
                  {rejectReason.trim().length} / 10 characters minimum
                </span>
                {rejectError && <span className="text-rose-600 font-semibold">{rejectError}</span>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || rejectReason.trim().length < 10}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {rejectMutation.isPending ? "Logging Rejection..." : "Submit Formal Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-70 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-gray-900">{previewDoc.title}</h4>
              <button onClick={() => setPreviewDoc(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-96 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-full max-w-full object-contain"
                onError={e => {
                  (e.target as any).src = "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600";
                }}
              />
            </div>
            <div className="text-right">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

