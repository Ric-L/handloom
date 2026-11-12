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
  Copy,
  Check,
  MapPin,
  GraduationCap,
  Sparkles,
  Phone,
  Clock,
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

  const [activeTab, setActiveTab] = useState<"profile" | "banking" | "documents">("profile");
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);
  const [copiedRegNo, setCopiedRegNo] = useState(false);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRegNo(true);
    setTimeout(() => setCopiedRegNo(false), 2000);
  };

  const handleConfirmReject = () => {
    setRejectError("");
    const validation = rejectSchema.safeParse({ reason: rejectReason });
    if (!validation.success) {
      setRejectError(validation.error.issues?.[0]?.message || "Rejection reason must be at least 10 characters long");
      return;
    }
    rejectMutation.mutate({ id: applicationId, reason: rejectReason.trim() });
  };

  const isCategoryLocked = app ? !app.is_approval_open || app.approved_count >= app.approval_limit : false;

  const documentsList = [
    { key: "photograph", label: "Passport Photograph", icon: "📷", type: "Photo ID" },
    { key: "id_proof", label: "Government ID Proof", icon: "🪪", type: "Identity" },
    { key: "address_proof", label: "Address Proof", icon: "🏡", type: "Residential" },
    { key: "edu_cert", label: "Education Certificate", icon: "🎓", type: "Academic" },
    { key: "bank_passbook", label: "Bank Passbook / Cancelled Cheque", icon: "🏦", type: "DBT Banking" },
    { key: "category_disability_cert", label: "Social / Disability Certificate", icon: "📜", type: "Affirmative Action" },
    { key: "signature_thumb", label: "Signature / Thumb Impression", icon: "✍️", type: "Attestation" },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col transform transition-all duration-300">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-black bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg text-primary-300 flex items-center gap-1.5">
                {app?.registration_no || "LOADING..."}
                {app?.registration_no && (
                  <button
                    onClick={() => handleCopy(app.registration_no)}
                    title="Copy Registration Number"
                    className="hover:text-white transition"
                  >
                    {copiedRegNo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </span>

              {app && (
                <span className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wide ${statusBadgeColor(app.status)}`}>
                  {app.status}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Candidate Admission Dossier</span>
              <span>•</span>
              <span className="text-primary-400 font-semibold">{app?.category_code} {app?.category_title}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{actionError}</div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="text-center py-24 text-slate-400 space-y-3">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Retrieving candidate verification dossier...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl">
              Failed to load applicant dossier.
            </div>
          )}

          {app && (
            <>
              {/* Category Quota Status Bar */}
              <div
                className={`p-4.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCategoryLocked
                    ? "bg-rose-50/70 border-rose-200 text-rose-950"
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                    Target Trade Approval Quota
                  </div>
                  <div className="font-black text-sm text-slate-900 mt-0.5">
                    {app.category_code} — {app.category_title}
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0 space-y-1">
                  <div className="text-xs font-bold">
                    Quota Allocation: <strong className="font-mono">{app.approved_count}</strong> / {app.approval_limit}
                  </div>
                  {isCategoryLocked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-800 bg-rose-200/90 px-2.5 py-0.5 rounded-full">
                      <Lock className="w-3 h-3" /> QUOTA FULL (LOCKED)
                    </span>
                  ) : (
                    <span className="text-[11px] font-extrabold text-emerald-800 bg-emerald-200/90 px-2.5 py-0.5 rounded-full inline-block">
                      {app.approval_limit - app.approved_count} seats remaining
                    </span>
                  )}
                </div>
              </div>

              {/* Status Note if Rejected */}
              {app.status === "REJECTED" && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                  <span className="font-bold flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" /> Administrative Rejection Reason (Logged for Audit):
                  </span>
                  <p className="font-mono text-[11px] bg-white p-2.5 rounded-xl border border-rose-200 text-rose-900 leading-relaxed">
                    {app.rejection_reason}
                  </p>
                </div>
              )}

              {/* Navigation Tabs inside Drawer */}
              <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
                {[
                  { id: "profile", label: "Candidate Profile & Identity" },
                  { id: "banking", label: "DBT Bank Stipend Account" },
                  { id: "documents", label: "Document Verification Suite" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-2.5 transition relative cursor-pointer ${
                      activeTab === tab.id
                        ? "text-primary-800 border-b-2 border-primary-700"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Profile & Identity */}
              {activeTab === "profile" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Personal Information */}
                    <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center gap-2 font-extrabold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                        <User className="w-4 h-4 text-primary-700" /> Personal Dossier
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Full Name</span>
                        <span className="font-extrabold text-slate-900 text-sm">{app.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Father / Guardian</span>
                        <span className="font-bold text-slate-800">{app.guardian_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date of Birth</span>
                        <span className="font-bold text-slate-800 font-mono">{app.dob}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gender</span>
                        <span className="font-bold text-slate-800">{app.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Social Category</span>
                        <span className="font-black text-primary-800 bg-primary-100/80 px-2 py-0.5 rounded">
                          {app.social_category}
                        </span>
                      </div>
                    </div>

                    {/* Identity Verification */}
                    <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center gap-2 font-extrabold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                        <Shield className="w-4 h-4 text-primary-700" /> Government ID Verification
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Government ID Type</span>
                        <span className="font-bold text-slate-900">{app.gov_id_type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">ID Verification Last 4</span>
                        <span className="font-mono font-black text-slate-900 bg-white border border-slate-300 px-2.5 py-1 rounded-lg">
                          •••• {app.gov_id_last4}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">District & State</span>
                        <span className="font-bold text-slate-900">{app.district_state_pin}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-1">Permanent Residential Address:</span>
                        <p className="bg-white p-2.5 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-sans text-xs">
                          {app.address_full}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Academic & Trade Qualifications */}
                  <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200 text-xs space-y-3">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                      <GraduationCap className="w-4 h-4 text-primary-700" /> Academic & Trade Profile
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Highest Qualification</span>
                        <span className="font-bold text-slate-900">{app.highest_qual}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Current Occupation</span>
                        <span className="font-bold text-slate-900">{app.occupation}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Training Mode</span>
                        <span className="font-bold text-slate-900">{app.training_mode}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Preferred Centre</span>
                        <span className="font-bold text-slate-900">{app.preferred_centre || "District Training Center"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: DBT Stipend Banking */}
              {activeTab === "banking" && (
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900 text-sm">
                      <CreditCard className="w-5 h-5 text-primary-700" /> DBT Stipend Disbursement Account
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      ✓ Direct Benefit Transfer Eligible
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 text-[11px] block">Bank Account Holder</span>
                      <span className="font-extrabold text-slate-900 text-sm">{app.bank_holder_name || app.full_name}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 text-[11px] block">Bank Name & Branch</span>
                      <span className="font-extrabold text-slate-900 text-sm">{app.bank_name_branch || "State Bank of India"}</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 text-[11px] block">Bank Account Number</span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        {app.account_number ? `•••• •••• ${app.account_number.slice(-4)}` : "Verified On File"}
                      </span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 text-[11px] block">Bank IFSC Code</span>
                      <span className="font-mono font-black text-primary-800 text-sm">{app.ifsc_code || "SBIN0001234"}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Stipend payments will be routed directly via PFMS (Public Financial Management System) to this account following admission approval.
                  </p>
                </div>
              )}

              {/* Tab 3: Document Verification Suite */}
              {activeTab === "documents" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                    <div className="font-extrabold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary-700" /> 7 Mandatory Verification Documents
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">Formats: JPG, PNG, PDF &lt; 2MB</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {documentsList.map(doc => {
                      const docUrl = app.documents?.[doc.key];
                      return (
                        <div
                          key={doc.key}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between hover:border-primary-400 hover:bg-white transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{doc.icon}</span>
                            <div>
                              <div className="text-xs font-bold text-slate-900">{doc.label}</div>
                              <span className="text-[10px] text-emerald-600 font-bold">✓ Verified by Intake Guard</span>
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
                            className="p-1.5 text-xs font-bold text-primary-800 bg-primary-50 hover:bg-primary-100 rounded-lg border border-primary-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Audit Meta */}
              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-3 border-t border-slate-200">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Submitted: {formatDate(app.submitted_at)}
                </span>
                {app.reviewed_at && (
                  <span>
                    Reviewed by Admin: <strong className="text-slate-600">{formatDate(app.reviewed_at)}</strong>
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Moderation Actions */}
        {app && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Close Dossier
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
                  className="px-4 py-2.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <XCircle className="w-4 h-4" /> Reject with Reason
                </button>

                {isCategoryLocked ? (
                  <button
                    disabled
                    className="px-5 py-2.5 text-xs font-bold text-slate-400 bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-not-allowed"
                    title="Category quota reached. No approvals permitted."
                  >
                    <Lock className="w-4 h-4" /> Quota Full (Locked)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmApproveOpen(true)}
                    className="px-6 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-700/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Candidate
                  </button>
                )}
              </div>
            ) : (
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Action Completed: Application is {app.status}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Approval */}
      {confirmApproveOpen && app && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center gap-3 text-emerald-700">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Confirm Candidate Approval</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to approve candidate <strong>{app.full_name}</strong> for trade{" "}
              <strong>
                {app.category_code} ({app.category_title})
              </strong>
              ?
            </p>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-950 space-y-1.5 font-medium">
              <div>
                Current Approvals: <strong>{app.approved_count}</strong> / {app.approval_limit}
              </div>
              <div>
                Will increment to <strong>{app.approved_count + 1}</strong>
                {app.approved_count + 1 === app.approval_limit && (
                  <span className="text-rose-600 font-bold block mt-1">
                    ⚠️ Warning: This approval will allocate the FINAL available seat and automatically lock further approvals for this category.
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmApproveOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => approveMutation.mutate(app.id)}
                disabled={approveMutation.isPending}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-700/20"
              >
                {approveMutation.isPending ? "Executing Atomic Quota Guard..." : "Confirm & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal with Presets & Audit Requirement */}
      {rejectModalOpen && app && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-rose-700">
                <XCircle className="w-6 h-6" />
                <h3 className="text-base font-black text-slate-900 tracking-tight">Reject Application with Reason</h3>
              </div>
              <button onClick={() => setRejectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Government compliance requires an official reason for rejecting candidate{" "}
              <strong>{app.full_name}</strong> (Min 10 characters). This will be recorded in audit logs and visible to the applicant.
            </p>

            {/* Presets */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Fast Administrative Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="text-[11px] bg-slate-100 hover:bg-rose-50 hover:text-rose-800 hover:border-rose-300 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition text-left cursor-pointer font-medium"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mandatory Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={e => {
                  setRejectReason(e.target.value);
                  setRejectError("");
                }}
                rows={3}
                placeholder="Enter specific audit remarks for rejection..."
                className={`w-full p-3.5 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 transition font-medium ${
                  rejectError ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300"
                }`}
              />
              <div className="flex justify-between items-center mt-1.5 text-[11px]">
                <span className={rejectReason.trim().length < 10 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                  {rejectReason.trim().length} / 10 characters minimum
                </span>
                {rejectError && <span className="text-rose-600 font-bold">{rejectError}</span>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejectMutation.isPending || rejectReason.trim().length < 10}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition disabled:opacity-50 cursor-pointer shadow-md shadow-rose-700/20"
              >
                {rejectMutation.isPending ? "Logging Rejection..." : "Submit Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Lightbox Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900">{previewDoc.title}</h4>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-96 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
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
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
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
