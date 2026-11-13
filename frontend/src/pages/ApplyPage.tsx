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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    tradeTitle: string;
    tradeCode: string;
    id: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRoleId) {
      setError("Please select an accredited artisan trade before submitting.");
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
      setError("Please agree to the declaration statement.");
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
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md shadow-blue-900/20 transition"
          >
            View in My Applications <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to={`/apply/update/${submittedData.id}`}
            className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs transition border border-slate-200"
          >
            Complete Extended Dossier & Bank Details
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

      {/* Main Form Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-10">
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
        {/* SUBMIT BUTTON                                                 */}
        {/* ============================================================== */}
        <div className="text-center pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-80 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 active:translate-y-px text-white font-black text-xs rounded-full shadow-lg shadow-blue-900/25 transition cursor-pointer disabled:opacity-50 tracking-wide"
          >
            {loading ? (
              <span>Submitting Application...</span>
            ) : (
              <>
                <span>Submit Application</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
