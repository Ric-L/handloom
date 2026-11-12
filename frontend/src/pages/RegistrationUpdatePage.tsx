import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApplicationDossier, updateApplicationDossier, getCategories } from "../api";
import FileUploadField from "../components/FileUploadField";
import {
  FileText,
  User,
  Shield,
  MapPin,
  GraduationCap,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Save,
  Check,
  Building2,
  Calendar,
  Layers,
  Phone,
  Mail,
  HelpCircle,
} from "lucide-react";

export default function RegistrationUpdatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: initialData, isLoading, error } = useQuery({
    queryKey: ["appDossier", id],
    queryFn: () => (id ? getApplicationDossier(id) : null),
    enabled: !!id,
  });

  const [form, setForm] = useState({
    category_id: 0,
    full_name: "",
    guardian_name: "",
    dob: "",
    gender: "MALE",
    mobile_number: "",
    alt_mobile: "",
    email: "",
    gov_id_type: "Aadhaar",
    gov_id_last4: "",
    social_category: "GENERAL",
    address_full: "",
    district_state_pin: "",
    emergency_name_rel: "",
    emergency_mobile: "",
    highest_qual: "CLASS_X",
    institution_name: "",
    occupation: "SELF_EMPLOYED",
    prev_training: "",
    has_prior_exp: "NO",
    prior_exp_details: "",
    has_disability: "NO",
    disability_spec: "",
    training_centre: "",
    training_batch: "Batch 2026-I",
    proposed_start: "2026-12-01",
    preferred_centre: "District Handloom Skill & Production Training Centre",
    training_mode: "CLASSROOM",
    bank_holder_name: "",
    bank_name_branch: "",
    account_number: "",
    ifsc_code: "",
    documents: {} as Record<string, string>,
    declaration_agreed: true,
    place: "Imphal",
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        category_id: initialData.category_id,
        full_name: initialData.full_name || "",
        guardian_name: initialData.guardian_name || "",
        dob: initialData.dob || "",
        gender: initialData.gender || "MALE",
        alt_mobile: initialData.alt_mobile || "",
        gov_id_type: initialData.gov_id_type || "Aadhaar",
        gov_id_last4: initialData.gov_id_last4 || "",
        social_category: initialData.social_category || "GENERAL",
        address_full: initialData.address_full || "",
        district_state_pin: initialData.district_state_pin || "",
        highest_qual: initialData.highest_qual || "CLASS_X",
        institution_name: initialData.institution_name || "",
        occupation: initialData.occupation || "SELF_EMPLOYED",
        prev_training: initialData.prev_training || "",
        preferred_centre: initialData.preferred_centre || "District Handloom Skill Centre",
        training_mode: initialData.training_mode || "CLASSROOM",
        bank_holder_name: initialData.bank_holder_name || "",
        bank_name_branch: initialData.bank_name_branch || "",
        account_number: initialData.account_number || "",
        ifsc_code: initialData.ifsc_code || "",
        documents: (initialData.documents as Record<string, string>) || {},
      }));
    }
  }, [initialData]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => (id ? updateApplicationDossier(id, data) : Promise.reject("No ID")),
    onSuccess: () => {
      setSuccessMsg("Enrolment form updated successfully!");
      setSubmitError(null);
      qc.invalidateQueries({ queryKey: ["myApplications"] });
      qc.invalidateQueries({ queryKey: ["appDossier", id] });
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    },
    onError: (err: any) => {
      setSubmitError(err.response?.data?.error || "Failed to update enrolment form.");
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Retrieving Enrolment Form Dossier...</p>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-3xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-rose-950">Record Not Found</h3>
        <p className="text-xs text-rose-700">The requested application could not be loaded or has been archived.</p>
        <Link to="/dashboard" className="inline-block mt-2 px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const handleDocChange = (docKey: string, url: string) => {
    setForm(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docKey]: url,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.declaration_agreed) {
      setSubmitError("Please confirm the Trainee Declaration & Consent to proceed.");
      return;
    }

    const payload = {
      ...form,
      category_id: Number(form.category_id),
      relevant_experience: form.has_prior_exp === "YES" ? form.prior_exp_details : "None",
    };

    updateMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Top Back Nav */}
      <div className="flex items-center justify-between pb-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-primary-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Applications
        </Link>
        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
          Enrolment ID: {initialData.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* Main Official Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden">
        {/* Form Official Header (Matches Trainee Enrolment Slip Header) */}
        <div className="p-6 sm:p-8 border-b border-slate-200 text-center space-y-1.5 bg-slate-50/70">
          <p className="text-xs font-extrabold tracking-widest text-primary-800 uppercase">
            SKILL DEVELOPMENT TRAINING
          </p>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            TRAINEE ADMISSION / ENROLMENT FORM
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">
            Directorate of Handloom & Skilled Artisan Development • Official Enrolment Dossier
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left text-xs border-t border-slate-200/80 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Training Centre:</span>
              <span className="font-bold text-slate-900 truncate">
                {form.preferred_centre}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <span className="text-slate-500 font-semibold">Batch No:</span>
              <span className="font-mono font-bold text-primary-900 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                {form.training_batch}
              </span>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="p-6 sm:p-8 space-y-8 divide-y divide-slate-200 text-xs text-slate-800">
          {/* SECTION 1. PERSONAL DETAILS */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-800 text-white font-black text-xs flex items-center justify-center">
                1
              </span>
              <h2 className="font-black text-slate-900 text-sm tracking-wide uppercase">
                PERSONAL DETAILS
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Full Name (as per ID proof) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Father's / Mother's / Guardian's Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.guardian_name}
                  onChange={e => setForm({ ...form, guardian_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Date of Birth (YYYY-MM-DD) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.dob}
                  onChange={e => setForm({ ...form, dob: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Gender</label>
                <div className="flex items-center gap-4 py-2">
                  {["MALE", "FEMALE", "OTHER"].map(g => (
                    <label key={g} className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={form.gender === g}
                        onChange={e => setForm({ ...form, gender: e.target.value })}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Alternate Contact Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={form.alt_mobile}
                  onChange={e => setForm({ ...form, alt_mobile: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email ID (if any)</label>
                <input
                  type="email"
                  placeholder="artisan@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Aadhaar / Government ID Type & Last 4 Digits
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={form.gov_id_type}
                    onChange={e => setForm({ ...form, gov_id_type: e.target.value })}
                    className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Pan Card">PAN Card</option>
                    <option value="Artisan Card">Artisan ID Card</option>
                  </select>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Last 4 (e.g. 7766)"
                    value={form.gov_id_last4}
                    onChange={e => setForm({ ...form, gov_id_last4: e.target.value })}
                    className="border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Social Category</label>
                <div className="flex flex-wrap items-center gap-3 py-1.5">
                  {["GENERAL", "OBC", "SC", "ST", "OTHER"].map(cat => (
                    <label key={cat} className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input
                        type="radio"
                        name="social_category"
                        value={cat}
                        checked={form.social_category === cat}
                        onChange={e => setForm({ ...form, social_category: e.target.value })}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  Full Residential Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.address_full}
                  onChange={e => setForm({ ...form, address_full: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  District / State / PIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Imphal West, Manipur - 795001"
                  value={form.district_state_pin}
                  onChange={e => setForm({ ...form, district_state_pin: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2. EDUCATIONAL & OTHER DETAILS */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-800 text-white font-black text-xs flex items-center justify-center">
                2
              </span>
              <h2 className="font-black text-slate-900 text-sm tracking-wide uppercase">
                EDUCATIONAL & OTHER DETAILS
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Highest Educational Qualification</label>
                <select
                  value={form.highest_qual}
                  onChange={e => setForm({ ...form, highest_qual: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                >
                  <option value="NO_FORMAL">No formal schooling</option>
                  <option value="CLASS_V">Class V</option>
                  <option value="CLASS_VIII">Class VIII</option>
                  <option value="CLASS_X">Class X (Matric)</option>
                  <option value="CLASS_XII">Class XII (Higher Secondary)</option>
                  <option value="GRADUATE">Graduate / Diploma</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">School / Institution Name</label>
                <input
                  type="text"
                  placeholder="Institution or Board name"
                  value={form.institution_name}
                  onChange={e => setForm({ ...form, institution_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Current Occupation</label>
                <select
                  value={form.occupation}
                  onChange={e => setForm({ ...form, occupation: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                >
                  <option value="STUDENT">Student</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                  <option value="EMPLOYED">Employed</option>
                  <option value="SELF_EMPLOYED">Self-employed Artisan</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Previous Skill Training (if any)</label>
                <input
                  type="text"
                  placeholder="Details of any prior courses"
                  value={form.prev_training}
                  onChange={e => setForm({ ...form, prev_training: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">
                  Prior Weaving / Handloom Experience?
                </label>
                <div className="flex items-center gap-4 py-1 mb-2">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="has_prior_exp"
                      value="NO"
                      checked={form.has_prior_exp === "NO"}
                      onChange={() => setForm({ ...form, has_prior_exp: "NO" })}
                      className="text-primary-600"
                    />
                    <span>No</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                    <input
                      type="radio"
                      name="has_prior_exp"
                      value="YES"
                      checked={form.has_prior_exp === "YES"}
                      onChange={() => setForm({ ...form, has_prior_exp: "YES" })}
                      className="text-primary-600"
                    />
                    <span>Yes - specify experience</span>
                  </label>
                </div>
                {form.has_prior_exp === "YES" && (
                  <input
                    type="text"
                    placeholder="e.g. 2 years traditional loin loom weaving at home"
                    value={form.prior_exp_details}
                    onChange={e => setForm({ ...form, prior_exp_details: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3. COURSE / TRAINING DETAILS */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-800 text-white font-black text-xs flex items-center justify-center">
                3
              </span>
              <h2 className="font-black text-slate-900 text-sm tracking-wide uppercase">
                COURSE / TRAINING DETAILS
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Course Applied For</label>
                <select
                  value={form.category_id}
                  onChange={e => setForm({ ...form, category_id: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-extrabold text-slate-900 bg-slate-50"
                >
                  {categories?.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Preferred Training Centre</label>
                <input
                  type="text"
                  value={form.preferred_centre}
                  onChange={e => setForm({ ...form, preferred_centre: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Training Mode</label>
                <div className="flex items-center gap-4 py-2">
                  {[
                    { id: "CLASSROOM", label: "Classroom" },
                    { id: "PRACTICAL_WORKSHOP", label: "Practical / Workshop" },
                  ].map(m => (
                    <label key={m.id} className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                      <input
                        type="radio"
                        name="training_mode"
                        value={m.id}
                        checked={form.training_mode === m.id}
                        onChange={e => setForm({ ...form, training_mode: e.target.value })}
                        className="text-primary-600"
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4. BANK DETAILS (DBT STIPEND) */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-800 text-white font-black text-xs flex items-center justify-center">
                4
              </span>
              <div>
                <h2 className="font-black text-slate-900 text-sm tracking-wide uppercase">
                  BANK DETAILS (ONLY IF REQUIRED BY THE SCHEME)
                </h2>
                <p className="text-[11px] text-slate-500">
                  Required for Direct Benefit Transfer (DBT) monthly stipend disbursement
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Name of Account Holder</label>
                <input
                  type="text"
                  placeholder="As per bank passbook"
                  value={form.bank_holder_name}
                  onChange={e => setForm({ ...form, bank_holder_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank Name & Branch</label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India, Imphal"
                  value={form.bank_name_branch}
                  onChange={e => setForm({ ...form, bank_name_branch: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="Bank account number"
                  value={form.account_number}
                  onChange={e => setForm({ ...form, account_number: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. SBIN0001234"
                  value={form.ifsc_code}
                  onChange={e => setForm({ ...form, ifsc_code: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>

            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 italic">
              Notice: Do not write your ATM PIN, UPI PIN, CVV, or banking password on this form. Submit bank proof only if officially required.
            </p>
          </div>

          {/* SECTION 5. DOCUMENT CHECKLIST & UPLOADS */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-800 text-white font-black text-xs flex items-center justify-center">
                5
              </span>
              <div>
                <h2 className="font-black text-slate-900 text-sm tracking-wide uppercase">
                  DOCUMENT CHECKLIST & UPLOADS
                </h2>
                <p className="text-[11px] text-slate-500">
                  Upload scanned copies (JPG, PNG, PDF up to 5MB each)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FileUploadField
                label="Recent Passport-Size Photograph"
                value={form.documents["photograph"]}
                onChange={url => handleDocChange("photograph", url)}
                required
              />

              <FileUploadField
                label="Identity Proof (Aadhaar / Voter ID)"
                value={form.documents["id_proof"]}
                onChange={url => handleDocChange("id_proof", url)}
                required
              />

              <FileUploadField
                label="Address Proof (Domicile / Utility Bill)"
                value={form.documents["address_proof"]}
                onChange={url => handleDocChange("address_proof", url)}
              />

              <FileUploadField
                label="Educational Certificate"
                value={form.documents["edu_cert"]}
                onChange={url => handleDocChange("edu_cert", url)}
              />

              <FileUploadField
                label="Bank Passbook Copy (for DBT)"
                value={form.documents["bank_passbook"]}
                onChange={url => handleDocChange("bank_passbook", url)}
              />

              <FileUploadField
                label="Category / Disability Certificate (if applicable)"
                value={form.documents["category_disability_cert"]}
                onChange={url => handleDocChange("category_disability_cert", url)}
              />
            </div>
          </div>

          {/* SECTION 6. TRAINEE DECLARATION & CONSENT */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-800 text-white font-black text-xs flex items-center justify-center">
                6
              </span>
              <h2 className="font-black text-slate-900 text-sm tracking-wide uppercase">
                TRAINEE DECLARATION & CONSENT
              </h2>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-[11px] leading-relaxed text-slate-600">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={form.declaration_agreed}
                  onChange={e => setForm({ ...form, declaration_agreed: e.target.checked })}
                  className="mt-0.5 rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span className="font-medium text-slate-800">
                  I declare that the information provided in this form is true and complete to the best of my knowledge. I understand that admission is subject to eligibility, document verification, and applicable scheme guidelines. I agree to follow the training centre's rules, attend sessions regularly, participate in assessments, and provide additional information where legitimately required for training administration or scheme reporting. I understand that my information will be used for admission, training, assessment, certification, and related official reporting, and will be handled according to applicable requirements.
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Place of Submission:</label>
                  <input
                    type="text"
                    value={form.place}
                    onChange={e => setForm({ ...form, place: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-medium"
                  />
                </div>
                <div>
                  <FileUploadField
                    label="Trainee's Signature / Thumb Impression"
                    value={form.documents["signature_thumb"]}
                    onChange={url => handleDocChange("signature_thumb", url)}
                    buttonText="Upload Signature"
                    compact
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Footer Action */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Cancel Changes
          </Link>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary-700 hover:bg-primary-800 active:translate-y-px text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-700/20 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? "Saving Updates..." : "Save & Update Enrolment Dossier"}
          </button>
        </div>
      </form>
    </div>
  );
}
