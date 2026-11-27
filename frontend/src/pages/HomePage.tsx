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
  GraduationCap,
  Banknote,
  Award,
  Layers,
  Video,
  Clock,
  BookOpen,
  Store,
  Users,
  Palette,
  Briefcase,
  Landmark,
} from "lucide-react";
import { ProjectMediaSection } from "../components/ProjectMediaSection";

export default function HomePage() {
  const [identifier, setIdentifier] = useState("");
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
      const data = await trackApplication(identifier.trim(), dob);
      setResult(data);
    } catch {
      setError(
        "No matching application record found. Please verify your Registration ID or 10-digit mobile number along with your Date of Birth."
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="w-full flex flex-col font-sans">
      {/* 1. Full-Width Hero Section - Enriched with PM VIKAS Framework */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white shadow-2xl border-b border-blue-900/40">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl 2xl:max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-5">
              {/* Animated "PM Vikas Scheme" Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-900/70 backdrop-blur-md border border-amber-400/50 shadow-lg shadow-amber-500/15 animate-pulse-glow">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                </span>
                <span className="text-xs sm:text-sm font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-300 bg-clip-text text-transparent animate-text-shimmer">
                  PM Vikas Scheme
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                <span className="text-blue-200 text-xs font-semibold hidden sm:inline">
                  Pradhan Mantri Virasat Ka Samvardhan
                </span>
                <span className="text-slate-400 text-xs hidden xl:inline">•</span>
                <span className="text-amber-300/90 text-[11px] font-bold hidden xl:inline">
                  Ministry of Minority Affairs (MoMA)
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-[1.12] text-white drop-shadow-sm">
                Preserving Heritage. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-sky-200 to-blue-300">
                  Mastering Modern Craft.
                </span>
              </h1>

              {/* Comprehensive PM VIKAS Description */}
              <p className="text-xs sm:text-sm lg:text-base text-slate-200 leading-relaxed font-normal drop-shadow">
                The <strong>Pradhan Mantri Virasat Ka Samvardhan (PM VIKAS)</strong> is a unified Central Sector initiative by the <strong>Ministry of Minority Affairs (MoMA)</strong> in convergence with the <strong>Skill India Mission</strong>. It empowers traditional master artisans, handloom weavers, craftspersons, women, and youth by integrating heritage craftsmanship with modern technical training, certified qualifications, and sustainable livelihood ecosystems.
              </p>

              {/* 5 Converged Erstwhile Schemes Box */}
              <div className="bg-slate-900/75 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Convergence of 5 Flagship Schemes (पंच-उपयोजनाएं)
                    </span>
                  </div>
                  <span className="text-[10px] text-sky-200 font-semibold px-2 py-0.5 rounded-full bg-blue-900/80 border border-blue-400/30">
                    Central Sector Scheme
                  </span>
                </div>

                {/* 5 Schemes Mini Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <div className="bg-white/5 hover:bg-white/10 rounded-xl p-2.5 border border-white/10 transition">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Palette className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span className="text-xs font-bold text-white">USTTAD (उस्ताद)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Upgrading traditional craft skills, master weaver mentorship, design innovation & GI tagging.
                    </p>
                  </div>

                  <div className="bg-white/5 hover:bg-white/10 rounded-xl p-2.5 border border-white/10 transition">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Briefcase className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                      <span className="text-xs font-bold text-white">Seekho Aur Kamao</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Learn & Earn: Demand-driven technical skilling with wage & self-employment placement linkages.
                    </p>
                  </div>

                  <div className="bg-white/5 hover:bg-white/10 rounded-xl p-2.5 border border-white/10 transition">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Landmark className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                      <span className="text-xs font-bold text-white">Hamari Dharohar</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Preserving, curating, and promoting India’s rich craft traditions and cultural heritage.
                    </p>
                  </div>

                  <div className="bg-white/5 hover:bg-white/10 rounded-xl p-2.5 border border-white/10 transition">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span className="text-xs font-bold text-white">Nai Roshni (नई रोशनी)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Leadership, digital literacy, and entrepreneurship development for minority women artisans.
                    </p>
                  </div>

                  <div className="bg-white/5 hover:bg-white/10 rounded-xl p-2.5 border border-white/10 transition sm:col-span-2 lg:col-span-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                      <span className="text-xs font-bold text-white">Nai Manzil (नई मंज़िल)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      Educational qualification & open schooling bridge (Class 8th/10th/12th via NIOS) for youth & school dropouts.
                    </p>
                  </div>
                </div>

                {/* Key Institutional Ecosystem Pillars */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10 text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/30 text-sky-200">
                    <Banknote className="w-3 h-3 text-amber-300" />
                    <strong>Credit Linkage:</strong> NMDFC Concessional Financing
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/30 text-sky-200">
                    <Store className="w-3 h-3 text-emerald-300" />
                    <strong>Exhibitions:</strong> Hunar Haat & Lok Samvardhan Parv
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/30 text-sky-200">
                    <ShieldCheck className="w-3 h-3 text-purple-300" />
                    <strong>Standards:</strong> NSQF & TSC Accredited
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Prime Minister Narendra Modi Showcase */}
            <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none">
                {/* Ambient Backlight Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/20 via-sky-500/20 to-indigo-500/30 rounded-3xl blur-2xl opacity-70 pointer-events-none" />

                {/* Glassmorphic Executive Card */}
                <div className="relative rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-white/15 via-white/10 to-slate-950/80 backdrop-blur-xl border border-white/25 shadow-2xl overflow-hidden group">
                  {/* Top Card Strip: Animated Scheme Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/60 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 animate-text-shimmer bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                        PM Vikas Scheme
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-sky-200 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-900/70 border border-blue-400/30">
                      Government of India
                    </span>
                  </div>

                  {/* Clean Dignitary Portrait Frame */}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-50 to-white shadow-inner border border-amber-400/30 p-2 flex items-center justify-center">
                    <img
                      src="/pm-narendra-modi.png"
                      alt="Shri Narendra Modi - Hon'ble Prime Minister of India"
                      className="w-full max-h-[280px] sm:max-h-[320px] xl:max-h-[360px] object-contain object-bottom drop-shadow-md transition-transform duration-500 group-hover:scale-102"
                    />
                  </div>

                  {/* Dignitary Nameplate & Quote */}
                  <div className="mt-3 pt-3 border-t border-white/15 bg-slate-950/80 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 rounded-b-3xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                          <span>Shri Narendra Modi</span>
                        </h3>
                        <p className="text-xs font-semibold text-amber-300">
                          Hon'ble Prime Minister of India
                        </p>
                      </div>
                      <img src="/emblem-india.png" alt="State Emblem" className="h-8 w-auto object-contain opacity-90 brightness-110" />
                    </div>
                    <p className="text-[11px] text-slate-300 italic leading-relaxed pt-1">
                      &ldquo;Our traditional artisans, weavers, and craftspersons are the guardians of India's cultural heritage. Through the <strong>PM Vikas Scheme</strong>, we are integrating traditional craftsmanship with modern skilling, direct financial security, and global market access.&rdquo;
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">Skilling</span>
                      <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">Leadership</span>
                      <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">Education</span>
                      <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">Market Linkage</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tricolor Accent Separation Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white/90 to-emerald-600 shadow-sm" />

      {/* 2. Dedicated "Apply Now" Admissions Banner */}
      <section className="relative w-full bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white border-b border-blue-900/60 py-8 sm:py-10 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl 2xl:max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="bg-gradient-to-r from-blue-900/90 via-indigo-950/80 to-slate-900/90 rounded-3xl p-6 sm:p-8 lg:p-10 border border-amber-400/40 shadow-2xl backdrop-blur-xl flex flex-col xl:flex-row items-center justify-between gap-8">
            
            {/* Left: Call to Action Details */}
            <div className="space-y-4 max-w-3xl text-center xl:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/50 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Admissions Open • 2026-27 Batch
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                <span className="text-slate-200 text-xs font-semibold hidden sm:inline">
                  PM VIKAS Accredited Centres
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                Apply Now for PM VIKAS Accredited Handloom & Craft Courses
              </h2>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                Direct admission into government-sponsored artisan training programmes. Gain hands-on mastery in Traditional Handloom, Jacquard Weaving, Loin Loom, Embroidery, and Allied Crafts under master mentorship.
              </p>

              {/* Key Entitlements Checklist */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-left">
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-200">100% Free Training</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                  <Banknote className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-200">Monthly DBT Stipend</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                  <Award className="w-4 h-4 text-sky-300 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-200">Govt. NSQF Certificate</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                  <Store className="w-4 h-4 text-purple-300 shrink-0" />
                  <span className="text-[11px] font-semibold text-slate-200">Market & Credit Links</span>
                </div>
              </div>
            </div>

            {/* Right: Prominent Admission Action Buttons */}
            <div className="flex flex-col sm:flex-row xl:flex-col gap-3.5 w-full sm:w-auto shrink-0 justify-center">
              <Link
                to="/apply"
                className="inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black px-8 py-4 rounded-2xl text-sm sm:text-base shadow-xl shadow-amber-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer text-center"
              >
                <span>Apply Online Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#trades"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm backdrop-blur-md border border-white/25 transition shadow-sm text-center"
              >
                <Layers className="w-4 h-4 text-sky-300" />
                <span>Browse 9 Accredited Trades</span>
              </a>
              <a
                href="#project-media"
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white font-semibold px-4 py-2 rounded-xl text-xs transition text-center"
              >
                <Video className="w-3.5 h-3.5 text-amber-300" />
                <span>Watch Documentaries & Films</span>
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Public Application Tracking Widget */}
      <section className="w-full max-w-4xl 2xl:max-w-5xl mx-auto px-4 mt-10 sm:mt-12 relative z-20">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold border border-blue-200 shadow-xs">
              <Search className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Track Application & Admission Status</h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Candidates can verify admission scrutiny status using their <strong>Registration ID</strong> (e.g. HND-2026-EMB-...) or registered mobile number and Date of Birth without signing in.
          </p>

          <form onSubmit={handleTrack} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registration ID or Mobile Number
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="e.g. HND-2026-EMB-AB12CD or 9876543210"
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
              {result.registration_no && (
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 bg-blue-100/60 -mx-5 -mt-5 p-3.5 rounded-t-2xl">
                  <span className="text-slate-600 font-bold uppercase tracking-wide text-[10px]">
                    Registration ID / Tracking Ref:
                  </span>
                  <span className="font-mono font-black text-slate-950 text-xs sm:text-sm">
                    {result.registration_no}
                  </span>
                </div>
              )}
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

      {/* 3. Main Body Sections Container */}
      <div className="w-full max-w-7xl 2xl:max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-20">
        {/* Trades Section */}
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
                Certified curricula structured by the Textile Sector Skill Council (TSC) under the <strong>PM Vikas Scheme</strong>. Maximum 1 application per artisan per category. Select a trade below to apply directly.
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

        {/* 4. Project Media Section (Videos, Documentaries & Live Photographs) */}
        <ProjectMediaSection />

        {/* 5. Trainee Benefits / Institutional Features */}
        <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white rounded-3xl p-8 sm:p-12 border border-blue-900/50 shadow-xl">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300 bg-blue-900/80 px-3 py-1 rounded-full border border-blue-500/30">
              Government Backing
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Artisan Trainee Entitlements</h2>
            <p className="text-xs text-blue-200">
              Comprehensive institutional backing provided under the PM VIKAS (Pradhan Mantri Virasat Ka Samvardhan) Scheme
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
    </div>
  );
}
