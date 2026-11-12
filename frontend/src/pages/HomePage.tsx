import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackApplication, getCategories } from "../api";
import { formatDate, statusBadgeColor } from "../lib/utils";
import type { TrackResponse } from "../types";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [regNo, setRegNo] = useState("");
  const [dob, setDob] = useState("");
  const [result, setResult] = useState<TrackResponse | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: getCategories });

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setSearching(true);
    try {
      const data = await trackApplication(regNo, dob);
      setResult(data);
    } catch {
      setError("Application not found. Please check your registration number and date of birth.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center py-12 px-6 bg-gradient-to-br from-primary-800 to-primary-600 rounded-2xl text-white shadow-xl">
        <h1 className="text-4xl font-extrabold mb-3">Handloom & Skilled Artisan Portal</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">
          Skill development and admission portal for traditional handloom, weaving, and crafts artisans.
          Direct government quota allocation across 9 registered job roles.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link to="/register" className="bg-accent-600 hover:bg-accent-700 text-white font-semibold px-6 py-2.5 rounded-lg text-base shadow transition">
            Apply Now
          </Link>
          <Link to="/categories" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-2.5 rounded-lg text-base backdrop-blur-sm transition">
            Explore Job Roles
          </Link>
        </div>
      </div>

      {/* Dual Mode: Public Quick-Track */}
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow border border-gray-100 p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🔍</span>
          <h2 className="text-xl font-bold text-gray-800">Public Quick-Track</h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">Track your application status directly without logging in</p>
        
        <form onSubmit={handleTrack} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
            <input
              value={regNo}
              onChange={e => setRegNo(e.target.value)}
              required
              placeholder="e.g. HND-2026-LLW-000142"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="w-full bg-primary-700 hover:bg-primary-800 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-60"
          >
            {searching ? "Searching..." : "Check Status"}
          </button>
        </form>

        {error && <div className="mt-4 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div>}

        {result && (
          <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200 space-y-3 text-sm">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-500">Applicant Name</span>
              <span className="font-semibold text-gray-900">{result.full_name}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-500">Job Role Category</span>
              <span className="font-medium text-gray-900">{result.category}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-gray-500">Submission Date</span>
              <span className="text-gray-700">{formatDate(result.submitted_at)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-500 font-medium">Status</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeColor(result.status)}`}>
                {result.status}
              </span>
            </div>
            {result.rejection_reason && (
              <div className="mt-3 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs leading-relaxed">
                <span className="font-bold">Rejection Reason:</span> {result.rejection_reason}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available Categories Section */}
      <div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Job Roles & Available Quotas</h2>
          <p className="text-gray-500 text-sm mt-1">Live seats monitored with atomic quota guard</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories?.map(cat => {
            const percent = Math.min(100, Math.round((cat.approved_count / cat.approval_limit) * 100));
            return (
              <div key={cat.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono font-semibold text-primary-800 bg-primary-50 px-2.5 py-1 rounded">
                    {cat.code}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.is_approval_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {cat.is_approval_open ? "Seats Available" : "Quota Full"}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-base mt-2 mb-4 leading-snug">{cat.title}</h3>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Approved: {cat.approved_count} / {cat.approval_limit}</span>
                    <span className="font-semibold">{percent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
