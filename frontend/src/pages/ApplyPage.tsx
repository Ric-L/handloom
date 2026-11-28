import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, submitApplication, getCurrentUser, getMyApplications } from "../api";
import { MANIPUR_DISTRICTS } from "../lib/constants";
import FileUploadField from "../components/FileUploadField";
import CandidateWorkspaceShell from "../components/CandidateWorkspaceShell";
import DateOfBirthPicker from "../components/DateOfBirthPicker";
import type { User, Application } from "../types";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Edit3,
  PhoneCall,
  RotateCcw,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "Personal & course details", short: "Personal details" },
  { id: 2, title: "Education & bank details", short: "Education & bank" },
  { id: 3, title: "Upload documents", short: "Documents" },
  { id: 4, title: "Review & submit", short: "Review" },
];

export default function ApplyPage() {
  const [params] = useSearchParams();
  const qc = useQueryClient();

  const initialCatParam = params.get("category") || "";

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: myApplications } = useQuery({
    queryKey: ["myApplications"],
    queryFn: getMyApplications,
  });

  const activeAppByCategory = React.useMemo(() => {
    const map = new Map<number, Application>();
    (myApplications || []).forEach((app) => {
      if (app.status === "PENDING" || app.status === "APPROVED") {
        map.set(app.category_id, app);
      }
    });
    return map;
  }, [myApplications]);

  const rejectedAppByCategory = React.useMemo(() => {
    const map = new Map<number, Application>();
    (myApplications || []).forEach((app) => {
      if (app.status === "REJECTED" && !activeAppByCategory.has(app.category_id) && !map.has(app.category_id)) {
        map.set(app.category_id, app);
      }
    });
    return map;
  }, [myApplications, activeAppByCategory]);

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
  const [district, setDistrict] = useState("");
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

  const normalizeDOB = (raw?: string | null) => {
    const clean = (raw || "").trim().slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(clean) ? clean : "";
  };

  const applyUserDefaults = (u: User | null) => {
    if (!u) return;
    const cleanDOB = normalizeDOB(u.dob);
    setFullName((prev) => prev || u.full_name || "");
    setGuardianName((prev) => prev || u.father_name || "");
    setDob((prev) => prev || cleanDOB);
    setEmail((prev) => prev || u.email || "");
    setMobileNumber((prev) => prev || u.mobile_number || "");
    setDistrict((prev) => prev || u.district || "");
    const composedAddr = [u.address_line1, u.address_line2, u.address_line3]
      .filter((x) => Boolean(x && x.trim()))
      .join(", ");
    setPermanentAddress((prev) => prev || composedAddr);
  };

  useEffect(() => {
    if (!myApplications || myApplications.length === 0) return;
    const appDOB = myApplications.map((a) => normalizeDOB(a.dob)).find(Boolean);
    if (appDOB) {
      setDob((prev) => prev || appDOB);
    }
  }, [myApplications]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        applyUserDefaults(JSON.parse(raw) as User);
      }
    } catch {
      // ignore
    }
    getCurrentUser()
      .then((res) => {
        if (res?.user) {
          applyUserDefaults(res.user);
          localStorage.setItem("user", JSON.stringify(res.user));
        }
      })
      .catch(() => {
        // ignore if offline
      });
  }, []);

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
      const firstAvailable =
        categories.find((c) => c.is_approval_open && !activeAppByCategory.has(c.id)) ||
        categories.find((c) => c.is_approval_open) ||
        categories[0];
      if (firstAvailable) {
        setSelectedRoleId(firstAvailable.id);
      }
    }
  }, [initialCatParam, categories, selectedRoleId, activeAppByCategory]);

  const selectedCategory = React.useMemo(() => {
    if (!categories || !selectedRoleId) return null;
    return categories.find((c) => String(c.id) === String(selectedRoleId));
  }, [categories, selectedRoleId]);

  const activeAppForSelected = React.useMemo(() => {
    if (!selectedRoleId) return undefined;
    return activeAppByCategory.get(Number(selectedRoleId));
  }, [selectedRoleId, activeAppByCategory]);

  const rejectedAppForSelected = React.useMemo(() => {
    if (!selectedRoleId) return undefined;
    return rejectedAppByCategory.get(Number(selectedRoleId));
  }, [selectedRoleId, rejectedAppByCategory]);

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
    if (activeAppForSelected) {
      triggerError(
        `You already have a ${activeAppForSelected.status.toLowerCase()} application for this trade. A new application under the same category is only allowed if the previous application was rejected.`,
        true
      );
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
    if (!district) {
      triggerError("Please select your Manipur district before continuing.");
      return;
    }
    if (!permanentAddress.trim()) {
      triggerError("Please enter your full home address.");
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
    if (activeAppForSelected) {
      triggerError(
        `You already have a ${activeAppForSelected.status.toLowerCase()} application for this trade. A new application under the same category is only allowed if your previous application was rejected.`,
        true
      );
      return;
    }
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
        district,
        district_state_pin: district ? `${district}, Manipur` : permanentAddress.trim(),
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
      qc.invalidateQueries({ queryKey: ["adminMetrics"] });

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
            "You already have a pending or approved application for this course. A new submission is only allowed if a prior application was rejected.",
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

  const fieldCls =
    "w-full border border-[#D9C5A3] rounded-lg px-4 py-2.5 text-sm text-[#3B3028] bg-[#FAF6EE] focus:bg-white focus:ring-2 focus:ring-[#8B5E3C]/25 focus:border-[#8B5E3C] focus:outline-none placeholder-[#8D7B6D] transition";

  if (submittedData) {
    return (
      <CandidateWorkspaceShell
        title="Application submitted"
        subtitle="Your admission application is saved and queued for review."
        eyebrow="APPLICATION RECEIPT"
      >
        <div className="bg-white rounded-2xl shadow-2xs border border-[#5C6B45]/40 p-6 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-[#EEF2E7] text-[#5C6B45] rounded-full flex items-center justify-center mx-auto border border-[#5C6B45]/30">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-[#3E492D] bg-[#EEF2E7] px-3 py-1 rounded-full border border-[#5C6B45]/30">
              Application Received
            </span>
            <h2 className="font-serif text-3xl text-[#3B3028]">
              Your Application Has Been Submitted
            </h2>
            <p className="text-sm text-[#6E5D50] max-w-md mx-auto">
              Save your Registration Number below. You can use it anytime on the home page or dashboard to check your review status.
            </p>
          </div>

          {submittedData.registrationNo && (
            <div className="bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl p-5 space-y-2 max-w-md mx-auto">
              <div className="text-[11px] font-bold text-[#6E5D50] uppercase tracking-wider">
                Your Registration Number
              </div>
              <div className="flex items-center justify-center gap-2.5">
                <span className="font-mono text-lg sm:text-xl font-bold text-[#8B5E3C]">
                  {submittedData.registrationNo}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(submittedData.registrationNo!);
                    setCopiedReg(true);
                    setTimeout(() => setCopiedReg(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white border border-[#D9C5A3] rounded-md hover:bg-[#EDE3D2] cursor-pointer text-[#3B3028]"
                >
                  {copiedReg ? <Check className="w-3.5 h-3.5 text-[#5C6B45]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedReg ? "Copied" : "Copy"}
                </button>
              </div>
              <div className="text-xs text-[#6E5D50]">
                Trade: <strong className="text-[#3B3028]">{submittedData.tradeTitle}</strong>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] font-semibold px-6 py-3 rounded-lg text-sm transition"
            >
              <span>Go to My Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-[#FAF6EE] hover:bg-[#EDE3D2] border border-[#D9C5A3] text-[#3B3028] font-semibold px-6 py-3 rounded-lg text-sm transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </CandidateWorkspaceShell>
    );
  }

  return (
    <CandidateWorkspaceShell
      title="Application form"
      subtitle="Complete each section carefully to apply for training under MHHDC's PM VIKAS Scheme quota."
      eyebrow={`NEW APPLICATION • STEP ${step} OF ${STEPS.length}`}
    >
      <div className="bg-white rounded-2xl border border-[#D9C5A3] p-6 sm:p-8 shadow-2xs space-y-6">
        {/* Top Row & Helpdesk */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E9DEC8]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8B5E3C] block">
              STEP {step} OF {STEPS.length}
            </span>
            <h2 className="font-serif text-2xl text-[#3B3028]">{STEPS[step - 1].title}</h2>
          </div>
          <a
            href="tel:03852451495"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5C6B45] hover:underline"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Helpdesk: 0385-245 1495
          </a>
        </div>

        {/* Horizontal Circle-Number Stepper (Screenshot 7) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 items-center">
          {STEPS.map((s, idx) => {
            const done = step > s.id;
            const current = step === s.id;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition ${
                      done
                        ? "bg-[#5C6B45] text-[#F5EFE3]"
                        : current
                        ? "bg-[#8B5E3C] text-[#F5EFE3]"
                        : "bg-[#FAF6EE] text-[#6E5D50] border border-[#D9C5A3]"
                    }`}
                  >
                    {done ? "✓" : s.id}
                  </span>
                  <span
                    className={`text-xs truncate hidden sm:inline ${
                      current
                        ? "font-bold text-[#3B3028]"
                        : done
                        ? "font-semibold text-[#5C6B45]"
                        : "text-[#6E5D50]"
                    }`}
                  >
                    {s.short}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`hidden sm:block flex-1 h-[1px] ${done ? "bg-[#5C6B45]" : "bg-[#D9C5A3]"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Pop-out Alert Modal */}
        {showErrorModal && error && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="apply-alert-title"
            className="fixed inset-0 z-50 bg-[#2A211B]/70 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="bg-[#FAF6EE] rounded-2xl shadow-2xl border border-[#8B5E3C] max-w-md w-full p-6 sm:p-7 space-y-5 text-center">
              <div className="w-14 h-14 rounded-full bg-[#FDF2EE] border border-[#8B5E3C]/40 text-[#8B5E3C] flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 id="apply-alert-title" className="font-serif text-2xl text-[#3B3028]">
                  {isDuplicateError ? "Already Applied for This Trade" : "Please Check Your Form"}
                </h3>
                <p className="text-sm text-[#6E5D50] leading-relaxed">{error}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2 justify-center">
                {isDuplicateError && (
                  <>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#3B3028] hover:bg-[#2A211B] text-[#F5EFE3] text-sm font-semibold transition"
                    >
                      View My Applications
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setShowErrorModal(false);
                        goToStep(1);
                      }}
                      className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] text-[#3B3028] text-sm font-semibold transition cursor-pointer"
                    >
                      Choose Another Trade
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setShowErrorModal(false)}
                  className={`inline-flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                    isDuplicateError
                      ? "bg-[#EDE3D2] hover:bg-[#D9C5A3] text-[#3B3028]"
                      : "bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] w-full"
                  }`}
                >
                  OK, Got It
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inline Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-[#FDF2EE] border border-[#8B5E3C]/50 text-[#632919] text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* STEP 1: Course & Personal Details */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="course-select" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                Select Training Trade <span className="text-[#8B5E3C]">*</span>
              </label>
              <select
                id="course-select"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                disabled={isCategoriesLoading}
                className={fieldCls}
              >
                <option value="">-- Choose a trade --</option>
                {categories?.map((cat) => {
                  const activeApp = activeAppByCategory.get(cat.id);
                  const priorRejected = rejectedAppByCategory.get(cat.id);
                  const isDisabled = !cat.is_approval_open || Boolean(activeApp);
                  const suffix = activeApp
                    ? activeApp.status === "APPROVED"
                      ? " — Already Approved"
                      : " — Already Applied (Pending)"
                    : !cat.is_approval_open
                    ? " — Admissions Closed"
                    : priorRejected
                    ? " — Rejected Earlier (Reapply Open)"
                    : "";
                  return (
                    <option key={cat.id} value={cat.id} disabled={isDisabled}>
                      {cat.title} ({cat.code}){suffix}
                    </option>
                  );
                })}
              </select>

              {activeAppForSelected && (
                <div className="mt-2 p-3 rounded-lg bg-[#FDF2EE] border border-[#8B5E3C]/50 text-xs text-[#632919] flex flex-wrap items-center justify-between gap-2">
                  <span>
                    You already have a <strong>{activeAppForSelected.status.toLowerCase()}</strong> application for this category. Duplicate applications are not allowed while pending or approved.
                  </span>
                  <Link
                    to={`/applications/${activeAppForSelected.id}`}
                    className="font-bold text-[#8B5E3C] underline hover:text-[#734C30]"
                  >
                    View Application
                  </Link>
                </div>
              )}

              {rejectedAppForSelected && !activeAppForSelected && (
                <div className="mt-2 p-3 rounded-lg bg-[#EEF2E7] border border-[#5C6B45]/40 text-xs text-[#3E492D] flex items-start gap-2">
                  <RotateCcw className="w-4 h-4 text-[#5C6B45] shrink-0 mt-0.5" />
                  <div>
                    <strong>Reapplication Allowed:</strong> Your earlier application for this category was rejected. Submitting this form will create a new application for review.
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full-name" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Full Name <span className="text-[#8B5E3C]">*</span>
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="As written on Aadhaar / ID"
                  className={fieldCls}
                />
              </div>

              <div>
                <label htmlFor="guardian-name" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Father&apos;s / Guardian&apos;s Name <span className="text-[#8B5E3C]">*</span>
                </label>
                <input
                  id="guardian-name"
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Enter father or guardian name"
                  className={fieldCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="dob" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Date of Birth <span className="text-[#8B5E3C]">*</span>
                </label>
                <DateOfBirthPicker
                  id="dob"
                  value={dob}
                  onChange={setDob}
                  inputClassName={fieldCls}
                />
              </div>

              <div>
                <label htmlFor="gender" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Gender
                </label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={fieldCls}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="social-cat" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Social Category
                </label>
                <select
                  id="social-cat"
                  value={socialCategory}
                  onChange={(e) => setSocialCategory(e.target.value)}
                  className={fieldCls}
                >
                  <option value="ST">ST</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="OTHER">Minority / Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="apply-district" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  District (Manipur) <span className="text-[#8B5E3C]">*</span>
                </label>
                <select
                  id="apply-district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={fieldCls}
                >
                  <option value="">-- Select district --</option>
                  {MANIPUR_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="alt-mobile" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Contact / Alt Mobile
                </label>
                <input
                  id="alt-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  className={fieldCls}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={fieldCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                Full Home Address <span className="text-[#8B5E3C]">*</span>
              </label>
              <textarea
                id="address"
                rows={3}
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                placeholder="House No, Street/Village, Post Office, District, PIN Code"
                className={fieldCls}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E9DEC8]">
              <span className="text-xs text-[#6E5D50]">* Required fields</span>
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="inline-flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] font-semibold px-7 py-3 rounded-lg text-sm transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Education & Bank Details */}
        {step === 2 && (
          <div className="space-y-6">
            <p className="text-sm text-[#6E5D50]">
              Bank details are used to transfer your monthly training stipend directly to your account.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="qual" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Highest Education Level
                </label>
                <select
                  id="qual"
                  value={highestQual}
                  onChange={(e) => setHighestQual(e.target.value)}
                  className={fieldCls}
                >
                  <option value="BELOW_VIII">Below Class 8</option>
                  <option value="CLASS_VIII">Class 8 Pass</option>
                  <option value="CLASS_X">Class 10 Pass</option>
                  <option value="CLASS_XII">Class 12 Pass</option>
                  <option value="GRADUATE">Graduate or Higher</option>
                </select>
              </div>

              <div>
                <label htmlFor="exp" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Craft / Weaving Experience
                </label>
                <select
                  id="exp"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className={fieldCls}
                >
                  <option value="None">None / Beginner</option>
                  <option value="1-3 years">1 to 3 years</option>
                  <option value="3+ years">More than 3 years</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9DEC8] space-y-4">
              <h3 className="text-sm font-bold text-[#3B3028]">Govt-Issued ID Details (Optional)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gov-id-type" className="block text-sm font-medium text-[#3B3028] mb-1.5">
                    ID Type
                  </label>
                  <select
                    id="gov-id-type"
                    value={govIdType}
                    onChange={(e) => setGovIdType(e.target.value)}
                    className={fieldCls}
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Ration Card">Ration Card</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="gov-id-last4" className="block text-sm font-medium text-[#3B3028] mb-1.5">
                    Last 4 Digits of ID
                  </label>
                  <input
                    id="gov-id-last4"
                    type="text"
                    maxLength={4}
                    value={govIdLast4}
                    onChange={(e) => setGovIdLast4(e.target.value)}
                    placeholder="e.g. 4321"
                    className={fieldCls}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E9DEC8] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#3B3028]">Bank Account for Monthly Stipend (Optional)</h3>
                <p className="text-xs text-[#6E5D50]">Enter the details from your bank passbook.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bank-holder" className="block text-sm font-medium text-[#3B3028] mb-1.5">
                    Account Holder Name
                  </label>
                  <input
                    id="bank-holder"
                    type="text"
                    value={bankHolderName}
                    onChange={(e) => setBankHolderName(e.target.value)}
                    placeholder="Name as on bank passbook"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label htmlFor="bank-name" className="block text-sm font-medium text-[#3B3028] mb-1.5">
                    Bank &amp; Branch Name
                  </label>
                  <input
                    id="bank-name"
                    type="text"
                    value={bankNameBranch}
                    onChange={(e) => setBankNameBranch(e.target.value)}
                    placeholder="e.g. SBI Imphal Main Branch"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label htmlFor="acc-num" className="block text-sm font-medium text-[#3B3028] mb-1.5">
                    Account Number
                  </label>
                  <input
                    id="acc-num"
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter bank account number"
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label htmlFor="ifsc" className="block text-sm font-medium text-[#3B3028] mb-1.5">
                    IFSC Code
                  </label>
                  <input
                    id="ifsc"
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SBIN0000123"
                    className={`${fieldCls} uppercase`}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E9DEC8]">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-[#3B3028] bg-[#FAF6EE] hover:bg-[#EDE3D2] border border-[#D9C5A3] transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="inline-flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] font-semibold px-7 py-2.5 rounded-lg text-sm transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Upload Documents */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-sm text-[#6E5D50]">
              Upload clear photos or PDFs (strictly below 5 MB each). Items marked with * are mandatory.
            </p>

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

              <div className="p-4 rounded-xl border border-[#D9C5A3] bg-[#FAF6EE] space-y-3">
                <label htmlFor="other-doc-label" className="block text-sm font-semibold text-[#3B3028]">
                  Any Other Document (Optional)
                </label>
                <input
                  id="other-doc-label"
                  type="text"
                  value={otherDocLabel}
                  onChange={(e) => setOtherDocLabel(e.target.value)}
                  placeholder="Document name (e.g. Weaver ID Card)"
                  className="w-full border border-[#D9C5A3] rounded-lg px-4 py-2.5 text-sm bg-white focus:ring-2 focus:ring-[#8B5E3C]/25 focus:outline-none text-[#3B3028]"
                />
                <FileUploadField
                  label="Upload Other Document"
                  value={documents.other_doc}
                  onChange={(url) => setDocuments((prev) => ({ ...prev, other_doc: url }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E9DEC8]">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-[#3B3028] bg-[#FAF6EE] hover:bg-[#EDE3D2] border border-[#D9C5A3] transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNextFromStep3}
                className="inline-flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] font-semibold px-7 py-2.5 rounded-lg text-sm transition cursor-pointer"
              >
                <span>Review Application</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Submit */}
        {step === 4 && (
          <div className="space-y-6">
            <p className="text-sm text-[#6E5D50]">
              Please verify your information carefully before final submission.
            </p>

            {/* Summary Section 1 */}
            <div className="rounded-xl border border-[#D9C5A3] bg-[#FAF6EE]/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#D9C5A3] pb-2">
                <h3 className="font-bold text-sm text-[#3B3028]">Course &amp; Personal Details</h3>
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5E3C] hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#3B3028]">
                <div><span className="text-[#6E5D50]">Trade:</span> <strong>{selectedCategory?.title}</strong></div>
                <div><span className="text-[#6E5D50]">Full Name:</span> <strong>{fullName}</strong></div>
                <div><span className="text-[#6E5D50]">Father/Guardian:</span> <strong>{guardianName}</strong></div>
                <div><span className="text-[#6E5D50]">Date of Birth:</span> <strong>{dob}</strong></div>
                <div><span className="text-[#6E5D50]">Gender / Category:</span> <strong>{gender} / {socialCategory}</strong></div>
                <div><span className="text-[#6E5D50]">District:</span> <strong>{district}</strong></div>
                <div className="sm:col-span-2"><span className="text-[#6E5D50]">Address:</span> <strong>{permanentAddress}</strong></div>
              </div>
            </div>

            {/* Summary Section 2 */}
            <div className="rounded-xl border border-[#D9C5A3] bg-[#FAF6EE]/60 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#D9C5A3] pb-2">
                <h3 className="font-bold text-sm text-[#3B3028]">Education &amp; Bank Details</h3>
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5E3C] hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#3B3028]">
                <div><span className="text-[#6E5D50]">Education:</span> <strong>{highestQual}</strong></div>
                <div><span className="text-[#6E5D50]">Experience:</span> <strong>{experience}</strong></div>
                <div><span className="text-[#6E5D50]">ID:</span> <strong>{govIdType} {govIdLast4 ? `(****${govIdLast4})` : "(Not entered)"}</strong></div>
                <div><span className="text-[#6E5D50]">Bank Account:</span> <strong>{accountNumber || "Not entered"}</strong></div>
              </div>
            </div>

            {/* Summary Section 3 */}
            <div className="rounded-xl border border-[#D9C5A3] bg-[#FAF6EE]/60 p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-[#D9C5A3] pb-2">
                <h3 className="font-bold text-sm text-[#3B3028]">Uploaded Files</h3>
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5E3C] hover:underline cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <p className="text-sm text-[#3B3028]">
                {(photographUrl ? 1 : 0) + Object.values(documents).filter(Boolean).length} file(s) attached.
              </p>
            </div>

            {/* Declaration */}
            <label className="flex items-start gap-3 p-4 rounded-xl bg-[#EEF2E7] border border-[#5C6B45]/35 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmedReview}
                onChange={(e) => setConfirmedReview(e.target.checked)}
                className="mt-1 w-4 h-4 accent-[#5C6B45] rounded border-[#D9C5A3]"
              />
              <span className="text-sm text-[#3B3028] leading-relaxed">
                I confirm that all the information and documents provided above are true and correct to the best of my knowledge.
              </span>
            </label>

            <div className="flex items-center justify-between pt-4 border-t border-[#E9DEC8]">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-[#3B3028] bg-[#FAF6EE] hover:bg-[#EDE3D2] border border-[#D9C5A3] transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-[#5C6B45] hover:bg-[#4A5737] text-[#F5EFE3] font-semibold px-8 py-3 rounded-lg text-sm shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? "Submitting..." : "Submit Application"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </CandidateWorkspaceShell>
  );
}
