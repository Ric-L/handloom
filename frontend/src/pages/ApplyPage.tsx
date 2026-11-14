import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, submitApplication } from "../api";
import FileUploadField from "../components/FileUploadField";
import {
  User,
  Calendar,
  Phone,
  Mail,
  Users,
  GraduationCap,
  Briefcase,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Clock,
  Award,
  Layers,
  ChevronDown,
  FileText,
  Paperclip,
  ArrowLeft,
  Lock,
  ExternalLink,
} from "lucide-react";

export default function ApplyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const initialCatParam = params.get("category") || "";

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const [selectedRoleId, setSelectedRoleId] = useState<number | string>(initialCatParam);
  const [fullName, setFullName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [dob, setDob] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [highestQual, setHighestQual] = useState("CLASS_X");
  const [experience, setExperience] = useState("None");
  const [photographUrl, setPhotographUrl] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [declaration, setDeclaration] = useState(false);

  // Optional extended details (Gov ID and Bank details for DBT stipend)
  const [showExtended, setShowExtended] = useState(false);
  const [gender, setGender] = useState("MALE");
  const [socialCategory, setSocialCategory] = useState("GENERAL");
  const [govIdType, setGovIdType] = useState("Aadhaar");
  const [govIdLast4, setGovIdLast4] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankNameBranch, setBankNameBranch] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  // Document Checklist (Optional supporting document uploads)
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [otherDocLabel, setOtherDocLabel] = useState("");

  // Step Review & Confirmation Mode
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [confirmedReview, setConfirmedReview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    tradeTitle: string;
    tradeCode: string;
    id: string;
    registrationNo?: string;
  } | null>(null);

  useEffect(() => {
    if (initialCatParam) {
      setSelectedRoleId(initialCatParam);
    } else if (categories && categories.length > 0 && !selectedRoleId) {
      const firstOpen = categories.find((c) => c.is_approval_open) || categories[0];
      if (firstOpen) {
        setSelectedRoleId(firstOpen.id);
      }
    }
  }, [initialCatParam, categories, selectedRoleId]);

  // Find currently selected category object for read-only summary header
  const selectedCategory = React.useMemo(() => {
    if (!categories || !selectedRoleId) return null;
    return categories.find((c) => String(c.id) === String(selectedRoleId));
  }, [categories, selectedRoleId]);

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRoleId) {
      setError("Please select an accredited artisan trade before continuing.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your Full Name.");
      return;
    }

    if (!guardianName.trim()) {
      setError("Please enter Father's / Guardian's Name.");
      return;
    }

    if (!dob) {
      setError("Please select your Date of Birth.");
      return;
    }

    if (!permanentAddress.trim()) {
      setError("Please provide your Permanent Residential Address.");
      return;
    }

    if (!declaration) {
      setError("Please agree to the applicant declaration checkbox.");
      return;
    }

    // Switch to complete review mode and scroll to top
    setIsReviewMode(true);
    setConfirmedReview(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFinalSubmit = async () => {
    setError(null);

    if (!confirmedReview) {
      setError("You must verify and confirm that all details and documents are accurate before final submission.");
      return;
    }

    setLoading(true);

    try {
      const mergedDocs = { ...documents };
      if (photographUrl) {
        mergedDocs["photograph"] = photographUrl;
      }
      if (otherDocLabel.trim()) {
        mergedDocs["other_doc_label"] = otherDocLabel.trim();
      }

      const payload = {
        category_id: Number(selectedRoleId),
        full_name: fullName.trim(),
        guardian_name: guardianName.trim(),
        dob,
        gender,
        alt_mobile: mobileNumber.trim(),
        email: email.trim(),
        highest_qual: highestQual,
        prior_experience: {
          has_experience: experience !== "None",
          details: experience !== "None" ? `${experience} experience` : undefined,
        },
        address_full: permanentAddress.trim(),
        district_state_pin: permanentAddress.trim(),
        gov_id_type: govIdType,
        gov_id_last4: govIdLast4.trim() || undefined,
        social_category: socialCategory,
        bank_holder_name: bankHolderName.trim() || undefined,
        bank_name_branch: bankNameBranch.trim() || undefined,
        account_number: accountNumber.trim() || undefined,
        ifsc_code: ifscCode.trim() || undefined,
        documents: mergedDocs,
      };

      const res = await submitApplication(payload);

      // Invalidate queries so candidate dashboard updates immediately
      qc.invalidateQueries({ queryKey: ["myApplications"] });

      setSubmittedData({
        tradeTitle: selectedCategory?.title || "Artisan Skill Course",
        tradeCode: selectedCategory?.code || "SKILL",
        id: res.id,
        registrationNo: res.registration_no,
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(
          err.response?.data?.error ||
            "You have already submitted an application for this artisan category. Only one submission per category is permitted."
        );
      } else {
        setError(
          err.response?.data?.error ||
            "Failed to submit application. Please verify all required details and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Success Confirmation Screen
  if (submittedData) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl shadow-xl border border-blue-200 p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-blue-700/10">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Submission Confirmed
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Application Submitted Successfully!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Your admission enrolment dossier has been securely persisted in the national database.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-2.5 text-xs">
          {submittedData.registrationNo && (
            <div className="flex justify-between items-center pb-2.5 border-b border-blue-200/80 bg-blue-50/70 -mx-5 -mt-5 p-4 rounded-t-2xl">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">
                  Official Registration ID / Tracking Number
                </span>
                <span className="font-mono text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  {submittedData.registrationNo}
                </span>
              </div>
              <span className="text-[11px] font-bold text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs">
                Keep Safe for Tracking
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Applied Trade:</span>
            <span className="font-bold text-slate-900 text-sm">
              {submittedData.tradeCode} — {submittedData.tradeTitle}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Candidate Name:</span>
            <span className="font-semibold text-slate-900">{fullName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Current Status:</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
              PENDING VERIFICATION
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md shadow-blue-900/20 transition cursor-pointer"
          >
            Go to My Applications <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 shadow-xl border border-blue-600/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Apply Online</h1>
            <h2 className="text-base sm:text-lg font-bold text-blue-100">
              Skilled Artisan / Craftsperson Jobs
            </h2>
            <p className="text-xs text-blue-200/90 font-medium">
              Submit your candidate admission and training enrolment dossier
            </p>
          </div>

          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 self-start sm:self-auto shadow-inner">
            <ShieldCheck className="w-9 h-9 text-blue-200" />
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Read-Only Summary Header for Selected Category */}
      <div className="bg-white rounded-3xl border border-blue-200/90 shadow-md p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800" />

        {isCategoriesLoading ? (
          <div className="animate-pulse space-y-3 py-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-6 bg-slate-200 rounded w-2/3" />
            <div className="h-4 bg-slate-100 rounded w-1/2" />
          </div>
        ) : selectedCategory ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                  {selectedCategory.code}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Selected Artisan Trade
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedCategory.is_approval_open !== false
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      selectedCategory.is_approval_open !== false
                        ? "bg-blue-600 animate-pulse"
                        : "bg-rose-500"
                    }`}
                  />
                  {selectedCategory.is_approval_open !== false ? "Admissions Open" : "Batch Full"}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {selectedCategory.title}
              </h2>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  Duration: <strong>6 Months (Full-Time Hands-on)</strong>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Award className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  Credential: <strong>NSQF Aligned Govt. Credential</strong>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  Allowance: <strong>Monthly DBT Stipend Backed</strong>
                </span>
              </div>
            </div>

            <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 flex items-center justify-between md:justify-end gap-3">
              <Link
                to="/#trades"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition"
              >
                <span>Change Trade</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">No Trade Selected</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Please select an accredited artisan course to submit your application.
              </p>
            </div>
            <Link
              to="/#trades"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-800 transition shrink-0"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Browse Artisan Trades</span>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2.5 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Review Screen or Main Form Form */}
      {isReviewMode ? (
        <div className="bg-white rounded-3xl border border-blue-200/90 shadow-xl overflow-hidden space-y-8 p-6 sm:p-9">
          {/* Review Header Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-700/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
                  Pre-Submission Review Step
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Verify Application Details &amp; Documents
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Carefully check your answers below. You can navigate back to edit any errors.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsReviewMode(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit Form
            </button>
          </div>

          {/* Review Section 1: Selected Artisan Trade */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                1. Accredited Artisan Trade
              </h4>
              <button
                type="button"
                onClick={() => setIsReviewMode(false)}
                className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 mr-2">
                  {selectedCategory?.code || "SKILL"}
                </span>
                <span className="font-extrabold text-slate-900 text-sm">{selectedCategory?.title}</span>
              </div>
              <span className="text-slate-500 font-medium">Training &amp; Assessment Track</span>
            </div>
          </div>

          {/* Review Section 2: Personal & Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                2. Applicant Particulars
              </h4>
              <button
                type="button"
                onClick={() => setIsReviewMode(false)}
                className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Edit
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Full Name</span>
                <span className="font-bold text-slate-900 text-sm">{fullName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Father / Guardian</span>
                <span className="font-semibold text-slate-900">{guardianName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Date of Birth</span>
                <span className="font-mono font-bold text-slate-900">{dob}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Gender</span>
                <span className="font-semibold text-slate-900">{gender}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Social Category</span>
                <span className="font-semibold text-slate-900">{socialCategory}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Mobile Number</span>
                <span className="font-mono font-bold text-slate-900">{mobileNumber || "—"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Email Address</span>
                <span className="font-medium text-slate-900 truncate block">{email || "—"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Highest Qualification</span>
                <span className="font-semibold text-slate-900">{highestQual}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[11px] font-medium">Relevant Experience</span>
                <span className="font-semibold text-slate-900">{experience}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
              <span className="text-slate-400 block text-[11px] font-medium mb-0.5">Permanent Address</span>
              <span className="font-semibold text-slate-900 leading-relaxed">{permanentAddress}</span>
            </div>
          </div>

          {/* Review Section 3: DBT Stipend & ID */}
          {(govIdLast4 || bankHolderName || accountNumber) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  3. Identity Proof &amp; DBT Stipend Bank Details
                </h4>
                <button
                  type="button"
                  onClick={() => setIsReviewMode(false)}
                  className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px] font-medium">Government ID</span>
                  <span className="font-semibold text-slate-900">
                    {govIdType} {govIdLast4 ? `(ending in ${govIdLast4})` : ""}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px] font-medium">Account Holder</span>
                  <span className="font-semibold text-slate-900">{bankHolderName || "—"}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px] font-medium">Bank &amp; Branch</span>
                  <span className="font-semibold text-slate-900">{bankNameBranch || "—"}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[11px] font-medium">Account / IFSC</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {accountNumber ? `••••${accountNumber.slice(-4)}` : "—"} / {ifscCode || "—"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Review Section 4: Uploaded Documents Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                4. Uploaded Supporting Documents
              </h4>
              <button
                type="button"
                onClick={() => setIsReviewMode(false)}
                className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Change Files
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Photograph */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">Candidate Photograph</span>
                </div>
                {photographUrl ? (
                  <span className="font-bold text-blue-700 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px] shrink-0">Not uploaded</span>
                )}
              </div>

              {/* ID Proof */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">Identity Proof</span>
                </div>
                {documents["identity_proof"] ? (
                  <span className="font-bold text-blue-700 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px] shrink-0">Not provided</span>
                )}
              </div>

              {/* Address Proof */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">Address Proof</span>
                </div>
                {documents["address_proof"] ? (
                  <span className="font-bold text-blue-700 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px] shrink-0">Not provided</span>
                )}
              </div>

              {/* Educational Certificate */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">Educational Certificate</span>
                </div>
                {documents["educational_cert"] ? (
                  <span className="font-bold text-blue-700 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px] shrink-0">Not provided</span>
                )}
              </div>

              {/* Bank Passbook */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">Bank Passbook Copy</span>
                </div>
                {documents["bank_passbook"] ? (
                  <span className="font-bold text-blue-700 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px] shrink-0">Not provided</span>
                )}
              </div>

              {/* Category Certificate */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Paperclip className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">Category / Disability Certificate</span>
                </div>
                {documents["category_disability_cert"] ? (
                  <span className="font-bold text-blue-700 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                ) : (
                  <span className="text-slate-400 italic text-[11px] shrink-0">Not provided</span>
                )}
              </div>

              {/* Other Document */}
              {documents["other_doc"] && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 sm:col-span-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Paperclip className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">
                      {otherDocLabel.trim() || "Other Supporting Document"}
                    </span>
                  </div>
                  <span className="font-bold text-blue-700 flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Important Finalization Lock Notice */}
          <div className="p-4.5 bg-blue-50/80 border-2 border-blue-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-blue-950 font-black text-xs uppercase tracking-wide">
              <Lock className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Finalized Application &amp; Read-Only Lock Notice</span>
            </div>
            <p className="text-xs text-blue-900 leading-relaxed font-medium">
              Once you click <strong>Final Submit Application</strong> below, your registration dossier will be
              officially sealed in the portal. To safeguard official government record integrity, <strong>you will NOT be permitted to modify, edit, or replace any answers or uploaded files afterward</strong>.
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={confirmedReview}
                onChange={(e) => setConfirmedReview(e.target.checked)}
                className="mt-0.5 rounded text-blue-700 focus:ring-blue-600 w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-900 leading-relaxed">
                I have reviewed all the information and uploaded documents displayed above. I confirm that all details are accurate, complete, and authentic, and I agree to officially submit and finalize this application.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setIsReviewMode(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Go Back to Correct Mistakes
            </button>

            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading || !confirmedReview}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:translate-y-px text-white font-black text-xs rounded-xl shadow-lg shadow-blue-900/25 transition cursor-pointer disabled:opacity-50 tracking-wide"
            >
              {loading ? (
                <span>Submitting &amp; Locking Dossier...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Final Submit Application</span>
                  <ChevronRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Main Form Form */
        <form onSubmit={handleProceedToReview} className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-10">
        {/* ============================================================== */}
        {/* SECTION 1: APPLICANT DETAILS (2-Column Grid)                  */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-800 text-white font-black text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">Applicant Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Full Name */}
            <div>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Full Name *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Right: Father's / Guardian's Name */}
            <div>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Father's / Guardian's Name *"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Left: Date of Birth */}
            <div>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="date"
                  required
                  placeholder="Date of Birth *"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Right: Highest Qualification */}
            <div>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <select
                  value={highestQual}
                  onChange={(e) => setHighestQual(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 bg-white"
                >
                  <option value="CLASS_X">Highest Qualification: Class X (Matric)</option>
                  <option value="NO_FORMAL">No formal schooling</option>
                  <option value="CLASS_V">Class V</option>
                  <option value="CLASS_VIII">Class VIII</option>
                  <option value="CLASS_XII">Class XII (Higher Secondary)</option>
                  <option value="GRADUATE">Graduate / Diploma</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Left: Mobile Number */}
            <div>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Mobile Number *"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Right: Relevant Experience */}
            <div>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 bg-white"
                >
                  <option value="None">Relevant Experience (if any): None / Beginner</option>
                  <option value="Less than 1 Year">Less than 1 Year</option>
                  <option value="1 to 3 Years">1 to 3 Years</option>
                  <option value="3+ Years">3+ Years (Experienced Artisan)</option>
                </select>
              </div>
            </div>

            {/* Left: Email Address */}
            <div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Right: Upload Photograph */}
            <div>
              <FileUploadField
                compact
                label="Recent Passport-Size Photograph"
                required
                accept="image/jpeg,image/png"
                value={photographUrl}
                onChange={setPhotographUrl}
              />
            </div>

            {/* Full Width: Permanent Address */}
            <div className="md:col-span-2">
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <textarea
                  rows={2}
                  required
                  placeholder="Permanent Address *"
                  value={permanentAddress}
                  onChange={(e) => setPermanentAddress(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-900 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Optional Extended Details Drawer (Gov ID & DBT Bank Stipend) */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60 transition">
          <button
            type="button"
            onClick={() => setShowExtended(!showExtended)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-blue-700 transition"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-700" />
              <span>+ Add Government ID & Bank Account for DBT Stipend (Optional)</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${showExtended ? "rotate-180" : ""}`}
            />
          </button>

          {showExtended && (
            <div className="p-5 pt-2 border-t border-slate-200 bg-white space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Social Category</label>
                  <select
                    value={socialCategory}
                    onChange={(e) => setSocialCategory(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium bg-white"
                  >
                    <option value="GENERAL">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">Scheduled Caste (SC)</option>
                    <option value="ST">Scheduled Tribe (ST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Government ID Type</label>
                  <select
                    value={govIdType}
                    onChange={(e) => setGovIdType(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium bg-white"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Voter ID">Voter ID Card</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Artisan Card">Pehchan Artisan Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Gov ID Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 7890"
                    value={govIdLast4}
                    onChange={(e) => setGovIdLast4(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Bank Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Name as per bank passbook"
                    value={bankHolderName}
                    onChange={(e) => setBankHolderName(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Bank Name & Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India, Main Branch"
                    value={bankNameBranch}
                    onChange={(e) => setBankNameBranch(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="Account number for DBT stipend"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Bank IFSC Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: 5. DOCUMENT CHECKLIST (OPTIONAL UPLOADS)            */}
        {/* ============================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-blue-800 text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>5. Document Checklist (Optional Supporting Uploads)</span>
                </h3>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 self-start sm:self-auto">
              All uploads optional • Max 5MB each (PDF, JPG, PNG)
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Applicants may optionally upload digital copies of their documents now for faster verification. Any documents not uploaded online can be physically produced during centre batch induction.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* 1. Recent passport-size photograph */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-blue-700 font-black">■</span>
                  <span>Recent passport-size photograph</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <FileUploadField
                compact
                label="Photograph Copy"
                accept="image/jpeg,image/png"
                value={documents["photograph"] || photographUrl}
                onChange={(url) => {
                  setDocuments((prev) => ({ ...prev, photograph: url }));
                  if (!photographUrl) setPhotographUrl(url);
                }}
              />
            </div>

            {/* 2. Identity proof (as permitted by scheme) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-blue-700 font-black">■</span>
                  <span>Identity proof (as permitted by scheme)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <FileUploadField
                compact
                label="Aadhaar / Voter ID / PAN"
                accept="image/*,application/pdf"
                value={documents["id_proof"] || ""}
                onChange={(url) => setDocuments((prev) => ({ ...prev, id_proof: url }))}
              />
            </div>

            {/* 3. Address proof (if required) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-blue-700 font-black">■</span>
                  <span>Address proof (if required)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <FileUploadField
                compact
                label="Electricity Bill / Domicile / Ration"
                accept="image/*,application/pdf"
                value={documents["address_proof"] || ""}
                onChange={(url) => setDocuments((prev) => ({ ...prev, address_proof: url }))}
              />
            </div>

            {/* 4. Educational certificate (if available/required) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-blue-700 font-black">■</span>
                  <span>Educational certificate (if available/required)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <FileUploadField
                compact
                label="Class X / Marksheet / Diploma"
                accept="image/*,application/pdf"
                value={documents["edu_cert"] || ""}
                onChange={(url) => setDocuments((prev) => ({ ...prev, edu_cert: url }))}
              />
            </div>

            {/* 5. Bank passbook copy (only if required) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-blue-700 font-black">■</span>
                  <span>Bank passbook copy (only if required)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <FileUploadField
                compact
                label="Passbook / Cancelled Cheque"
                accept="image/*,application/pdf"
                value={documents["bank_passbook"] || ""}
                onChange={(url) => setDocuments((prev) => ({ ...prev, bank_passbook: url }))}
              />
            </div>

            {/* 6. Category/disability certificate (only if applicable and required) */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-blue-700 font-black">■</span>
                  <span>Category/disability certificate (if applicable)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
              <FileUploadField
                compact
                label="OBC / SC / ST / Disability Cert"
                accept="image/*,application/pdf"
                value={documents["category_disability_cert"] || ""}
                onChange={(url) => setDocuments((prev) => ({ ...prev, category_disability_cert: url }))}
              />
            </div>

            {/* 7. Other Document: with custom description input */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2 md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-blue-700 font-black">■</span>
                  <span>Other Document (Optional)</span>
                </span>
                <div className="flex items-center gap-2 flex-1 max-w-sm sm:ml-4">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Document Label:</span>
                  <input
                    type="text"
                    placeholder="e.g. Master Weaver Experience Letter"
                    value={otherDocLabel}
                    onChange={(e) => setOtherDocLabel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none font-medium text-slate-800"
                  />
                </div>
              </div>
              <FileUploadField
                compact
                label={otherDocLabel.trim() ? otherDocLabel.trim() : "Other Supporting Document"}
                accept="image/*,application/pdf"
                value={documents["other_doc"] || ""}
                onChange={(url) => setDocuments((prev) => ({ ...prev, other_doc: url }))}
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 3: DECLARATION (Checkbox)                             */}
        {/* ============================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-800 text-white font-black text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">Declaration</h3>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={declaration}
              onChange={(e) => setDeclaration(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-xs text-slate-700 font-medium leading-relaxed">
              I hereby declare that the information provided above is true and correct to the best of my knowledge.
            </span>
          </label>
        </div>

        {/* ============================================================== */}
        {/* PROCEED TO REVIEW BUTTON                                      */}
        {/* ============================================================== */}
        <div className="text-center pt-2">
          <button
            type="submit"
            className="w-full sm:w-80 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:translate-y-px text-white font-black text-xs rounded-full shadow-lg shadow-blue-900/25 transition cursor-pointer tracking-wide"
          >
            <span>Review &amp; Confirm Application</span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            You will review all details and uploaded files before finalized submission.
          </p>
        </div>
      </form>
      )}
    </div>
  );
}
