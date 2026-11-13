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
  GraduationCap,
  Banknote,
  Award,
  Layers,
  FileText,
  Video,
  Clock,
  ChevronRight,
} from "lucide-react";
import { NotificationCentre } from "../components/NotificationCentre";
import { ProjectMediaSection } from "../components/ProjectMediaSection";
import { ProjectTeamSection } from "../components/ProjectTeamSection";

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
      {/* 1. Hero Section: Rich High-Contrast Royal Blue Gradient with Clear CTAs */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-blue-800/40">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/60 backdrop-blur-md border border-blue-400/30 text-xs font-bold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            National Handloom & Skilled Artisan Development Initiative
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-sm">
            Preserving Heritage. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-200 to-blue-300">
              Mastering Modern Craft.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-3xl font-normal drop-shadow">
            Direct government admission into accredited skill training programmes across traditional handloom,
            jacquard weaving, loin loom, artisan embroidery, and crafts. Government-recognized NSQF certification and DBT stipend support.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-2xl sm:text-3xl font-black text-amber-300 block">3,020</span>
              <span className="text-xs text-blue-100 font-medium">Sanctioned Seats</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-2xl sm:text-3xl font-black text-sky-300 block">9 Trades</span>
              <span className="text-xs text-blue-100 font-medium">Accredited Curricula</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-2xl sm:text-3xl font-black text-blue-300 block">100% DBT</span>
              <span className="text-xs text-blue-100 font-medium">Monthly Stipend</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <span className="text-2xl sm:text-3xl font-black text-purple-300 block">NSQF-4</span>
              <span className="text-xs text-blue-100 font-medium">Govt. Certification</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-4">
            <a
              href="#trades"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black px-7 py-3.5 rounded-xl text-sm shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              Apply for a Trade <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              to="/categories"
              className="inline-flex items-center gap-2 bg-blue-800/60 hover:bg-blue-700/80 text-white font-bold px-6 py-3.5 rounded-xl text-sm backdrop-blur-md border border-blue-400/30 transition shadow-sm"
            >
              <Layers className="w-4 h-4 text-sky-300" /> Explore All Trades
            </Link>
            <a
              href="#notification-centre"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3.5 rounded-xl text-sm backdrop-blur-sm border border-white/15 transition"
            >
              <FileText className="w-4 h-4 text-blue-300" /> Notices & Circulars
            </a>
            <a
              href="#project-media"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3.5 rounded-xl text-sm backdrop-blur-sm border border-white/15 transition"
            >
              <Video className="w-4 h-4 text-sky-300" /> Watch Documentaries
            </a>
          </div>
        </div>

        {/* Decorative loom motif */}
        <div className="absolute right-6 bottom-4 opacity-15 pointer-events-none text-9xl select-none hidden lg:block">
          🧵
        </div>
      </section>

      {/* 2. Public Application Tracking Widget */}
      <section className="max-w-2xl mx-auto -mt-8 relative z-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200">
              <Search className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Track Application & Admission Status</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Candidates can verify admission scrutiny status using registered mobile number and Date of Birth.
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
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition font-medium bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition font-medium bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={searching}
              className="w-full bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-blue-900/10 disabled:opacity-50 cursor-pointer"
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
            <div className="mt-6 p-5 bg-blue-50/50 rounded-2xl border border-blue-200 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                <span className="text-slate-500 font-medium">Candidate Name:</span>
                <span className="font-bold text-slate-900 text-sm">{result.full_name}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                <span className="text-slate-500 font-medium">Applied Trade:</span>
                <span className="font-semibold text-slate-900">
                  {result.category_code ? `${result.category_code} - ` : ""}
                  {result.category}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
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

      {/* 3. Original Flow: Select Your Craft Training Trade & Apply */}
      <section id="trades" className="scroll-mt-24 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200 mb-3">
              <Layers className="w-3.5 h-3.5 text-blue-700" />
              Accredited Artisan Courses
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Select Your Craft Training Trade
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Certified curricula structured by the Textile Sector Skill Council (TSC). Maximum 1 application per artisan per category. Select a trade below to apply directly.
            </p>
          </div>

          <Link
            to="/categories"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl border border-blue-200 transition shrink-0 self-start md:self-auto"
          >
            <span>Full Curriculum & Syllabus</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isCategoriesLoading ? (
            <div className="col-span-full text-center py-12 text-slate-400 font-medium">
              Loading accredited artisan trades...
            </div>
          ) : (
            categories?.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-3xl border border-slate-200/90 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
                      {cat.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        cat.is_approval_open
                          ? "bg-blue-50 text-blue-800 border border-blue-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          cat.is_approval_open ? "bg-blue-600 animate-pulse" : "bg-rose-500"
                        }`}
                      />
                      {cat.is_approval_open ? "Admissions Open" : "Batch Full"}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug mb-3 group-hover:text-blue-700 transition">
                    {cat.title}
                  </h3>

                  <div className="space-y-2.5 text-xs text-slate-600 py-3 border-y border-slate-100 mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>Duration: <strong>6 Months (Full-Time Hands-on)</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>Certification: <strong>NSQF Aligned Govt. Credential</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>Allowance: <strong>Monthly DBT Stipend Backed</strong></span>
                    </div>
                  </div>
                </div>

                <div>
                  {cat.is_approval_open ? (
                    <Link
                      to={`/apply?category=${cat.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-extrabold py-3 rounded-xl text-xs shadow-md shadow-blue-900/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                      <span>Apply for this Trade</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-xl text-xs cursor-not-allowed border border-slate-200"
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

      {/* 4. Notification Centre (Notices & Updates Tabs with Authentic PDF Download) */}
      <NotificationCentre />

      {/* 5. Project Media Section (Videos, Documentaries & Live Photographs) */}
      <ProjectMediaSection />

      {/* 6. Project Team Section (Officers, Instructors & Leadership Directory) */}
      <ProjectTeamSection />

      {/* 7. Trainee Benefits / Institutional Features */}
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 border border-blue-900/50 shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-900/80 px-3 py-1 rounded-full border border-blue-500/30">
            Government Backing
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Artisan Trainee Entitlements</h2>
          <p className="text-xs text-blue-200">
            Comprehensive institutional backing provided under the National Handloom Development Programme
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2 hover:border-amber-400/40 transition">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Direct DBT Stipend</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Monthly sustenance allowance disbursed directly into verified trainee bank accounts via Aadhaar DBT.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2 hover:border-blue-400/40 transition">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Master Weaver Mentorship</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Rigorous practical training conducted by National Award-winning weavers on modern loom equipment.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2 hover:border-sky-400/40 transition">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">National Skill Credential</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Official assessment and qualification certification recognized across public textile cooperatives and export houses.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 space-y-2 hover:border-purple-400/40 transition">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white">Cooperative Market Access</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Direct linkage with Handloom Weavers' Cooperative Societies, state emporiums, and e-commerce platforms.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
