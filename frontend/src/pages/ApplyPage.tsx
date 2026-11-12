import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, submitApplication } from "../api";
import {
  FileText,
  User,
  Shield,
  MapPin,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function ApplyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const initialCategory = params.get("category") || "";

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const [form, setForm] = useState({
    category_id: initialCategory,
    full_name: "",
    guardian_name: "",
    dob: "",
    gender: "MALE",
    alt_mobile: "",
    gov_id_type: "Aadhaar",
    gov_id_last4: "",
    social_category: "GENERAL",
    address_full: "",
    district_state_pin: "",
    highest_qual: "CLASS_X",
    institution_name: "",
    occupation: "UNEMPLOYED",
    prev_training: "",
    preferred_centre: "",
    training_mode: "CLASSROOM",
    bank_holder_name: "",
    bank_name_branch: "",
    account_number: "",
    ifsc_code: "",
  });

  useEffect(() => {
    if (initialCategory && !form.category_id) {
      setForm(f => ({ ...f, category_id: initialCategory }));
    }
  }, [initialCategory]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successSubmitted, setSuccessSubmitted] = useState<{
    tradeTitle: string;
    tradeCode: string;
    submittedAt: string;
  } | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.category_id) {
      setError("Please select an artisan craft training trade.");
      return;
    }

    if (!form.dob) {
      setError("Please provide a valid Date of Birth.");
      return;
    }

    if (!/^\d{4}$/.test(form.gov_id_last4.trim())) {
      setError("Government ID Last 4 Digits must be exactly 4 numeric digits.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        category_id: Number(form.category_id),
      };

      const res = await submitApplication(payload);

      // Invalidate queries so My Applications will instantly show the newly saved record
      qc.invalidateQueries({ queryKey: ["myApplications"] });

      const selectedCat = categories?.find(c => c.id === Number(form.category_id));
      setSuccessSubmitted({
        tradeTitle: selectedCat?.title || "Artisan Training Programme",
        tradeCode: selectedCat?.code || "SKILL",
        submittedAt: res.submitted_at || new Date().toISOString(),
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

  // Success Confirmation Screen (Strictly hiding reference/application numbers)
  if (successSubmitted) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl shadow-xl border border-primary-200 p-8 sm:p-10 text-center space-y-6">
        <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-primary-700/10">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            Submission Confirmed
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Application Saved Successfully!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Your admission enrolment has been securely persisted in the national database.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left space-y-2.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Applied Trade:</span>
            <span className="font-bold text-slate-900 text-sm">
              {successSubmitted.tradeCode} — {successSubmitted.tradeTitle}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Candidate Name:</span>
            <span className="font-semibold text-slate-900">{form.full_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Initial Status:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              PENDING VERIFICATION
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Your application is permanently linked to your registered mobile number. You can review your admission status at any time from your candidate dashboard.
        </p>

        <div className="flex justify-center gap-3 pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-md transition"
          >
            Go to My Applications <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs transition"
          >
            Browse Other Trades
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Form Header */}
      <div className="bg-gradient-to-r from-slate-900 to-primary-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-200 text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Government Accredited Trainee Admission
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Handloom & Artisan Enrolment Form
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
          Please fill in your authentic personal, residential, and DBT stipend bank account details.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* Main Application Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
        {/* Section 1: Trade Selection */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-primary-700" />
            <span>1. Select Artisan Trade</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Accredited Craft Trade *
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium bg-slate-50/50"
            >
              <option value="">-- Choose Artisan Trade --</option>
              {categories
                ?.filter(c => c.is_approval_open)
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Only trades currently accepting new trainee batches are shown.
            </span>
          </div>
        </div>

        {/* Section 2: Personal & Guardian Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-primary-700" />
            <span>2. Candidate Personal Profile</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name (as per Govt ID) *
              </label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                placeholder="Candidate Full Name"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Father's / Mother's / Guardian's Name *
              </label>
              <input
                type="text"
                name="guardian_name"
                value={form.guardian_name}
                onChange={handleChange}
                required
                placeholder="Parent or Guardian Name"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Gender *
              </label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Social Category *
              </label>
              <select
                name="social_category"
                value={form.social_category}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              >
                <option value="GENERAL">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Identity Verification */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-primary-700" />
            <span>3. Identity Verification (Privacy Compliant)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Government ID Type *
              </label>
              <select
                name="gov_id_type"
                value={form.gov_id_type}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              >
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="VoterID">Voter Identity Card</option>
                <option value="ArtisanCard">Artisan Identity Card (Pehchan)</option>
                <option value="PAN">PAN Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Last 4 Digits of Government ID *
              </label>
              <input
                type="text"
                name="gov_id_last4"
                value={form.gov_id_last4}
                onChange={handleChange}
                maxLength={4}
                pattern="\d{4}"
                placeholder="e.g. 5678"
                required
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                In compliance with data protection standards, only the last 4 digits are recorded.
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Address & Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-primary-700" />
            <span>4. Residential Address</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Permanent Address *
            </label>
            <textarea
              name="address_full"
              value={form.address_full}
              onChange={handleChange}
              required
              rows={2}
              placeholder="House/Street/Village details..."
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                District, State & PIN Code *
              </label>
              <input
                type="text"
                name="district_state_pin"
                value={form.district_state_pin}
                onChange={handleChange}
                placeholder="e.g. Imphal West, Manipur - 795001"
                required
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alternate Mobile Number (Optional)
              </label>
              <input
                type="tel"
                name="alt_mobile"
                value={form.alt_mobile}
                onChange={handleChange}
                maxLength={10}
                placeholder="10-digit mobile number"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Academic & Training Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <GraduationCap className="w-4 h-4 text-primary-700" />
            <span>5. Academic & Handloom Background</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Highest Qualification *
              </label>
              <select
                name="highest_qual"
                value={form.highest_qual}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              >
                <option value="NO_FORMAL">No Formal Education</option>
                <option value="CLASS_V">Class V</option>
                <option value="CLASS_VIII">Class VIII</option>
                <option value="CLASS_X">Class X</option>
                <option value="CLASS_XII">Class XII</option>
                <option value="GRADUATE">Graduate</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Occupation *
              </label>
              <select
                name="occupation"
                value={form.occupation}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              >
                <option value="UNEMPLOYED">Unemployed</option>
                <option value="STUDENT">Student</option>
                <option value="SELF_EMPLOYED">Artisan / Weaver</option>
                <option value="EMPLOYED">Employed</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Training Mode
              </label>
              <select
                name="training_mode"
                value={form.training_mode}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              >
                <option value="CLASSROOM">Classroom & Workshop</option>
                <option value="PRACTICAL_WORKSHOP">Practical Workshop Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 6: Direct Benefit Transfer (DBT) Bank Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm pb-2 border-b border-slate-100">
            <CreditCard className="w-4 h-4 text-primary-700" />
            <span>6. DBT Monthly Stipend Bank Account</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Account Holder Name
              </label>
              <input
                type="text"
                name="bank_holder_name"
                value={form.bank_holder_name}
                onChange={handleChange}
                placeholder="Name as registered with bank"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bank Name & Branch
              </label>
              <input
                type="text"
                name="bank_name_branch"
                value={form.bank_name_branch}
                onChange={handleChange}
                placeholder="e.g. SBI, Main Branch"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bank Account Number
              </label>
              <input
                type="text"
                name="account_number"
                value={form.account_number}
                onChange={handleChange}
                placeholder="Account number for DBT stipend"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Bank IFSC Code
              </label>
              <input
                type="text"
                name="ifsc_code"
                value={form.ifsc_code}
                onChange={handleChange}
                placeholder="e.g. SBIN0001234"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            By clicking Submit, I declare that all information furnished is authentic.
          </p>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 shadow-md shadow-primary-900/20 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Submitting & Saving Application..." : "Submit Enrolment Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
