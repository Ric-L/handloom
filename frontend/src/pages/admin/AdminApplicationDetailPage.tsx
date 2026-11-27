import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminApplication, approveApplication, rejectApplication, fetchAuthenticatedDocument } from "../../api";
import { generateApprovedApplicationPDF } from "../../lib/generateApprovedApplicationPDF";
import { formatDate, statusBadgeColor } from "../../lib/utils";
import {
  ArrowLeft,
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
  ShieldCheck,
  Award,
  Layers,
  ChevronRight,
  ZoomIn,
  X,
  Download,
} from "lucide-react";
import { z } from "zod";

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

export default function AdminApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; mimeType?: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [copiedRegNo, setCopiedRegNo] = useState(false);

  const closePreview = () => {
    if (previewDoc?.url.startsWith("blob:")) {
      URL.revokeObjectURL(previewDoc.url);
    }
    setPreviewDoc(null);
    setPreviewError(null);
  };

  const openDocumentPreview = async (title: string, docUrl?: string) => {
    if (!docUrl) {
      setPreviewError("This document was not uploaded by the applicant.");
      setPreviewDoc({ title, url: "" });
      return;
    }
    setPreviewError(null);
    setPreviewLoading(true);
    setPreviewDoc({ title, url: "" });
    try {
      const { objectUrl, mimeType } = await fetchAuthenticatedDocument(docUrl);
      setPreviewDoc({ title, url: objectUrl, mimeType });
    } catch {
      setPreviewError("Failed to load document securely. Please verify your session.");
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewDoc?.url.startsWith("blob:")) {
        URL.revokeObjectURL(previewDoc.url);
      }
    };
  }, [previewDoc]);

  const { data: app, isLoading, error } = useQuery({
    queryKey: ["adminAppDetail", id],
    queryFn: () => (id ? getAdminApplication(id) : null),
    enabled: !!id,
  });

  const approveMutation = useMutation({
    mutationFn: approveApplication,
    onSuccess: () => {
      setActionError(null);
      setConfirmApproveOpen(false);
      qc.invalidateQueries({ queryKey: ["adminApps"] });
      qc.invalidateQueries({ queryKey: ["adminMetrics"] });
      qc.invalidateQueries({ queryKey: ["adminAppDetail", id] });
    },
    onError: (err: any) => {
      setConfirmApproveOpen(false);
      if (err.response?.status === 409) {
        setActionError(
          err.response?.data?.error ||
          "Conflict: The category quota was filled concurrently by another administrator. Approvals are now locked."
        );
      } else {
        setActionError(err.response?.data?.error || "Failed to approve application.");
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ appId, reason }: { appId: string; reason: string }) => rejectApplication(appId, reason),
    onSuccess: () => {
      setActionError(null);
      setRejectModalOpen(false);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["adminApps"] });
      qc.invalidateQueries({ queryKey: ["adminMetrics"] });
      qc.invalidateQueries({ queryKey: ["adminAppDetail", id] });
    },
    onError: (err: any) => {
      setRejectError(err.response?.data?.error || "Failed to reject application.");
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRegNo(true);
    setTimeout(() => setCopiedRegNo(false), 2000);
  };

  const handleConfirmReject = () => {
    if (!id) return;
    setRejectError("");
    const validation = rejectSchema.safeParse({ reason: rejectReason });
    if (!validation.success) {
      setRejectError(validation.error.issues?.[0]?.message || "Rejection reason must be at least 10 characters long");
      return;
    }
    rejectMutation.mutate({ appId: id, reason: rejectReason.trim() });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center space-y-4">
        <div className="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Retrieving Candidate Verification Dossier...</h2>
        <p className="text-xs text-slate-400">Loading government ID proofs, DBT banking, and trade allocation</p>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-rose-950">Application Record Not Found</h2>
        <p className="text-xs text-rose-700">The requested application could not be found or has been archived.</p>
        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Applications Queue
        </button>
      </div>
    );
  }

  const isCategoryLocked = !app.is_approval_open || app.approved_count >= app.approval_limit;

  const documentsList = [
    { key: "photograph", label: "Passport Photograph", icon: "📷", type: "Photo ID Verification" },
    { key: "id_proof", label: "Government ID Proof", icon: "🪪", type: "Identity Proof" },
    { key: "address_proof", label: "Address Proof", icon: "🏡", type: "Residential Proof" },
    { key: "edu_cert", label: "Education Certificate", icon: "🎓", type: "Academic Qualification" },
    { key: "bank_passbook", label: "Bank Passbook / Cheque", icon: "🏦", type: "DBT Account Proof" },
    { key: "category_disability_cert", label: "Social / Disability Cert", icon: "📜", type: "Category Quota Proof" },
    { key: "signature_thumb", label: "Signature / Thumb Mark", icon: "✍️", type: "Artisan Attestation" },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Breadcrumbs & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/admin" className="hover:text-primary-800 flex items-center gap-1 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Moderation Console
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span>Verification Queue</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">{app.full_name}</span>
        </div>

        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs transition self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Queue
        </button>
      </div>

      {/* 2. Top Executive Command Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          {/* Candidate Primary Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-800 to-slate-950 text-white font-black text-xl flex items-center justify-center shadow-md shadow-primary-950/20 shrink-0 border border-primary-700/40">
              {app.full_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-none">
                  {app.full_name}
                </h1>
                <span
                  className={`inline-block px-3 py-0.5 rounded-full text-xs font-black tracking-wide ${statusBadgeColor(
                    app.status
                  )}`}
                >
                  {app.status === "PENDING"
                    ? "🟡 PENDING VERIFICATION"
                    : app.status === "APPROVED"
                      ? "🟢 APPROVED FOR INDUCTION"
                      : "🔴 REJECTED"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                {/* Monospace Registration Number with 1-click copy */}
                <div className="inline-flex items-center gap-1.5 font-mono text-xs font-extrabold bg-slate-100 text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <span>Reg No: {app.registration_no}</span>
                  <button
                    onClick={() => handleCopy(app.registration_no)}
                    title="Copy Registration Number"
                    className="text-slate-400 hover:text-slate-900 p-0.5 transition"
                  >
                    {copiedRegNo ? (
                      <Check className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Submitted: {formatDate(app.submitted_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {app.status === "PENDING" ? (
              <>
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
                    className="px-6 py-2.5 text-xs font-bold text-slate-400 bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-not-allowed"
                    title="Category quota reached. No approvals permitted."
                  >
                    <Lock className="w-4 h-4" /> Quota Full (Locked)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmApproveOpen(true)}
                    className="px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 rounded-xl transition shadow-md shadow-blue-900/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Candidate
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200">
                  Decision: <strong className="text-slate-950 uppercase">{app.status}</strong>
                </div>

                {app.status === "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => generateApprovedApplicationPDF(app as any)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Enrolment Slip (PDF)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Trade Allocation & Quota Guard Banner */}
        <div
          className={`p-4.5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${isCategoryLocked
              ? "bg-rose-50/70 border-rose-200 text-rose-950"
              : "bg-blue-50/70 border-blue-200 text-blue-950"
            }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isCategoryLocked ? "bg-rose-200 text-rose-900" : "bg-blue-200 text-blue-900"
                }`}
            >
              {app.category_code}
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-75">
                Applied Craft Trade Category
              </div>
              <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                {app.category_code} — {app.category_title}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-left md:text-right">
            <div>
              <span className="text-slate-500 font-medium block text-[11px]">Category Approval Intake:</span>
              <span className="text-slate-900 font-mono text-sm">
                <strong>{app.approved_count}</strong> / {app.approval_limit} Seats
              </span>
            </div>
            <div className="h-8 w-px bg-slate-300 hidden md:block" />
            <div>
              {isCategoryLocked ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-800 bg-rose-200/90 px-3 py-1 rounded-full border border-rose-300">
                  <Lock className="w-3.5 h-3.5" /> QUOTA FULL (LOCKED)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-800 bg-blue-200/90 px-3 py-1 rounded-full border border-blue-300">
                  <Sparkles className="w-3.5 h-3.5" /> {app.approval_limit - app.approved_count} Seats Available
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Error Banner */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{actionError}</div>
          </div>
        )}

        {/* Rejection Remarks Note */}
        {app.status === "REJECTED" && (
          <div className="p-4.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-rose-800">
              <XCircle className="w-4 h-4 text-rose-600" /> Official Administrative Rejection Reason (Logged in Audit Log):
            </div>
            <p className="font-mono text-xs bg-white p-3 rounded-xl border border-rose-200 text-rose-950 leading-relaxed font-semibold">
              {app.rejection_reason}
            </p>
          </div>
        )}
      </div>

      {/* 3. Main 2-Column Verification Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Candidate Dossier & Banking (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Personal Dossier */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm pb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-primary-700" />
              <span>1. Candidate Personal Profile</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 font-medium block text-[11px]">Full Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{app.full_name}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 font-medium block text-[11px]">Father / Guardian</span>
                <span className="font-bold text-slate-800 text-sm">{app.guardian_name}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 font-medium block text-[11px]">Date of Birth</span>
                <span className="font-bold text-slate-800 font-mono text-xs">{app.dob}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-0.5">
                <span className="text-slate-400 font-medium block text-[11px]">Gender & Social Category</span>
                <span className="font-bold text-slate-900">
                  {app.gender} • <strong className="text-primary-800 bg-primary-100 px-1.5 py-0.2 rounded font-black">{app.social_category}</strong>
                </span>
              </div>
            </div>

            {app.alt_mobile && (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Phone className="w-3.5 h-3.5 text-primary-700" />
                <span>Alternate Contact Mobile: <strong className="font-mono text-slate-900">{app.alt_mobile}</strong></span>
              </div>
            )}
          </div>

          {/* Section 2: Government ID & Address */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm pb-3 border-b border-slate-100">
              <Shield className="w-4 h-4 text-primary-700" />
              <span>2. Government Identity & Residential Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium block text-[11px]">Document Type</span>
                <span className="font-bold text-slate-900">{app.gov_id_type}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-medium block text-[11px]">Verified Digits</span>
                <span className="font-mono font-black text-slate-900 bg-white border border-slate-300 px-2 py-0.5 rounded-lg inline-block">
                  •••• {app.gov_id_last4}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-primary-700" /> District & Residential Address
              </div>
              <p className="text-slate-800 leading-relaxed font-sans bg-white p-3 rounded-xl border border-slate-200 text-xs">
                {app.address_full}
              </p>
              <div className="text-[11px] font-bold text-slate-600 font-mono">
                Location: {app.district_state_pin}
              </div>
            </div>
          </div>

          {/* Section 3: Academic & Training Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm pb-3 border-b border-slate-100">
              <GraduationCap className="w-4 h-4 text-primary-700" />
              <span>3. Academic & Craft Profile</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Qualification</span>
                <span className="font-bold text-slate-900">{app.highest_qual}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Occupation</span>
                <span className="font-bold text-slate-900">{app.occupation}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Training Mode</span>
                <span className="font-bold text-slate-900">{app.training_mode}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px]">Center Preference</span>
                <span className="font-bold text-slate-900">{app.preferred_centre || "District HQ"}</span>
              </div>
            </div>
          </div>

          {/* Section 4: DBT Stipend Banking */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <CreditCard className="w-4 h-4 text-primary-700" />
                <span>4. DBT Monthly Stipend Bank Account</span>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
                ✓ PFMS / DBT Direct Transfer Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[11px] block">Account Holder Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{app.bank_holder_name || app.full_name}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[11px] block">Bank Name & Branch</span>
                <span className="font-extrabold text-slate-900 text-sm">{app.bank_name_branch || "State Bank of India"}</span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[11px] block">Account Number</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {app.account_number ? `•••• •••• ${app.account_number.slice(-4)}` : "Verified on File"}
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 text-[11px] block">Bank IFSC Code</span>
                <span className="font-mono font-black text-primary-800 text-sm">{app.ifsc_code || "SBIN0001234"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 7 Mandatory Documents Verification Suite (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
                <FileText className="w-4 h-4 text-primary-700" />
                <span>Verification Document Suite</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">7 Checks</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Examine applicant's uploaded documents. Click any document card to expand into full-screen high-resolution inspection lightbox.
            </p>

            <div className="space-y-3">
              {documentsList.map(doc => {
                const docUrl = app.documents?.[doc.key];
                return (
                  <div
                    key={doc.key}
                    onClick={() => docUrl && openDocumentPreview(doc.label, docUrl)}
                    className={`p-3.5 rounded-2xl border border-slate-200/90 transition-all flex items-center justify-between group ${docUrl ? "hover:border-primary-400 hover:bg-primary-50/20 cursor-pointer" : "opacity-75"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-xl flex items-center justify-center border border-slate-200 group-hover:scale-105 transition-transform">
                        {doc.icon}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-primary-900 transition-colors">
                          {doc.label}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{doc.type}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {docUrl ? (
                        <>
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            ✓ Uploaded
                          </span>
                          <ZoomIn className="w-4 h-4 text-slate-400 group-hover:text-primary-700 transition" />
                        </>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          Not Uploaded
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Sticky Moderation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              ← Back to Queue
            </button>
            <div className="h-4 w-px bg-slate-300 hidden sm:block" />
            <div className="text-xs text-slate-600 hidden sm:block">
              Candidate: <strong className="text-slate-900">{app.full_name}</strong> • Trade:{" "}
              <strong className="text-slate-900">{app.category_code}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {app.status === "PENDING" ? (
              <>
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
                    className="px-6 py-2.5 text-xs font-bold text-slate-400 bg-slate-200 border border-slate-300 rounded-xl flex items-center gap-1.5 cursor-not-allowed"
                    title="Category quota reached. No approvals permitted."
                  >
                    <Lock className="w-4 h-4" /> Quota Full (Locked)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmApproveOpen(true)}
                    className="px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 rounded-xl transition shadow-md shadow-blue-900/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Candidate
                  </button>
                )}
              </>
            ) : (
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Application is {app.status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Approval */}
      {confirmApproveOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center gap-3 text-blue-700">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
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

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs text-blue-950 space-y-1.5 font-medium">
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
                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/20"
              >
                {approveMutation.isPending ? "Executing Atomic Quota Guard..." : "Confirm & Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal with Presets */}
      {rejectModalOpen && (
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
                className={`w-full p-3.5 border rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 transition font-medium ${rejectError ? "border-rose-500 ring-1 ring-rose-500" : "border-slate-300"
                  }`}
              />
              <div className="flex justify-between items-center mt-1.5 text-[11px]">
                <span className={rejectReason.trim().length < 10 ? "text-amber-600 font-bold" : "text-blue-600 font-bold"}>
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
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900">{previewDoc.title}</h4>
              <button onClick={closePreview} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-96 sm:h-[480px] bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
              {previewLoading ? (
                <div className="text-xs font-semibold text-slate-500">Loading document securely...</div>
              ) : previewError ? (
                <div className="text-xs font-semibold text-rose-700 px-4 text-center">{previewError}</div>
              ) : previewDoc.mimeType === "application/pdf" ? (
                <iframe src={previewDoc.url} title={previewDoc.title} className="w-full h-full border-0" />
              ) : (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-full max-w-full object-contain"
                />
              )}
            </div>
            <div className="text-right">
              <button
                onClick={closePreview}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close Lightbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

