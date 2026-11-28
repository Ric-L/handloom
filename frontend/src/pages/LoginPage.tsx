import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { login } from "../api";
import {
  Smartphone,
  Lock,
  ArrowRight,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const isSessionExpired = searchParams.get("reason") === "session_expired";

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ mobile?: string; password?: string }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const errs: { mobile?: string; password?: string } = {};
    if (!/^\d{10}$/.test(mobile.trim())) {
      errs.mobile = "Please enter a valid 10-digit registered phone number.";
    }
    if (!password) {
      errs.password = "Please enter your password.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const data = await login({ mobile_number: mobile.trim(), password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      const redirectParam = searchParams.get("redirect");
      if (data.user.role === "SUPER_ADMIN" || data.user.role === "REVIEWER_ADMIN") {
        navigate("/admin");
      } else if (redirectParam) {
        navigate(decodeURIComponent(redirectParam));
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.error;
      setError(
        serverMsg ||
          "The mobile number or password you entered is incorrect. Please check and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const redirectQuery = searchParams.get("redirect");

  return (
    <div className="max-w-5xl mx-auto my-6 sm:my-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#FAF6EE] border border-[#D9C5A3] rounded-2xl overflow-hidden shadow-sm">
        {/* Left Editorial Context Panel */}
        <div className="lg:col-span-5 bg-[#3B3028] text-[#F5EFE3] p-8 sm:p-10 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 bg-[#FAF6EE] px-3 py-2 rounded-xl border border-[#D9C5A3]">
              <img
                src="/mhhdcl-logo.png"
                alt="Manipur Handloom & Handicrafts Development Corporation Ltd."
                className="h-12 w-auto object-contain"
              />
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
                  MHHDCL Portal
                </div>
                <div className="text-xs font-bold text-[#3B3028] leading-snug max-w-[165px]">
                  Manipur Handloom &amp; Handicrafts Development Corp. Ltd.
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#D9C5A3]">
                CANDIDATE PORTAL
              </p>
              <h1 className="font-serif text-3xl sm:text-4xl leading-[1.15] text-[#F5EFE3]">
                Welcome back to{" "}
                <span className="italic text-[#D9C5A3] block mt-0.5">your application desk.</span>
              </h1>
              <p className="text-sm text-[#D9C5A3]/90 leading-relaxed pt-1">
                Sign in with your registered mobile number to submit an admission form under MHHDC&apos;s PM VIKAS Scheme quota, track status, or download your enrolment slip.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#D9C5A3]/20 space-y-3 text-xs text-[#D9C5A3]">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#D9C5A3] shrink-0 mt-0.5" />
              <span>Protected session with automatic 3-minute inactivity sign-out.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <PhoneCall className="w-4 h-4 text-[#D9C5A3] shrink-0" />
              <span>
                Imphal Office Helpline: <strong className="text-[#F5EFE3]">0385-245 1495</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Sign-In Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 bg-white flex flex-col justify-center space-y-6">
          <div className="space-y-1.5 border-b border-[#E9DEC8] pb-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
              APPLICANT SIGN IN
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#3B3028]">
              Sign in to your account
            </h2>
            <p className="text-sm text-[#6E5D50]">
              Enter the 10-digit phone number and password you used during registration.
            </p>
          </div>

          {isSessionExpired && (
            <div className="p-4 rounded-xl bg-[#F5EFE3] border border-[#D9C5A3] text-[#3B3028] text-sm flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">You were signed out due to inactivity</p>
                <p className="text-xs mt-0.5 text-[#6E5D50]">
                  For your security, sessions close automatically after 3 minutes of inactivity. Please sign in again to continue.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="p-4 rounded-xl bg-[#FDF2EE] border border-[#8B5E3C]/50 text-[#632919] text-sm flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="login-mobile" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                Phone Number <span className="text-[#8B5E3C]">*</span>
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7B6D]" />
                <input
                  id="login-mobile"
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                    if (fieldErrors.mobile) setFieldErrors((p) => ({ ...p, mobile: undefined }));
                  }}
                  required
                  maxLength={10}
                  aria-invalid={!!fieldErrors.mobile}
                  aria-describedby={fieldErrors.mobile ? "login-mobile-error" : undefined}
                  placeholder="Enter 10-digit phone number"
                  className={`w-full pl-10 pr-4 py-3 text-sm bg-[#FAF6EE] border rounded-lg focus:bg-white focus:outline-none focus:ring-2 text-[#3B3028] placeholder-[#8D7B6D] transition ${
                    fieldErrors.mobile
                      ? "border-[#A9442A] focus:ring-[#A9442A]/30"
                      : "border-[#D9C5A3] focus:border-[#8B5E3C] focus:ring-[#8B5E3C]/25"
                  }`}
                />
              </div>
              {fieldErrors.mobile && (
                <p id="login-mobile-error" className="text-xs font-medium text-[#A9442A] mt-1.5">
                  {fieldErrors.mobile}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-[#3B3028] mb-1.5">
                Password <span className="text-[#8B5E3C]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8D7B6D]" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  required
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-11 py-3 text-sm bg-[#FAF6EE] border rounded-lg focus:bg-white focus:outline-none focus:ring-2 text-[#3B3028] placeholder-[#8D7B6D] transition ${
                    fieldErrors.password
                      ? "border-[#A9442A] focus:ring-[#A9442A]/30"
                      : "border-[#D9C5A3] focus:border-[#8B5E3C] focus:ring-[#8B5E3C]/25"
                  }`}
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
              {fieldErrors.password && (
                <p id="login-password-error" className="text-xs font-medium text-[#A9442A] mt-1.5">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] font-semibold py-3.5 rounded-lg text-sm transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{loading ? "Signing in..." : "Sign In to Candidate Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-5 border-t border-[#E9DEC8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
            <span className="text-[#6E5D50]">New to the portal?</span>
            <Link
              to={redirectQuery ? `/register?redirect=${encodeURIComponent(redirectQuery)}` : "/register"}
              className="font-bold text-[#8B5E3C] hover:text-[#734C30] inline-flex items-center gap-1 hover:underline"
            >
              <span>Create Applicant Account</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
