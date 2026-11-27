import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { login } from "../api";
import { Smartphone, Lock, ArrowRight, AlertCircle, Clock, Eye, EyeOff, PhoneCall } from "lucide-react";

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const isSessionExpired = searchParams.get("reason") === "session_expired";

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
    <div className="max-w-md mx-auto my-8 sm:my-12 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
      <div className="text-center space-y-2">
        <img
          src="/mhhdcl-logo.png"
          alt="Manipur Handloom &amp; Handicrafts Development Corporation Ltd."
          className="h-20 w-auto mx-auto object-contain"
        />
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Citizen Sign In</h1>
        <p className="text-sm text-slate-600">
          Sign in with your registered mobile number to apply or check your application status.
        </p>
      </div>

      {isSessionExpired && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">You were signed out for safety</p>
            <p className="text-xs mt-0.5 text-amber-800">
              For your security, sessions close automatically after 3 minutes of inactivity. Please sign in again to continue.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-mobile" className="block text-sm font-bold text-slate-800 mb-1.5">
            10-Digit Mobile Number
          </label>
          <div className="relative">
            <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="login-mobile"
              type="tel"
              inputMode="numeric"
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
              required
              maxLength={10}
              placeholder="Enter 10-digit mobile number"
              className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none text-slate-900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-bold text-slate-800 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="w-full pl-10 pr-11 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none text-slate-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{loading ? "Signing in..." : "Sign In"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-5 border-t border-slate-200 text-center space-y-3">
        <p className="text-sm text-slate-600">
          Don&apos;t have an account yet?{" "}
          <Link
            to={redirectQuery ? `/register?redirect=${encodeURIComponent(redirectQuery)}` : "/register"}
            className="font-bold text-blue-700 hover:underline"
          >
            Register as a New Applicant
          </Link>
        </p>

        <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
          Need help? Call Toll-Free: <strong>1800 200 7890</strong>
        </p>
      </div>
    </div>
  );
}
