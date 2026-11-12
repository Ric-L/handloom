import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackApplication, getCategories } from "../api";
import { formatDate, statusBadgeColor } from "../lib/utils";
import type { TrackResponse } from "../types";
import { Link } from "react-router-dom";
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  Banknote,
  Award,
  Clock,
} from "lucide-react";

export default function HomePage() {
  const [mobileNumber, setMobileNumber] = useState("");
  const [dob, setDob] = useState("");
  const [result, setResult] = useState<TrackResponse | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setSearching(true);
    try {
      const data = await trackApplication(mobileNumber.trim(), dob);
      setResult(data);
    } catch {
      setError(
        "No matching application record found. Please verify your 10-digit registered mobile number and Date of Birth."
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-950 via-primary-900 to-slate-900 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-primary-800/40">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-primary-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            National Handloom & Skilled Artisan Development Initiative
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Preserving Heritage. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-primary-200 to-emerald-300">
              Mastering Modern Craft.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-primary-100/90 leading-relaxed max-w-2xl font-normal">
            Direct government admission into accredited skill training programmes across traditional handloom,
            jacquard weaving, loin loom, artisan embroidery, and crafts. Government-recognized NSQF certification and DBT stipend support.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/apply"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl text-sm shadow-lg shadow-amber-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Apply for Admission <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl text-sm backdrop-blur-sm border border-white/15 transition"
            >
              <Layers className="w-4 h-4" /> Explore Accredited Trades
            </Link>
          </div>
        </div>

        {/* Decorative loom motif background */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none text-9xl select-none hidden lg:block pr-8 pb-4">
          🧵
        </div>
      </section>

      {/* 2. Public Application Tracking Widget */}
      <section className="max-w-2xl mx-auto -mt-6 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-800 flex items-center justify-center font-bold">
              <Search className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Track Application Status</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Candidates can check admission verification status using registered mobile number and Date of Birth.
          </p>

          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Mobile Number
                </label>
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-primary-500 focus:outline-none transition font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {searching ? "Searching National Database..." : "Verify Application Status"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl font-medium leading-relaxed">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Candidate Name:</span>
                <span className="font-bold text-slate-900 text-sm">{result.full_name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Applied Trade:</span>
                <span className="font-semibold text-slate-900">
                  {result.category_code ? `${result.category_code} - ` : ""}
                  {result.category}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Submission Timestamp:</span>
                <span className="text-slate-700 font-mono">{formatDate(result.submitted_at)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider">Current Admission Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadgeColor(result.status)}`}>
                  {result.status}
                </span>
              </div>
              {result.rejection_reason && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                  <span className="font-bold">Official Remarks:</span> {result.rejection_reason}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Trade Showcase (Strictly hiding numerical quotas for regular users) */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            Accredited Artisan Courses
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Select Your Craft Training Trade
          </h2>
          <p className="text-xs text-slate-500">
            Certified curricula structured by the Textile Sector Skill Council (TSC)
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isCategoriesLoading ? (
            <div className="col-span-3 text-center py-12 text-slate-400">Loading accredited trades...</div>
          ) : (
            categories?.map(cat => (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {cat.code}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        cat.is_approval_open
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {cat.is_approval_open ? "🟢 Admissions Open" : "🔴 Batch Full"}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug mb-3">{cat.title}</h3>

                  <div className="space-y-2 text-xs text-slate-500 mb-5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary-700" />
                      <span>Duration: 6 Months (Full-Time Hands-on)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-primary-700" />
                      <span>Certification: NSQF Aligned Govt. Credential</span>
                    </div>
                  </div>
                </div>

                <div>
                  {cat.is_approval_open ? (
                    <Link
                      to={`/apply?category=${cat.id}`}
                      className="block w-full text-center bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 rounded-xl text-xs transition"
                    >
                      Apply for this Trade
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl text-xs cursor-not-allowed border border-slate-200"
                    >
                      Admissions Locked (Batch Full)
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. Trainee Benefits / Institutional Features */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Artisan Trainee Entitlements</h2>
          <p className="text-xs text-slate-400">
            Comprehensive institutional backing provided under the National Handloom Development Programme
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Direct DBT Stipend</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Monthly sustenance allowance disbursed directly into verified trainee bank accounts via Aadhaar DBT.
            </p>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Master Weaver Mentorship</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rigorous practical training conducted by National Award-winning weavers on modern loom equipment.
            </p>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">National Skill Credential</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Official assessment and qualification certification recognized across public textile cooperatives and export houses.
            </p>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-100">Cooperative Market Access</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Direct linkage with Handloom Weavers' Cooperative Societies, state emporiums, and e-commerce platforms.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
