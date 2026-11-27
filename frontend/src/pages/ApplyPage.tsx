import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, submitApplication } from "../api";
import FileUploadField from "../components/FileUploadField";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  PhoneCall,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Course & Personal Info", short: "Personal Info" },
  { id: 2, title: "Education & Bank", short: "Education & Bank" },
  { id: 3, title: "Upload Documents", short: "Documents" },
  { id: 4, title: "Review & Submit", short: "Review & Submit" },
];

export default function ApplyPage() {
  const [params] = useSearchParams();
  const qc = useQueryClient();

  const initialCatParam = params.get("category") || "";

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const [step, setStep] = useState(1);

  // Step 1: Course & Personal
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>(initialCatParam);
  const [fullName, setFullName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("MALE");
  const [socialCategory, setSocialCategory] = useState("ST");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");

  // Step 2: Education & Bank
  const [highestQual, setHighestQual] = useState("CLASS_X");
  const [experience, setExperience] = useState("None");
  const [govIdType, setGovIdType] = useState("Aadhaar");
  const [govIdLast4, setGovIdLast4] = useState("");
  const [bankHolderName, setBankHolderName] = useState("");
  const [bankNameBranch, setBankNameBranch] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  // Step 3: Documents
  const [photographUrl, setPhotographUrl] = useState("");
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [otherDocLabel, setOtherDocLabel] = useState("");

  // Step 4: Declaration & Submit
  const [confirmedReview, setConfirmedReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isDuplicateError, setIsDuplicateError] = useState(false);
  const [copiedReg, setCopiedReg] = useState(false);

  const triggerError = (msg: string, duplicate = false) => {
    setError(msg);
    setIsDuplicateError(duplicate);
    setShowErrorModal(true);
  };
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

  const selectedCategory = React.useMemo(() => {
    if (!categories || !selectedRoleId) return null;
    return categories.find((c) => String(c.id) === String(selectedRoleId));
  }, [categories, selectedRoleId]);

  const goToStep = (nextStep: number) => {
    setError(null);
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFromStep1 = () => {
    setError(null);
    if (!selectedRoleId) {
      triggerError("Please select a training course before continuing.");
      return;
    }
    if (!fullName.trim()) {
      triggerError("Please enter your full name as written on your Aadhaar or ID card.");
      return;
    }
    if (!guardianName.trim()) {
      triggerError("Please enter your Father's, Mother's, or Guardian's name.");
      return;
    }
    if (!dob) {
      triggerError("Please select your Date of Birth.");
      return;
    }
    if (!permanentAddress.trim()) {
      triggerError("Please enter your full home address (village/town, district, PIN code).");
      return;
    }
    goToStep(2);
  };

  const handleNextFromStep3 = () => {
    setError(null);
    const missing: string[] = [];
    if (!photographUrl) missing.push("Passport-Size Photograph");
    if (!documents.id_proof) missing.push("Aadhaar Card");
    if (!documents.address_proof) missing.push("Address Proof");
    if (!documents.edu_cert) missing.push("Education Certificate");
    if (!documents.category_disability_cert) missing.push("ST / Minority Certificate");

    if (missing.length > 0) {
      triggerError(
        `Please upload all mandatory documents before continuing: ${missing.join(", ")}.`
      );
      return;
    }
    goToStep(4);
  };

  const handleFinalSubmit = async () => {
    setError(null);
    if (!confirmedReview) {
      triggerError("Please tick the confirmation box below to submit your application.");
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
      qc.invalidateQueries({ queryKey: ["myApplications"] });

      setSubmittedData({
        tradeTitle: selectedCategory?.title || "Artisan Skill Course",
        tradeCode: selectedCategory?.code || "SKILL",
        id: res.id,
        registrationNo: res.registration_no,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      if (err.response?.status === 409) {
        triggerError(
          err.response?.data?.error ||
            "You have already submitted an application for this course. Only one application per course is allowed.",
          true
        );
      } else {
        triggerError(
          err.response?.data?.error ||
            "We could not submit your application. Please check your details and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (submittedData) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-white rounded-2xl shadow-sm border border-emerald-200 p-6 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Application Received
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Your Application Has Been Submitted!
          </h1>
          <p className="text-sm text-slate-600">
            Please save your Registration Number below. You can use it anytime to check your application status.
          </p>
        </div>

        {submittedData.registrationNo && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase">Your Registration Number</div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-lg sm:text-xl font-extrabold text-blue-800">
                {submittedData.registrationNo}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(submittedData.registrationNo!);
                  setCopiedReg(true);
                  setTimeout(() => setCopiedReg(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                {copiedReg ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedReg ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="text-xs text-slate-600">
              Course: <strong>{submittedData.tradeTitle}</strong>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition"
          >
            <span>Go to My Applications</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3 rounded-xl text-sm transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Title & Step Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Training Application Form</h1>
            <p className="text-sm text-slate-600">
              Step {step} of {STEPS.length}: <strong>{STEPS[step - 1].title}</strong>
            </p>
          </div>
          <a
            href="tel:18002007890"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Helpdesk: 1800 200 7890
          </a>
        </div>

        {/* Visual Stepper */}
        <div className="grid grid-cols-4 gap-2">
          {STEPS.map((s) => {
            const done = step > s.id;
            const current = step === s.id;
            return (
              <div key={s.id} className="space-y-1.5">
                <div
                  className={`h-2 rounded-full transition-all ${
                    done ? "bg-emerald-600" : current ? "bg-blue-700" : "bg-slate-200"
                  }`}
                />
                <div className="flex items-center gap-1.5 text-xs">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                      done
                        ? "bg-emerald-600 text-white"
                        : current
                        ? "bg-blue-700 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {done ? "✓" : s.id}
                  </span>
                  <span
                    className={`truncate font-semibold hidden sm:inline ${
                      current ? "text-blue-800" : done ? "text-emerald-800" : "text-slate-500"
                    }`}
                  >
                    {s.short}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pop-out Alert Modal */}
      {showErrorModal && error && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="apply-alert-title"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 sm:p-7 space-y-5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 id="apply-alert-title" className="text-xl font-extrabold text-slate-900">
                {isDuplicateError ? "Already Applied for This Course" : "Please Check Your Form"}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">{error}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2 justify-center">
              {isDuplicateError && (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0f256e] hover:bg-blue-950 text-white text-sm font-bold transition"
                  >
                    View My Applications
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setShowErrorModal(false);
                      goToStep(1);
                    }}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold transition cursor-pointer"
                  >
                    Choose Another Course
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className={`inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer ${
                  isDuplicateError
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    : "bg-rose-600 hover:bg-rose-700 text-white w-full"
                }`}
              >
                OK, Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Friendly Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* STEP 1: Course & Personal Details */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">1. Choose Your Course &amp; Personal Details</h2>
            <p className="text-sm text-slate-600">Fields marked with * are required.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="course-select" className="block text-sm font-bold text-slate-800 mb-1.5">
                Select Training Course <span className="text-rose-600">*</span>
              </label>
              <select
                id="course-select"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                disabled={isCategoriesLoading}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="">-- Choose a course --</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id} disabled={!cat.is_approval_open}>
                    {cat.title} ({cat.code}) {!cat.is_approval_open ? "— Admissions Closed" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full-name" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Your Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As written on Aadhaar / ID"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="guardian-name" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Father&apos;s / Guardian&apos;s Name <span className="text-rose-600">*</span>
                </label>
                <input
                  id="guardian-name"
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Enter father or guardian name"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="dob" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Date of Birth <span className="text-rose-600">*</span>
                </label>
                <input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Gender
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="social-cat" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Social Category
                </label>
                <select
                  id="social-cat"
                  value={socialCategory}
                  onChange={(e) => setSocialCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="ST">ST</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="OTHER">Minority / Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="alt-mobile" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Alternate Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="alt-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-800 mb-1.5">
                  Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-bold text-slate-800 mb-1.5">
                Full Home Address (with District &amp; PIN Code) <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="address"
                rows={3}
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                placeholder="House No, Street/Village, Post Office, District, State, PIN Code"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleNextFromStep1}
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-7 py-3 rounded-xl text-sm transition cursor-pointer"
            >
              <span>Save &amp; Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Education & Bank Details */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">2. Education &amp; Bank Details</h2>
            <p className="text-sm text-slate-600">
              Bank details are used to send your monthly training stipend directly to your account.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="qual" className="block text-sm font-bold text-slate-800 mb-1.5">
                Highest School / Education Level
              </label>
              <select
                id="qual"
                value={highestQual}
                onChange={(e) => setHighestQual(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="BELOW_VIII">Below Class 8</option>
                <option value="CLASS_VIII">Class 8 Pass</option>
                <option value="CLASS_X">Class 10 Pass</option>
                <option value="CLASS_XII">Class 12 Pass</option>
                <option value="GRADUATE">Graduate or Higher</option>
              </select>
            </div>

            <div>
              <label htmlFor="exp" className="block text-sm font-bold text-slate-800 mb-1.5">
                Prior Weaving / Craft Experience
              </label>
              <select
                id="exp"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="None">No prior experience (Beginner)</option>
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1-3 years">1 to 3 years</option>
                <option value="3+ years">More than 3 years</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Govt-Issued ID Details (Optional)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gov-id-type" className="block text-sm font-medium text-slate-700 mb-1.5">
                  ID Type
                </label>
                <select
                  id="gov-id-type"
                  value={govIdType}
                  onChange={(e) => setGovIdType(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="Aadhaar">Aadhaar Card</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Ration Card">Ration Card</option>
                </select>
              </div>
              <div>
                <label htmlFor="gov-id-last4" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Last 4 Digits of ID
                </label>
                <input
                  id="gov-id-last4"
                  type="text"
                  maxLength={4}
                  value={govIdLast4}
                  onChange={(e) => setGovIdLast4(e.target.value)}
                  placeholder="e.g. 4321"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Bank Account for Monthly Stipend (Optional)</h3>
              <p className="text-xs text-slate-500">Enter the details from your bank passbook.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bank-holder" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Account Holder Name
                </label>
                <input
                  id="bank-holder"
                  type="text"
                  value={bankHolderName}
                  onChange={(e) => setBankHolderName(e.target.value)}
                  placeholder="Name as on bank passbook"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="bank-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Bank &amp; Branch Name
                </label>
                <input
                  id="bank-name"
                  type="text"
                  value={bankNameBranch}
                  onChange={(e) => setBankNameBranch(e.target.value)}
                  placeholder="e.g. SBI Imphal Main Branch"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="acc-num" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Account Number
                </label>
                <input
                  id="acc-num"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter bank account number"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="ifsc" className="block text-sm font-medium text-slate-700 mb-1.5">
                  IFSC Code
                </label>
                <input
                  id="ifsc"
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0000123"
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 uppercase focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-7 py-3 rounded-xl text-sm transition cursor-pointer"
            >
              <span>Save &amp; Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Upload Documents */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">3. Upload Photo &amp; Supporting Documents</h2>
            <p className="text-sm text-slate-600">
              Take a clear photo or upload a PDF (strictly below 5 MB each). Items marked with * are mandatory.
            </p>
          </div>

          <div className="space-y-4">
            <FileUploadField
              label="Passport-Size Photograph"
              value={photographUrl}
              onChange={setPhotographUrl}
              buttonText="Upload Photo"
              required
            />
            <FileUploadField
              label="Aadhaar Card"
              value={documents.id_proof}
              onChange={(url) => setDocuments((prev) => ({ ...prev, id_proof: url }))}
              required
            />
            <FileUploadField
              label="Address Proof"
              value={documents.address_proof}
              onChange={(url) => setDocuments((prev) => ({ ...prev, address_proof: url }))}
              required
            />
            <FileUploadField
              label="Bank Passbook Front Page"
              value={documents.bank_passbook}
              onChange={(url) => setDocuments((prev) => ({ ...prev, bank_passbook: url }))}
            />
            <FileUploadField
              label="Education Certificate"
              value={documents.edu_cert}
              onChange={(url) => setDocuments((prev) => ({ ...prev, edu_cert: url }))}
              required
            />
            <FileUploadField
              label="ST / Minority Certificate"
              value={documents.category_disability_cert}
              onChange={(url) => setDocuments((prev) => ({ ...prev, category_disability_cert: url }))}
              required
            />
            <FileUploadField
              label="Signature or Thumb Impression"
              value={documents.signature_thumb}
              onChange={(url) => setDocuments((prev) => ({ ...prev, signature_thumb: url }))}
            />

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <label htmlFor="other-doc-label" className="block text-sm font-bold text-slate-800">
                Any Other Document (Optional)
              </label>
              <input
                id="other-doc-label"
                type="text"
                value={otherDocLabel}
                onChange={(e) => setOtherDocLabel(e.target.value)}
                placeholder="Document name (e.g. Weaver ID Card)"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <FileUploadField
                label="Upload Other Document"
                value={documents.other_doc}
                onChange={(url) => setDocuments((prev) => ({ ...prev, other_doc: url }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleNextFromStep3}
              className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold px-7 py-3 rounded-xl text-sm transition cursor-pointer"
            >
              <span>Review Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Review & Submit */}
      {step === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">4. Check Your Details Before Submitting</h2>
            <p className="text-sm text-slate-600">
              Please verify everything below is correct. Click &ldquo;Edit&rdquo; if you need to change anything.
            </p>
          </div>

          {/* Summary Section 1 */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Course &amp; Personal Details</h3>
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              <div><span className="text-slate-500">Course:</span> <strong>{selectedCategory?.title}</strong></div>
              <div><span className="text-slate-500">Full Name:</span> <strong>{fullName}</strong></div>
              <div><span className="text-slate-500">Father/Guardian:</span> <strong>{guardianName}</strong></div>
              <div><span className="text-slate-500">Date of Birth:</span> <strong>{dob}</strong></div>
              <div><span className="text-slate-500">Gender / Category:</span> <strong>{gender} / {socialCategory}</strong></div>
              <div><span className="text-slate-500">Address:</span> <strong>{permanentAddress}</strong></div>
            </div>
          </div>

          {/* Summary Section 2 */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Education &amp; Bank Details</h3>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm">
              <div><span className="text-slate-500">Education:</span> <strong>{highestQual}</strong></div>
              <div><span className="text-slate-500">Experience:</span> <strong>{experience}</strong></div>
              <div><span className="text-slate-500">ID:</span> <strong>{govIdType} {govIdLast4 ? `(****${govIdLast4})` : "(Not entered)"}</strong></div>
              <div><span className="text-slate-500">Bank Account:</span> <strong>{accountNumber || "Not entered"}</strong></div>
            </div>
          </div>

          {/* Summary Section 3 */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Uploaded Files</h3>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
            <p className="text-sm text-slate-700">
              {(photographUrl ? 1 : 0) + Object.values(documents).filter(Boolean).length} file(s) attached.
            </p>
          </div>

          {/* Declaration */}
          <label className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmedReview}
              onChange={(e) => setConfirmedReview(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-700 rounded border-slate-300"
            />
            <span className="text-sm text-slate-800 leading-relaxed">
              I confirm that all the information and documents provided above are true and correct to the best of my knowledge.
            </span>
          </label>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3.5 rounded-xl text-sm shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? "Submitting..." : "Submit Application"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
