import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackApplication, getCategories } from "../api";
import { formatDate, statusBadgeColor } from "../lib/utils";
import type { TrackResponse } from "../types";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Banknote,
  Award,
  Clock,
  UserPlus,
  ClipboardCheck,
  Download,
  PhoneCall,
  AlertCircle,
  Target,
} from "lucide-react";
import { ProjectMediaSection } from "../components/ProjectMediaSection";

export default function HomePage() {
  const [identifier, setIdentifier] = useState("");
  const [dob, setDob] = useState("");
  const [result, setResult] = useState<TrackResponse | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);

  const [courseSearch, setCourseSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((cat) => {
      if (openOnly && !cat.is_approval_open) return false;
      if (courseSearch.trim()) {
        const q = courseSearch.toLowerCase();
        return cat.title.toLowerCase().includes(q) || cat.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [categories, courseSearch, openOnly]);

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
        "We could not find an application matching those details. Please check your Registration ID (or 10-digit mobile number) and Date of Birth."
      );
    } finally {
      setSearching(false);
    }
  };

  const scrollToSection = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full flex flex-col font-sans">
      {/* 1. e-Seba Style Light Scenic Hero Banner */}
      <section className="relative w-full overflow-hidden bg-gradient-to-r from-[#d8efe2] via-[#e4f3ef] to-[#f4ece1] border-b border-slate-200">
        {/* Soft Atmospheric Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-72 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: Emblem Lockup, Headline, Description, 2 CTA Buttons */}
            <div className="lg:col-span-7 pb-10 sm:pb-14 space-y-6 flex flex-col justify-center">
              {/* Emblem & Portal Title Lockup */}
              <div className="flex items-center gap-3.5">
                <img
                  src="/emblem-india.png"
                  alt="State Emblem of India"
                  className="h-14 sm:h-16 w-auto object-contain shrink-0"
                />
                <div>
                  <div className="text-base sm:text-lg font-extrabold text-amber-600 tracking-wide">
                    प्रधानमंत्री विरासत का संवर्धन
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-800 font-serif leading-tight">
                    PM VIKAS Portal
                  </div>
                </div>
              </div>

              {/* Clean Deep-Navy Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold text-[#0f256e] leading-[1.2] tracking-tight max-w-2xl">
                A Unified Online Platform for Handloom &amp; Artisan Skill Services
              </h1>

              {/* Plain-Language Description */}
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-xl">
                PM VIKAS provides a secure, transparent, and convenient digital interface for artisans and weavers to apply for free certified training, track applications, and download approval slips online anytime and anywhere.
              </p>

              {/* Two Side-by-Side e-Seba Style CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#0f256e] hover:bg-blue-950 text-white font-bold text-sm shadow-sm transition"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>Citizen Services - Register &amp; Apply</span>
                </Link>

                <button
                  type="button"
                  onClick={() => scrollToSection("#track-status")}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg border-2 border-[#0f256e] text-[#0f256e] bg-white/60 hover:bg-white font-bold text-sm transition cursor-pointer"
                >
                  <Target className="w-4 h-4 shrink-0" />
                  <span>Track Application Status</span>
                </button>
              </div>
            </div>

            {/* Right Column: Clean Dignitary Portrait Matching Full Container Height */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end items-end self-stretch">
              <img
                src="/pm-narendra-modi.png?v=2"
                alt="Shri Narendra Modi - Hon'ble Prime Minister of India"
                className="w-auto max-w-full h-80 sm:h-96 lg:h-[430px] object-contain object-bottom"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Simple 3-Step Guide ("How It Works") */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-full bg-[#0f256e] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#0f256e]" />
                  Register with Mobile
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Create a free account using your 10-digit mobile number.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-full bg-[#0f256e] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-[#0f256e]" />
                  Fill Form &amp; Upload Docs
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Choose a course, enter your details, and upload your photo &amp; ID.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-700" />
                  Track &amp; Download Slip
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Check approval status anytime and download your admission letter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Track Application Status Card */}
        <section id="track-status" className="scroll-mt-24 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0f256e] flex items-center justify-center border border-blue-200">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Check Your Application Status</h2>
                <p className="text-sm text-slate-600">
                  No sign-in needed. Enter your Registration Number or Mobile Number and Date of Birth.
                </p>
              </div>
            </div>

            <form onSubmit={handleTrack} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="track-id" className="block text-sm font-bold text-slate-800 mb-1.5">
                    Registration Number or Mobile Number
                  </label>
                  <input
                    id="track-id"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    placeholder="e.g. HND-2026-EMB-AB12CD or 9876543210"
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-[#0f256e] focus:border-[#0f256e] focus:outline-none bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="track-dob" className="block text-sm font-bold text-slate-800 mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    id="track-dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 focus:ring-[#0f256e] focus:border-[#0f256e] focus:outline-none bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={searching}
                className="w-full sm:w-auto px-8 py-3 bg-[#0f256e] hover:bg-blue-950 text-white font-bold rounded-xl text-sm transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {searching ? "Checking Status..." : "Check Status"}
              </button>
            </form>

            {error && (
              <div className="mt-5 p-4 text-sm text-rose-900 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="mt-6 p-5 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                {/* Visual 3-Step Progress Timeline */}
                <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-200 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                      ✓
                    </span>
                    <span className="text-xs font-bold text-slate-800">Submitted</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                        result.status === "PENDING" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                      }`}
                    >
                      {result.status === "PENDING" ? "2" : "✓"}
                    </span>
                    <span className="text-xs font-bold text-slate-800">Under Review</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                        result.status === "APPROVED"
                          ? "bg-emerald-600 text-white"
                          : result.status === "REJECTED"
                          ? "bg-rose-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {result.status === "APPROVED" ? "✓" : result.status === "REJECTED" ? "!" : "3"}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {result.status === "REJECTED" ? "Needs Attention" : "Approved"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {result.registration_no && (
                    <div>
                      <span className="text-xs text-slate-500 block">Registration Number</span>
                      <span className="font-mono font-bold text-slate-900">{result.registration_no}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-slate-500 block">Applicant Name</span>
                    <span className="font-bold text-slate-900">{result.full_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Course Applied</span>
                    <span className="font-semibold text-slate-900">
                      {result.category_code ? `${result.category_code} - ` : ""}
                      {result.category}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Submitted On</span>
                    <span className="font-medium text-slate-800">{formatDate(result.submitted_at)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                  <span className="text-sm font-bold text-slate-700">Current Status:</span>
                  <span className={`px-3.5 py-1 rounded-full text-xs font-bold ${statusBadgeColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>

                {result.rejection_reason && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-900">
                    <strong>Reason / Remarks:</strong> {result.rejection_reason}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 4. Available Training Courses */}
        <section id="trades" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f256e] tracking-tight">
                Available Handloom &amp; Craft Courses
              </h2>
              <p className="mt-1 text-sm text-slate-600 max-w-2xl">
                Select any open course below to start your online application. You can apply for one course per admission cycle.
              </p>
            </div>
            <Link
              to="/categories"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0f256e] hover:underline shrink-0"
            >
              <span>View All Courses</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search courses (e.g. Weaving, Embroidery, Bamboo)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#0f256e] focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpenOnly(!openOnly)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition cursor-pointer whitespace-nowrap ${
                openOnly
                  ? "bg-[#0f256e] text-white border-[#0f256e]"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {openOnly ? "Showing: Open Courses Only" : "Show Open Courses Only"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isCategoriesLoading ? (
              <div className="col-span-full text-center py-12 text-slate-500 text-sm font-medium">
                Loading training courses...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-600 text-sm">
                No courses match your search. Try clearing the search box.
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {cat.code}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                          cat.is_approval_open
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            cat.is_approval_open ? "bg-emerald-600" : "bg-rose-500"
                          }`}
                        />
                        {cat.is_approval_open ? "Open" : "Batch Full"}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg leading-snug mb-4">{cat.title}</h3>

                    <div className="space-y-2 text-sm text-slate-600 py-3 border-y border-slate-100 mb-5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#0f256e] shrink-0" />
                        <span>6 Months Full-Time Training</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#0f256e] shrink-0" />
                        <span>Government NSQF Certificate</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Free Training + Monthly Stipend</span>
                      </div>
                    </div>
                  </div>

                  {cat.is_approval_open ? (
                    <Link
                      to={`/apply?category=${cat.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#0f256e] hover:bg-blue-950 text-white font-bold py-3 rounded-xl text-sm transition"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-slate-100 text-slate-500 font-semibold py-3 rounded-xl text-sm cursor-not-allowed border border-slate-200"
                    >
                      Admissions Closed
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* 5. Keep These Ready Before You Apply */}
        <section className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h2 className="text-xl font-extrabold text-slate-900">Keep These Ready Before You Apply</h2>
              <p className="text-sm text-slate-600">
                You can upload clear photos or PDFs (under 5 MB each) from your phone or computer.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-sm text-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0f256e] shrink-0" />
                  <span>Passport-size Photo</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0f256e] shrink-0" />
                  <span>Aadhaar / Government ID Proof</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0f256e] shrink-0" />
                  <span>Bank Passbook (for Stipend)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0f256e] shrink-0" />
                  <span>Address &amp; Education Proof</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0">
              <Link
                to="/apply"
                className="inline-flex items-center justify-center gap-2 bg-[#0f256e] hover:bg-blue-950 text-white font-bold px-6 py-3.5 rounded-xl text-sm shadow-sm transition"
              >
                <span>Start Application</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="tel:18002007890"
                className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#0f256e] hover:underline"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Helpdesk: 1800 200 7890
              </a>
            </div>
          </div>
        </section>

        {/* 6. Project Media Section */}
        <ProjectMediaSection />

        {/* 7. Trainee Benefits */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 sm:p-10">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <h2 className="text-2xl font-extrabold tracking-tight">Benefits for Every Selected Trainee</h2>
            <p className="text-sm text-slate-300">
              Provided under the PM VIKAS Scheme by the Ministry of Minority Affairs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white/5 p-5 rounded-xl border border-white/10 space-y-2">
              <Banknote className="w-6 h-6 text-amber-300" />
              <h3 className="font-bold text-base">Monthly Stipend</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sent directly to your bank account during the training period.
              </p>
            </div>
            <div className="bg-white/5 p-5 rounded-xl border border-white/10 space-y-2">
              <GraduationCap className="w-6 h-6 text-sky-300" />
              <h3 className="font-bold text-base">Expert Trainers</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Learn hands-on weaving and craft skills from master artisans.
              </p>
            </div>
            <div className="bg-white/5 p-5 rounded-xl border border-white/10 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
              <h3 className="font-bold text-base">Govt. Certificate</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Receive an official NSQF certificate after completing training.
              </p>
            </div>
            <div className="bg-white/5 p-5 rounded-xl border border-white/10 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-purple-300" />
              <h3 className="font-bold text-base">Work &amp; Market Support</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect with weavers&apos; cooperatives, exhibitions, and loan schemes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
