import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api";

export default function RegisterPage() {
  const [form, setForm] = useState({ mobile_number: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch {
      setError("Registration failed. Mobile number may already be registered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow border border-gray-100 p-8">
      <div className="text-center mb-6">
        <span className="text-3xl">🪡</span>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Create Artisan Account</h1>
        <p className="text-sm text-gray-500 mt-1">Register once to apply for certified training</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
          <input
            type="tel"
            value={form.mobile_number}
            onChange={e => setForm(f => ({ ...f, mobile_number: e.target.value }))}
            required
            placeholder="10-digit primary mobile"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Optional)</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="name@example.com"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
        >
          {loading ? "Creating Account..." : "Register"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-primary-700 hover:underline font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
}

