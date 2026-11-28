import { useState } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminLogin } from "../../api";
import { Lock, Smartphone, AlertTriangle, KeyRound, Clock } from "lucide-react";

const adminLoginSchema = z.object({
  mobile_number: z.string().regex(/^\d{10}$/, "Administrator mobile number must be exactly 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isSessionExpired = searchParams.get("reason") === "session_expired";

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || "/admin";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const response = await adminLogin(data);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate(from, { replace: true });
    } catch (err: any) {
      if (!err.response) {
        setServerError(
          "Unable to reach the admission server. Please verify the backend service is running and API/CORS settings allow this origin."
        );
      } else {
        setServerError(
          err.response?.data?.error ||
          "Authentication failed. Verify your administrator credentials and privileges."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = (mobile: string, password: string) => {
    setValue("mobile_number", mobile);
    setValue("password", password);
    setServerError(null);
  };

  return (
    <div className="min-h-screen bg-[#2A211B] text-[#F5EFE3] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <div className="bg-[#FAF6EE] px-4 py-2.5 rounded-2xl flex items-center justify-center shadow-xl border border-[#D9C5A3]">
            <img
              src="/mhhdcl-logo.png"
              alt="Manipur Handloom & Handicrafts Development Corporation Ltd."
              className="h-16 w-auto object-contain"
            />
          </div>
        </div>
        <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.18em] text-[#D9C5A3]">
          STAFF ACCESS
        </span>
        <h1 className="mt-1 font-serif text-3xl tracking-tight text-[#F5EFE3]">
          MHHDC Admin Portal
        </h1>
        <p className="mt-1 text-xs text-[#D9C5A3]/90 font-medium">
          Manipur Handloom &amp; Handicrafts Development Corporation Ltd.
        </p>
        <p className="mt-1.5 text-xs text-[#D9C5A3]/70">
          Restricted access for Reviewer Administrators and Super Administrators only.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#FAF6EE] text-[#3B3028] py-8 px-6 shadow-2xl rounded-2xl border border-[#D9C5A3] sm:px-10">
          {isSessionExpired && (
            <div className="mb-6 p-4 rounded-xl bg-[#EFE6D5] border border-[#D9C5A3] text-[#3B3028] text-xs flex items-start gap-3">
              <Clock className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                <span className="font-bold text-[#8B5E3C]">Security Logout:</span> Administrator session automatically expired after 3 minutes of inactivity in compliance with portal security guidelines. Please sign in again.
              </div>
            </div>
          )}

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-[#FDF2EE] border border-[#8B5E3C]/50 text-[#632919] text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#8B5E3C] shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{serverError}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-semibold text-[#3B3028] uppercase tracking-wider mb-1.5">
                Admin Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8D7B6D]">
                  <Smartphone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  {...register("mobile_number")}
                  placeholder="10-digit registered number"
                  maxLength={10}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${errors.mobile_number ? "border-[#A9442A] ring-1 ring-[#A9442A]" : "border-[#D9C5A3]"
                    } rounded-lg text-sm text-[#3B3028] placeholder-[#8D7B6D] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] transition`}
                />
              </div>
              {errors.mobile_number && (
                <p className="mt-1.5 text-xs text-[#A9442A] font-medium">{errors.mobile_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#3B3028] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8D7B6D]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register("password")}
                  placeholder="Enter administrator password"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-white border ${errors.password ? "border-[#A9442A] ring-1 ring-[#A9442A]" : "border-[#D9C5A3]"
                    } rounded-lg text-sm text-[#3B3028] placeholder-[#8D7B6D] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]/30 focus:border-[#8B5E3C] transition`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-[#A9442A] font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-[#F5EFE3] bg-[#8B5E3C] hover:bg-[#734C30] focus:outline-none focus:ring-2 focus:ring-[#8B5E3C] shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              {isSubmitting ? "Authenticating Session..." : "Secure Admin Sign In"}
            </button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-[#D9C5A3]">
            <p className="text-xs text-[#6E5D50] text-center mb-3">Pre-seeded Test Credentials:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFillDemo("9999999999", "Admin@12345")}
                className="bg-white hover:bg-[#EDE3D2] border border-[#D9C5A3] rounded-lg p-2.5 text-left transition cursor-pointer"
              >
                <div className="font-semibold text-[#8B5E3C]">Super Admin</div>
                <div className="font-mono text-[11px] text-[#6E5D50]">9999999999</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("8888888888", "Reviewer@12345")}
                className="bg-white hover:bg-[#EDE3D2] border border-[#D9C5A3] rounded-lg p-2.5 text-left transition cursor-pointer"
              >
                <div className="font-semibold text-[#5C6B45]">Reviewer Admin</div>
                <div className="font-mono text-[11px] text-[#6E5D50]">8888888888</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs">
          <Link to="/" className="text-[#D9C5A3] hover:text-[#F5EFE3] transition">
            ← Return to Public Candidate Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
