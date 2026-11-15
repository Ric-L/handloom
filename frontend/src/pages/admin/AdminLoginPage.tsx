import { useState } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { adminLogin } from "../../api";
import { ShieldCheck, Lock, Smartphone, AlertTriangle, KeyRound, Clock } from "lucide-react";

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

  const [serverError, setServerError] = useState<string>(
    (location.state as any)?.error || ""
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      mobile_number: "",
      password: "",
    },
  });

  const onSubmit = async (values: AdminLoginFormValues) => {
    setServerError("");
    try {
      const data = await adminLogin(values);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/admin", { replace: true });
    } catch (err: any) {
      if (err.response?.status === 403) {
        setServerError("Access denied: Applicant accounts are not permitted in the Admin Portal.");
      } else if (err.response?.status === 401) {
        setServerError("Invalid administrator credentials. Please check your mobile number and password.");
      } else {
        setServerError(err.response?.data?.error || "Authentication failed. Please verify credentials or contact system admin.");
      }
    }
  };

  const handleFillDemo = (mobile: string, pass: string) => {
    setValue("mobile_number", mobile);
    setValue("password", pass);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-primary-800 border-2 border-primary-500 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-900/40">
            <ShieldCheck className="w-10 h-10 text-primary-300" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-white">
          Admin Moderation Portal
        </h2>
        <p className="mt-1 text-center text-xs text-primary-400 font-medium uppercase tracking-wider">
          Handloom & Skilled Artisan Development Initiative
        </p>
        <p className="mt-2 text-center text-xs text-gray-400">
          Restricted access for Reviewer Administrators and Super Administrators only.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-gray-800 sm:px-10">
          {isSessionExpired && (
            <div className="mb-6 p-4 rounded-xl bg-amber-950/80 border border-amber-600/80 text-amber-200 text-xs flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                <span className="font-bold text-amber-300">Security Logout:</span> Administrator session automatically expired after 3 minutes of inactivity in compliance with National Cyber Security Guidelines. Please sign in again.
              </div>
            </div>
          )}

          {serverError && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">{serverError}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Admin Mobile Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Smartphone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  {...register("mobile_number")}
                  placeholder="10-digit registered number"
                  maxLength={10}
                  className={`block w-full pl-10 pr-3 py-2.5 bg-gray-950/90 border ${
                    errors.mobile_number ? "border-red-500 ring-1 ring-red-500" : "border-gray-700"
                  } rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition`}
                />
              </div>
              {errors.mobile_number && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.mobile_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  {...register("password")}
                  placeholder="Enter administrator password"
                  className={`block w-full pl-10 pr-3 py-2.5 bg-gray-950/90 border ${
                    errors.password ? "border-red-500 ring-1 ring-red-500" : "border-gray-700"
                  } rounded-xl text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary-700 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-gray-900 shadow-lg shadow-primary-900/50 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              {isSubmitting ? "Authenticating Session..." : "Secure Admin Sign In"}
            </button>
          </form>

          {/* Quick Demo Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-gray-800">
            <p className="text-xs text-gray-400 text-center mb-3">Pre-seeded Test Credentials:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleFillDemo("9999999999", "Admin@12345")}
                className="bg-gray-800/80 hover:bg-gray-800 border border-gray-700 rounded-lg p-2 text-left transition text-gray-300 hover:text-white"
              >
                <div className="font-semibold text-primary-400">Super Admin</div>
                <div className="font-mono text-[11px] text-gray-400">9999999999</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo("8888888888", "Reviewer@12345")}
                className="bg-gray-800/80 hover:bg-gray-800 border border-gray-700 rounded-lg p-2 text-left transition text-gray-300 hover:text-white"
              >
                <div className="font-semibold text-amber-400">Reviewer Admin</div>
                <div className="font-mono text-[11px] text-gray-400">8888888888</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-500">
          <Link to="/" className="text-primary-400 hover:text-primary-300 transition">
            ← Return to Public Candidate Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

