import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";

export default function LoginPage() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login({ mobile_number: mobile, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "SUPER_ADMIN" || data.user.role === "REVIEWER_ADMIN") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch {
      setError("Invalid mobile number or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white rounded-xl shadow border border-gray-100 p-8">
      <div className="text-center mb-6">
        <span className="text-3xl">🧵</span>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Candidate Login</h1>
        <p className="text-sm text-gray-500 mt-1">Access your application dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          <input
            type="tel"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            required
            placeholder="e.g. 9876543210"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center text-gray-500">
        New applicant?{" "}
        <Link to="/register" className="text-primary-700 hover:underline font-medium">
          Create an account
        </Link>
      </p>
    </div>
  );
}
