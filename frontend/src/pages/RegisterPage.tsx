import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { register } from "../api";
import { Smartphone, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ mobile_number: "", password: "", email: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(form.mobile_number.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (form.password.length < 8) {
      setError("Please choose a password that is at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        mobile_number: form.mobile_number.trim(),
        password: form.password,
        email: form.email.trim() || undefined,
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
      setError(
        err.response?.data?.error ||
          "Could not create account. This mobile number may already be registered—try signing in instead."
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
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Citizen Account</h1>
        <p className="text-sm text-slate-600">
          Register once with your mobile number to apply for training admissions conducted by Manipur Handloom &amp; Handicrafts Development Corporation Ltd. under its allocated PM VIKAS Scheme quota.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reg-mobile" className="block text-sm font-bold text-slate-800 mb-1.5">
            Mobile Number <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="reg-mobile"
              type="tel"
              inputMode="numeric"
              value={form.mobile_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, mobile_number: e.target.value.replace(/\D/g, "").slice(0, 10) }))
              }
              required
              maxLength={10}
              placeholder="Enter 10-digit mobile number"
              className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none text-slate-900"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            You will use this number to sign in and track your application.
          </p>
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-bold text-slate-800 mb-1.5">
            Email Address <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="e.g., name@example.com"
              className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none text-slate-900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-bold text-slate-800 mb-1.5">
            Create a Password <span className="text-rose-600">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
              placeholder="At least 8 characters"
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
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle2 className={`w-3.5 h-3.5 ${form.password.length >= 8 ? "text-emerald-600" : "text-slate-300"}`} />
            Must be at least 8 characters
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{loading ? "Creating Account..." : "Create Account & Continue"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-5 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to={redirectQuery ? `/login?redirect=${encodeURIComponent(redirectQuery)}` : "/login"}
            className="font-bold text-blue-700 hover:underline"
          >
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}
