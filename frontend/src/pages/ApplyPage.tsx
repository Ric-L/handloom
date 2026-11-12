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
  Sliders,
  ChevronDown,
} from "lucide-react";

// 9 Trade Imagery matching Apply Online photo grid
const TRADE_IMAGES: Record<string, string> = {
  "MER-01": "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=600&q=80",
  "EMB-02": "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?auto=format&fit=crop&w=600&q=80",
  "TPM-07": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
  "APA-06": "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=600&q=80",
  "LLW-04": "https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80",
  "BWA-05": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80",
  "JQW-03": "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?auto=format&fit=crop&w=600&q=80",
  "CPW-08": "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80",
  "PPM-09": "https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?auto=format&fit=crop&w=600&q=80",
};

// Exact order from Apply Online reference image (Row by Row)
const ROLE_DISPLAY_ORDER = [
  "MER-01", // Merchandiser – Fashion, Made-Ups & Home Furnishings
  "EMB-02", // Traditional Hand Embroiderer
  "TPM-07", // Traditional Painting Maker-Artisan
  "APA-06", // Applique Artisan
  "LLW-04", // Loin Loom Weaver
  "BWA-05", // Bamboo Work Artisan
  "JQW-03", // Jacquard Weaver
  "CPW-08", // Carpet Weaver
  "PPM-09", // Puppet Maker
];

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

  // Optional extended details
  const [showExtended, setShowExtended] = useState(false);
  const [gender, setGender] = useState("MALE");
  const [socialCategory, setSocialCategory] = useState("GENERAL");
  const [govIdType, setGovIdType] = useState("Aadhaar");
  const [govIdLast4, setGovIdLast4] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankNameBranch, setBankNameBranch] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [documents, setDocuments] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    tradeTitle: string;
    tradeCode: string;
    id: string;
  } | null>(null);

  useEffect(() => {
    if (initialCatParam && !selectedRoleId) {
      setSelectedRoleId(initialCatParam);
    }
  }, [initialCatParam]);

  // Sort categories according to the reference image
  const sortedCategories = React.useMemo(() => {
    if (!categories) return [];
    return [...categories].sort((a, b) => {
      const idxA = ROLE_DISPLAY_ORDER.indexOf(a.code);
      const idxB = ROLE_DISPLAY_ORDER.indexOf(b.code);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedRoleId) {
      setError("Please select a job role category from Section 1.");
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
      setError("Please agree to the declaration statement in Section 3.");
      return;
    }

    setLoading(true);

    try {
      const mergedDocs = { ...documents };
      if (photographUrl) {
        mergedDocs["photograph"] = photographUrl;
      }

      const payload = {
        category_id: Number(selectedRoleId),
        full_name: fullName.trim(),
        guardian_name: guardianName.trim(),
        dob,
        gender,
        alt_mobile: mobileNumber.trim(),
        email: email.trim(),
        gov_id_type: govIdType,
        gov_id_last4: govIdLast4.trim() || "0000",
        social_category: socialCategory,
        address_full: permanentAddress.trim(),
        district_state_pin: "Handloom Training Cluster",
        highest_qual: highestQual,
        institution_name: "",
        occupation: "SELF_EMPLOYED",
        prev_training: "",
        relevant_experience: experience,
        preferred_centre: "District Handloom Skill & Production Training Centre",
        training_mode: "CLASSROOM",
        bank_holder_name: bankHolderName.trim() || fullName.trim(),
        bank_name_branch: bankNameBranch.trim(),
        account_number: accountNumber.trim(),
        ifsc_code: ifscCode.trim(),
        documents: mergedDocs,
        photograph_url: photographUrl,
      };

      const res = await submitApplication(payload);
      qc.invalidateQueries({ queryKey: ["myApplications"] });
      qc.invalidateQueries({ queryKey: ["categories"] });

      const chosen = categories?.find(c => String(c.id) === String(selectedRoleId));
      setSubmittedData({
        tradeTitle: chosen?.title || "Craft Training Program",
        tradeCode: chosen?.code || "TRADE",
        id: res.id,
      });
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(
          err.response?.data?.error ||
            "You have already applied for this artisan trade, or the admission batch has reached full capacity."
        );
      } else {
        setError(err.response?.data?.error || "Failed to submit application. Please verify details.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (submittedData) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl shadow-xl border border-primary-200 p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-primary-700/10">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            Application Submitted
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Registration Successful!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Your skilled artisan application has been saved to the national database and queued for verification.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Selected Job Role:</span>
            <span className="font-bold text-slate-900">
              {submittedData.tradeCode} — {submittedData.tradeTitle}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Candidate Name:</span>
            <span className="font-semibold text-slate-900">{fullName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Verification Status:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              PENDING VERIFICATION
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md shadow-primary-700/20 transition"
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
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* 1. Header Banner (Matches Apply Online Image Header) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-primary-700 to-indigo-900 text-white p-6 sm:p-8 shadow-xl border border-blue-600/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Apply Online</h1>
            <h2 className="text-base sm:text-lg font-bold text-blue-100">
              Skilled Artisan / Craftsperson Jobs
            </h2>
            <p className="text-xs text-blue-200/90 font-medium">
              Choose your preferred job role and submit your application
            </p>
          </div>

          {/* Right Icon Illustration */}
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 self-start sm:self-auto shadow-inner">
            <ShieldCheck className="w-9 h-9 text-blue-200" />
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
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
        {/* SECTION 1: SELECT JOB ROLE (3x3 Image Grid)                   */}
        {/* ============================================================== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary-800 text-white font-black text-xs flex items-center justify-center shrink-0">
              1
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">
              Select Job Role{" "}
              <span className="text-xs font-normal text-slate-500">(Please choose one)</span>
            </h3>
          </div>

          {isCategoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sortedCategories.map(cat => {
                const isSelected = String(selectedRoleId) === String(cat.id);
                const imgSrc =
                  TRADE_IMAGES[cat.code] ||
                  "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=600&q=80";

                return (
                  <div
                    key={cat.id}
                    onClick={() => cat.is_approval_open && setSelectedRoleId(cat.id)}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between cursor-pointer group ${
                      !cat.is_approval_open
                        ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-200"
                        : isSelected
                        ? "border-primary-600 ring-2 ring-primary-600 bg-primary-50/20 shadow-md transform -translate-y-0.5"
                        : "border-slate-200 hover:border-primary-300 hover:shadow-sm bg-white"
                    }`}
                  >
                    {/* Role Photograph */}
                    <div className="relative h-28 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={imgSrc}
                        alt={cat.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-900/80 text-white backdrop-blur-xs">
                        {cat.code}
                      </span>
                      {!cat.is_approval_open && (
                        <span className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center font-extrabold text-[11px] text-white tracking-wider uppercase">
                          Batch Full
                        </span>
                      )}
                    </div>

                    {/* Radio Button + Role Title */}
                    <div className="p-3.5 flex items-start gap-2.5">
                      <input
                        type="radio"
                        name="selected_role"
                        value={cat.id}
                        disabled={!cat.is_approval_open}
                        checked={isSelected}
                        onChange={() => setSelectedRoleId(cat.id)}
                        className="mt-0.5 text-primary-600 focus:ring-primary-500 w-4 h-4 shrink-0"
                      />
                      <span
                        className={`text-xs font-bold leading-snug line-clamp-2 ${
                          isSelected ? "text-primary-950 font-black" : "text-slate-800"
                        }`}
                      >
                        {cat.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: APPLICANT DETAILS (2-Column Grid)                  */}
        {/* ============================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary-800 text-white font-black text-xs flex items-center justify-center shrink-0">
              2
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
                  onChange={e => setFullName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900"
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
                  onChange={e => setGuardianName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900"
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
                  onChange={e => setDob(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Right: Highest Qualification */}
            <div>
              <div className="relative">
                <GraduationCap className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <select
                  value={highestQual}
                  onChange={e => setHighestQual(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900 bg-white"
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
                  onChange={e => setMobileNumber(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Right: Relevant Experience */}
            <div>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <select
                  value={experience}
                  onChange={e => setExperience(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900 bg-white"
                >
                  <option value="None">Relevant Experience (if any): None / Beginner</option>
                  <option value="1-2 Years">1 - 2 Years Household Experience</option>
                  <option value="3-5 Years">3 - 5 Years Practicing Artisan</option>
                  <option value="5+ Years">5+ Years Master Craftsman</option>
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
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Right: Upload Photograph with blue button */}
            <div>
              <FileUploadField
                label="Upload Photograph"
                value={photographUrl}
                onChange={setPhotographUrl}
                buttonText="Choose File"
                compact
                required
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
                  onChange={e => setPermanentAddress(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Optional Extended Details Accordion */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowExtended(!showExtended)}
              className="text-xs font-bold text-primary-700 hover:text-primary-900 flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>
                {showExtended
                  ? "Hide Additional Enrolment Details (Government ID, DBT Account)"
                  : "+ Add Government ID & Bank Account for DBT Stipend (Optional)"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showExtended ? "rotate-180" : ""}`} />
            </button>

            {showExtended && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in duration-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Government ID Type & Last 4</label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={govIdType}
                      onChange={e => setGovIdType(e.target.value)}
                      className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs bg-white"
                    >
                      <option value="Aadhaar">Aadhaar</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Pan Card">PAN Card</option>
                    </select>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Last 4 (e.g. 1234)"
                      value={govIdLast4}
                      onChange={e => setGovIdLast4(e.target.value)}
                      className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Social Category</label>
                  <select
                    value={socialCategory}
                    onChange={e => setSocialCategory(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs bg-white"
                  >
                    <option value="GENERAL">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bank Name & Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. SBI Imphal Branch"
                    value={bankNameBranch}
                    onChange={e => setBankNameBranch(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bank Account Number & IFSC</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="IFSC Code"
                      value={ifscCode}
                      onChange={e => setIfscCode(e.target.value.toUpperCase())}
                      className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 3: DECLARATION (Checkbox)                             */}
        {/* ============================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-primary-800 text-white font-black text-xs flex items-center justify-center shrink-0">
              3
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">Declaration</h3>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={declaration}
              onChange={e => setDeclaration(e.target.checked)}
              className="mt-0.5 rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
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
            className="w-full sm:w-80 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-700 hover:bg-primary-800 active:translate-y-px text-white font-black text-xs rounded-full shadow-lg shadow-primary-700/25 transition cursor-pointer disabled:opacity-50 tracking-wide"
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
