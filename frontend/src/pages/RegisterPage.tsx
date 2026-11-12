import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api";
import { Smartphone, Lock, Mail, ArrowRight, AlertCircle, Shield } from "lucide-react";

export default function RegisterPage() {
  const [form, setForm] = useState({ mobile_number: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(form.mobile_number.trim())) {
      setError("Mobile number must be exactly 10 digits.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
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
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Registration failed. This mobile number may already be registered."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-primary-100 text-primary-800 rounded-2xl flex items-center justify-center mx-auto text-2xl shadow-inner">
          🪡
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Artisan Account</h1>
        <p className="text-xs text-slate-500">Register once to apply for certified handloom trades</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Primary Mobile Number *
          </label>
          <div className="relative">
            <Smartphone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="tel"
              value={form.mobile_number}
              onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))}
              required
              maxLength={10}
              placeholder="10-digit mobile number"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900"
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            This number will be used for DBT stipend notifications and admission tracking.
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address (Optional)
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="name@example.com"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Create Account Password *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={8}
              placeholder="Minimum 8 characters"
              className="w-full pl-10 pr-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium text-slate-900"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-700 hover:bg-primary-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-primary-900/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
        >
          {loading ? "Registering Candidate Account..." : "Complete Registration"} <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="pt-4 border-t border-slate-100 text-center space-y-3">
        <p className="text-xs text-slate-500">
          Already registered?{" "}
          <Link to="/login" className="font-bold text-primary-700 hover:underline">
            Sign In Here
          </Link>
        </p>

        <div className="pt-2">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 transition"
          >
            <Shield className="w-3 h-3 text-slate-400" /> Administrative Moderation Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
