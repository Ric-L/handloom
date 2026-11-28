import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { register } from "../api";
import { DEFAULT_COUNTRY, DEFAULT_STATE, MANIPUR_DISTRICTS } from "../lib/constants";
import DateOfBirthPicker from "../components/DateOfBirthPicker";
import {
  User,
  Users,
  Smartphone,
  Mail,
  Lock,
  MapPin,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  PhoneCall,
} from "lucide-react";

type RegisterField =
  | "full_name"
  | "father_name"
  | "mother_name"
  | "dob"
  | "mobile_number"
  | "email"
  | "password"
  | "country"
  | "state"
  | "district"
  | "address_line1"
  | "address_line2"
  | "address_line3";

type FieldErrors = Partial<Record<RegisterField, string>>;

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    father_name: "",
    mother_name: "",
    dob: "",
    mobile_number: "",
    email: "",
    password: "",
    country: DEFAULT_COUNTRY,
    state: DEFAULT_STATE,
    district: "",
    address_line1: "",
    address_line2: "",
    address_line3: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (key: RegisterField, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateClient = (): boolean => {
    const errs: FieldErrors = {};

    if (form.full_name.trim().length < 2) {
      errs.full_name = "Full name is required (at least 2 characters).";
    }
    if (form.father_name.trim().length < 2) {
      errs.father_name = "Father's name is required (at least 2 characters).";
    }
    if (form.mother_name.trim().length < 2) {
      errs.mother_name = "Mother's name is required (at least 2 characters).";
    }
    if (!form.dob || !/^\d{4}-\d{2}-\d{2}$/.test(form.dob)) {
      errs.dob = "Please select your Date of Birth.";
    }
    if (!/^\d{10}$/.test(form.mobile_number.trim())) {
      errs.mobile_number = "Phone number must be a valid 10-digit mobile number.";
    }
    if (!form.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (form.password.length < 8 || form.password.length > 72) {
      errs.password = "Password must be between 8 and 72 characters long.";
    }
    if (!form.country.trim()) {
      errs.country = "Country is required.";
    }
    if (!form.state.trim()) {
      errs.state = "State is required.";
    }
    if (!form.district || !(MANIPUR_DISTRICTS as readonly string[]).includes(form.district)) {
      errs.district = "Please select a district of Manipur.";
    }
    if (!form.address_line1.trim()) {
      errs.address_line1 = "Address Line 1 is required.";
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateClient()) {
      setFormError("Please review and correct the highlighted fields below.");
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        full_name: form.full_name.trim(),
        father_name: form.father_name.trim(),
        mother_name: form.mother_name.trim(),
        dob: form.dob,
        mobile_number: form.mobile_number.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        country: form.country.trim() || DEFAULT_COUNTRY,
        state: form.state.trim() || DEFAULT_STATE,
        district: form.district,
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || undefined,
        address_line3: form.address_line3.trim() || undefined,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      const redirectParam = searchParams.get("redirect");
      if (redirectParam) {
        navigate(decodeURIComponent(redirectParam));
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const serverData = err.response?.data;
      if (serverData?.errors && typeof serverData.errors === "object") {
        setFieldErrors(serverData.errors as FieldErrors);
      }
      setFormError(
        serverData?.error ||
          "Could not create your account. Please verify your information or sign in if already registered."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (hasErr?: string, withLeftIcon = true) =>
    `w-full ${withLeftIcon ? "pl-10" : "px-3.5"} pr-3.5 py-2.5 text-sm bg-[#FAF6EE] border rounded-lg focus:bg-white focus:outline-none focus:ring-2 text-[#3B3028] placeholder-[#8D7B6D] transition ${
      hasErr
        ? "border-[#A9442A] focus:ring-[#A9442A]/30"
        : "border-[#D9C5A3] focus:border-[#8B5E3C] focus:ring-[#8B5E3C]/25"
    }`;

  const redirectQuery = searchParams.get("redirect");

  return (
    <div className="max-w-5xl mx-auto my-6 sm:my-10">
      <div className="bg-white border border-[#D9C5A3] rounded-2xl overflow-hidden shadow-sm">
        {/* Top Editorial Banner */}
        <div className="bg-[#3B3028] text-[#F5EFE3] px-6 sm:px-10 py-7 border-b border-[#D9C5A3]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#FAF6EE] px-2.5 py-1.5 rounded-xl border border-[#D9C5A3] shrink-0">
              <img
                src="/mhhdcl-logo.png"
                alt="Manipur Handloom & Handicrafts Development Corporation Ltd."
                className="h-14 w-auto object-contain"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D9C5A3] block">
                CANDIDATE REGISTRATION • MHHDC ADMISSIONS PORTAL
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl text-[#F5EFE3] leading-tight mt-0.5">
                Create Applicant Account
              </h1>
              <p className="text-xs sm:text-sm text-[#D9C5A3]/90 mt-1 max-w-xl">
                Register with Manipur Handloom &amp; Handicrafts Development Corporation Ltd. to apply for skill training under our PM VIKAS Scheme quota.
              </p>
            </div>
          </div>

          <div className="text-xs text-[#D9C5A3] flex items-center gap-2 shrink-0 bg-[#2A211B] px-3.5 py-2.5 rounded-lg border border-[#D9C5A3]/20">
            <PhoneCall className="w-4 h-4 text-[#D9C5A3] shrink-0" />
            <div>
              <div className="text-[10px] uppercase tracking-wider">Helpdesk</div>
              <div className="font-bold text-[#F5EFE3]">0385-245 1495</div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-10 space-y-8">
          {formError && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-[#FDF2EE] border border-[#8B5E3C]/50 text-[#632919] text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
              <div>{formError}</div>
            </div>
          )}

          {/* Section 1: Applicant & Family Identity */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E9DEC8] pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45] flex items-center gap-2">
                <Users className="w-4 h-4" />
                1. Applicant &amp; Family Details
              </h2>
              <span className="text-[11px] text-[#6E5D50]">* Required fields</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-fullname" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Full Name <span className="text-[#8B5E3C]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7B6D]" />
                  <input
                    id="reg-fullname"
                    name="full_name"
                    autoComplete="name"
                    type="text"
                    value={form.full_name}
                    onChange={(e) => updateField("full_name", e.target.value)}
                    required
                    aria-invalid={!!fieldErrors.full_name}
                    placeholder="Enter full name as per Aadhaar / official ID"
                    className={inputClass(fieldErrors.full_name)}
                  />
                </div>
                {fieldErrors.full_name && (
                  <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.full_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-dob" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Date of Birth <span className="text-[#8B5E3C]">*</span>
                </label>
                <DateOfBirthPicker
                  id="reg-dob"
                  value={form.dob}
                  onChange={(val) => updateField("dob", val)}
                  required
                  inputClassName={inputClass(fieldErrors.dob, false)}
                />
                {fieldErrors.dob && (
                  <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.dob}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-father" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Father&apos;s Name <span className="text-[#8B5E3C]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7B6D]" />
                  <input
                    id="reg-father"
                    type="text"
                    value={form.father_name}
                    onChange={(e) => updateField("father_name", e.target.value)}
                    required
                    aria-invalid={!!fieldErrors.father_name}
                    placeholder="Enter father's full name"
                    className={inputClass(fieldErrors.father_name)}
                  />
                </div>
                {fieldErrors.father_name && (
                  <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.father_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-mother" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Mother&apos;s Name <span className="text-[#8B5E3C]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7B6D]" />
                  <input
                    id="reg-mother"
                    type="text"
                    value={form.mother_name}
                    onChange={(e) => updateField("mother_name", e.target.value)}
                    required
                    aria-invalid={!!fieldErrors.mother_name}
                    placeholder="Enter mother's full name"
                    className={inputClass(fieldErrors.mother_name)}
                  />
                </div>
                {fieldErrors.mother_name && (
                  <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.mother_name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Credentials */}
          <div className="space-y-4">
            <div className="border-b border-[#E9DEC8] pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45] flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                2. Contact &amp; Account Security
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-mobile" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Phone Number <span className="text-[#8B5E3C]">*</span>
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7B6D]" />
                  <input
                    id="reg-mobile"
                    name="mobile_number"
                    autoComplete="tel"
                    type="tel"
                    inputMode="numeric"
                    value={form.mobile_number}
                    onChange={(e) =>
                      updateField("mobile_number", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    required
                    maxLength={10}
                    aria-invalid={!!fieldErrors.mobile_number}
                    placeholder="10-digit mobile number"
                    className={inputClass(fieldErrors.mobile_number)}
                  />
                </div>
                {fieldErrors.mobile_number ? (
                  <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.mobile_number}</p>
                ) : (
                  <p className="text-xs text-[#6E5D50] mt-1">Used to sign in and track status.</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-email" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Email Address <span className="text-[#8B5E3C]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7B6D]" />
                  <input
                    id="reg-email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    required
                    aria-invalid={!!fieldErrors.email}
                    placeholder="name@example.com"
                    className={inputClass(fieldErrors.email)}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                Password <span className="text-[#8B5E3C]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7B6D]" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                  minLength={8}
                  aria-invalid={!!fieldErrors.password}
                  placeholder="At least 8 characters"
                  className={`${inputClass(fieldErrors.password)} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6E5D50] hover:text-[#3B3028] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password ? (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.password}</p>
              ) : (
                <p className="text-xs text-[#6E5D50] mt-1 flex items-center gap-1.5">
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${
                      form.password.length >= 8 ? "text-[#5C6B45]" : "text-[#D9C5A3]"
                    }`}
                  />
                  Must be between 8 and 72 characters
                </p>
              )}
            </div>
          </div>

          {/* Section 3: Permanent Address */}
          <div className="space-y-4">
            <div className="border-b border-[#E9DEC8] pb-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#5C6B45] flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                3. Residential Address
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="reg-country" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Country <span className="text-[#8B5E3C]">*</span>
                </label>
                <input
                  id="reg-country"
                  type="text"
                  value={form.country}
                  onChange={(e) => updateField("country", e.target.value)}
                  required
                  aria-invalid={!!fieldErrors.country}
                  className={inputClass(fieldErrors.country, false)}
                />
                {fieldErrors.country && (
                  <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.country}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-state" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  State <span className="text-[#8B5E3C]">*</span>
                </label>
                <input
                  id="reg-state"
                  type="text"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  required
                  aria-invalid={!!fieldErrors.state}
                  className={inputClass(fieldErrors.state, false)}
                />
                {fieldErrors.state && (
                  <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.state}</p>
                )}
              </div>

              <div>
                <label htmlFor="reg-district" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  District (Manipur) <span className="text-[#8B5E3C]">*</span>
                </label>
                <select
                  id="reg-district"
                  value={form.district}
                  onChange={(e) => updateField("district", e.target.value)}
                  required
                  aria-invalid={!!fieldErrors.district}
                  className={inputClass(fieldErrors.district, false)}
                >
                  <option value="">-- Select District --</option>
                  {MANIPUR_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {fieldErrors.district && (
                  <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.district}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="reg-addr1" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                Address Line 1 <span className="text-[#8B5E3C]">*</span>
              </label>
              <input
                id="reg-addr1"
                type="text"
                value={form.address_line1}
                onChange={(e) => updateField("address_line1", e.target.value)}
                required
                aria-invalid={!!fieldErrors.address_line1}
                placeholder="House No., Leikai / Street / Village / Town"
                className={inputClass(fieldErrors.address_line1, false)}
              />
              {fieldErrors.address_line1 && (
                <p className="text-xs font-medium text-[#A9442A] mt-1">{fieldErrors.address_line1}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-addr2" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Address Line 2 <span className="text-xs font-normal text-[#6E5D50]">(Optional)</span>
                </label>
                <input
                  id="reg-addr2"
                  type="text"
                  value={form.address_line2}
                  onChange={(e) => updateField("address_line2", e.target.value)}
                  placeholder="Ward, Sub-division, or Post Office"
                  className={inputClass(fieldErrors.address_line2, false)}
                />
              </div>

              <div>
                <label htmlFor="reg-addr3" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                  Address Line 3 <span className="text-xs font-normal text-[#6E5D50]">(Optional)</span>
                </label>
                <input
                  id="reg-addr3"
                  type="text"
                  value={form.address_line3}
                  onChange={(e) => updateField("address_line3", e.target.value)}
                  placeholder="Landmark or PIN Code (e.g. 795001)"
                  className={inputClass(fieldErrors.address_line3, false)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E9DEC8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-[#6E5D50]">
              Already have an account?{" "}
              <Link
                to={redirectQuery ? `/login?redirect=${encodeURIComponent(redirectQuery)}` : "/login"}
                className="font-bold text-[#8B5E3C] hover:text-[#734C30] hover:underline"
              >
                Sign In Here
              </Link>
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] font-semibold rounded-lg text-sm transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{loading ? "Creating Account..." : "Create Account & Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
