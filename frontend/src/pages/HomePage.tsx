import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../api";
import { Link, useOutletContext } from "react-router-dom";
import type { AppOutletContext } from "../layouts/AppLayout";
import {
  Search,
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Banknote,
  Award,
  MapPin,
  Users,
  BookOpen,
  Store,
  FileText,
  ArrowUpRight,
} from "lucide-react";
import { ProjectMediaSection } from "../components/ProjectMediaSection";

export default function HomePage() {
  const outletCtx = useOutletContext<AppOutletContext | undefined>();
  const [courseSearch, setCourseSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const token = localStorage.getItem("token");

  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
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

  const scrollToSection = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="w-full flex flex-col font-sans bg-[#F5EFE3] text-[#3B3028]">
      {/* 1. Full-Screen Handloom Heritage Hero Banner with Overlaying Gradient */}
      <section
        id="overview"
        className="relative w-full min-h-[calc(100vh-6.25rem)] flex items-center overflow-hidden bg-[#2A211B]"
      >
        {/* Background Image: Craftsperson weaving traditional textile on a Manipuri handloom */}
        <div
          role="img"
          aria-label="A craftsperson weaving traditional textile on a handloom"
          className="absolute inset-0 bg-cover bg-[72%_center] sm:bg-center scale-[1.01]"
          style={{ backgroundImage: "url('/hero-handloom-weaver.jpg')" }}
        />

        {/* Overlaying Earthy Gradient Scrim */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(28, 22, 18, 0.94) 0%, rgba(42, 33, 27, 0.85) 38%, rgba(42, 33, 27, 0.5) 62%, rgba(42, 33, 27, 0.14) 100%), linear-gradient(180deg, rgba(28, 22, 18, 0.35) 0%, rgba(28, 22, 18, 0.05) 45%, rgba(28, 22, 18, 0.48) 100%)",
          }}
        />

        {/* Editorial Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-2xl space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="bg-[#FAF6EE] px-2.5 py-1.5 rounded-xl border border-[#D9C5A3] shrink-0 shadow-xs">
                <img
                  src="/mhhdcl-logo.png"
                  alt="Manipur Handloom and Handicrafts Development Corporation Ltd."
                  className="h-12 sm:h-14 w-auto object-contain"
                />
              </div>
              <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#D9C5A3]">
                <span className="w-6 h-[1px] bg-[#D9C5A3]" aria-hidden="true" />
                <span>MHHDC · SKILLING &amp; TRAINING</span>
              </div>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] text-[#F5EFE3] leading-[1.06] tracking-tight">
              Skills that carry
              <br />
              our heritage forward.
            </h1>

            <p className="text-base sm:text-[17px] text-[#E6DAC3] leading-relaxed max-w-xl">
              A new opportunity to learn, earn and preserve the handloom and handicraft traditions of Manipur — admissions conducted by{" "}
              <strong className="font-semibold text-[#F5EFE3]">
                Manipur Handloom &amp; Handicrafts Development Corporation Ltd.
              </strong>{" "}
              under the PM VIKAS Scheme.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                to={token ? "/dashboard" : "/apply"}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-lg bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] font-semibold text-sm shadow-sm transition"
              >
                <span>{token ? "Open candidate portal" : "Register & apply now"}</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </Link>

              <button
                type="button"
                onClick={() => scrollToSection("#trades")}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-lg border border-[#D9C5A3]/50 text-[#F5EFE3] bg-[#2A211B]/45 hover:bg-[#2A211B]/70 font-medium text-sm transition cursor-pointer"
              >
                <span>Explore training trades</span>
                <ArrowDown className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#D9C5A3]">
              <ShieldCheck className="w-4 h-4 text-[#D9C5A3] shrink-0" aria-hidden="true" />
              <span>Manipur Handloom &amp; Handicrafts Development Corporation Ltd. · Paona Bazar, Imphal</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#8B5E3C] via-[#5C6B45] to-[#D9C5A3]" />
      </section>

      {/* 2. Subtle Hairline Application Notice Strip */}
      <section className="relative bg-[#FAF6EE] border-b border-[#D9C5A3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8B5E3C] shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#8B5E3C]" />
              Admission Notice
            </span>
            <div className="text-sm font-semibold text-[#3B3028]">
              Residential handloom &amp; craft skill training admissions open
              <span className="block sm:inline sm:ml-2 text-xs font-normal text-[#6E5D50]">
                Ref: MHHDC-122/HWT/2020 • Conducted under MHHDC&apos;s allocated quota
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => outletCtx?.openTrackModal?.()}
              className="text-xs font-semibold text-[#5C6B45] hover:text-[#3B3028] transition cursor-pointer"
            >
              Track status
            </button>
            <Link
              to="/apply"
              className="w-8 h-8 rounded-md border border-[#D9C5A3] bg-white flex items-center justify-center text-[#3B3028] hover:border-[#8B5E3C] hover:text-[#8B5E3C] transition"
              title="Apply online"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Editorial Intro + Connected Highlight Strip */}
      <section className="bg-white border-b border-[#D9C5A3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
                AN OPPORTUNITY TO GROW
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-[#3B3028] leading-[1.12]">
                Build a livelihood.
                <span className="block italic text-[#8B5E3C]">Keep tradition alive.</span>
              </h2>
            </div>

            <div className="lg:col-span-6 space-y-4 lg:pt-4">
              <p className="text-sm sm:text-base text-[#6E5D50] leading-relaxed">
                Manipur Handloom &amp; Handicrafts Development Corporation Ltd. invites applications from eligible trainees across Manipur for residential skill training conducted under its allocated PM VIKAS Scheme quota, empowering weavers and craftspeople with modern stipends, tools, and certification.
              </p>
              <button
                type="button"
                onClick={() => scrollToSection("#pm-vikas-scheme")}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B3028] hover:text-[#8B5E3C] transition cursor-pointer"
              >
                <span>About the scheme</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 4-Column Hairline Facts Strip */}
        <div className="bg-[#FAF6EE] border-t border-[#D9C5A3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D9C5A3]">
              <div className="py-6 sm:px-5 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full border border-[#D9C5A3] bg-white flex items-center justify-center text-[#5C6B45] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-serif text-xl sm:text-2xl text-[#3B3028]">14–45 years</div>
                  <div className="text-xs text-[#6E5D50]">Eligible age range</div>
                </div>
              </div>

              <div className="py-6 sm:px-5 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full border border-[#D9C5A3] bg-white flex items-center justify-center text-[#8B5E3C] shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-serif text-xl sm:text-2xl text-[#3B3028]">
                    {String(categories?.length ?? 9).padStart(2, "0")} trades
                  </div>
                  <div className="text-xs text-[#6E5D50]">Craft training disciplines</div>
                </div>
              </div>

              <div className="py-6 sm:px-5 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full border border-[#D9C5A3] bg-white flex items-center justify-center text-[#5C6B45] shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-serif text-xl sm:text-2xl text-[#3B3028]">All districts</div>
                  <div className="text-xs text-[#6E5D50]">Applicants across Manipur</div>
                </div>
              </div>

              <div className="py-6 sm:px-5 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full border border-[#D9C5A3] bg-white flex items-center justify-center text-[#8B5E3C] shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-serif text-xl sm:text-2xl text-[#3B3028]">Free + Stipend</div>
                  <div className="text-xs text-[#6E5D50]">Residential &amp; NSQF support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Connected Architectural Matrix: Training Trades */}
      <section id="trades" className="scroll-mt-20 py-14 sm:py-16 bg-[#F5EFE3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
                FIND YOUR CRAFT
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#3B3028]">
                Training trades
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[#6E5D50]">
                {filteredCategories.length} pathways available
              </span>
              <Link
                to="/categories"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8B5E3C] hover:text-[#734C30]"
              >
                <span>View all courses</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8D7B6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                placeholder="Search trades (e.g. Weaving, Embroidery, Bamboo)..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#D9C5A3] rounded-lg bg-white focus:ring-2 focus:ring-[#8B5E3C]/25 focus:border-[#8B5E3C] focus:outline-none text-[#3B3028] placeholder-[#8D7B6D]"
              />
            </div>
            <button
              type="button"
              onClick={() => setOpenOnly(!openOnly)}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition cursor-pointer whitespace-nowrap ${openOnly
                ? "bg-[#5C6B45] text-[#F5EFE3] border-[#5C6B45]"
                : "bg-white text-[#3B3028] border-[#D9C5A3] hover:bg-[#EDE3D2]"
                }`}
            >
              {openOnly ? "Showing: Open Trades Only" : "Show Open Trades Only"}
            </button>
          </div>

          {isCategoriesLoading ? (
            <div className="text-center py-12 text-[#6E5D50] text-sm font-medium">
              Loading training trades...
            </div>
          ) : isCategoriesError ? (
            <div className="text-center py-12 px-6 bg-[#FDF2EE] rounded-xl border border-[#C97B65]/50 text-[#7A3526] text-sm">
              Unable to load training trades from the admission server right now. Please refresh or check API/CORS configuration.
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-[#D9C5A3] text-[#6E5D50] text-sm">
              No trades match your search. Try clearing the filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#D9C5A3] rounded-xl overflow-hidden bg-white shadow-xs">
              {filteredCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="border-r border-b border-[#D9C5A3] p-6 sm:p-7 flex flex-col justify-between bg-white hover:bg-[#FAF6EE] transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8B5E3C] block">
                          {cat.code}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cat.is_approval_open
                            ? "bg-[#EEF2E7] text-[#3E492D] border border-[#5C6B45]/30"
                            : "bg-[#F7E5DF] text-[#7A3526] border border-[#C97B65]/40"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cat.is_approval_open ? "bg-[#5C6B45]" : "bg-[#8B5E3C]"
                              }`}
                          />
                          {cat.is_approval_open ? "Open" : "Batch Full"}
                        </span>
                      </div>
                      <span className="font-serif text-2xl text-[#D9C5A3] select-none">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl text-[#3B3028] leading-snug mb-3">{cat.title}</h3>
                    <p className="text-xs text-[#6E5D50] leading-relaxed mb-5">
                      Residential skill training with monthly stipend support and NSQF / sector skill assessment.
                    </p>
                  </div>

                  <div>
                    {cat.is_approval_open ? (
                      <Link
                        to={`/apply?category=${cat.id}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8B5E3C] hover:text-[#734C30] group"
                      >
                        <span>Explore pathway</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <span className="text-xs font-medium text-[#8D7B6D]">Admissions Closed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Dark Showcase Eligibility Band ("WHO CAN APPLY") */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2A211B] via-[#342921] to-[#2A211B] text-[#F5EFE3] py-16 sm:py-20 border-y border-[#D9C5A3]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#D9C5A3]">
                <span className="w-5 h-[1px] bg-[#8B5E3C]" aria-hidden="true" />
                <span>WHO CAN APPLY</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[44px] text-[#F5EFE3] leading-[1.1]">
                A clear path
                <span className="block italic text-[#D9C5A3]">to get started.</span>
              </h2>
              <p className="text-sm sm:text-[15px] text-[#E6DAC3] leading-relaxed max-w-md">
                Check the eligibility and reservation norms carefully before submitting your admission application through MHHDC.
              </p>
              <div className="pt-1">
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-[#F5EFE3] hover:bg-white text-[#2A211B] font-semibold text-sm shadow-sm transition"
                >
                  <span>Open application form</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="divide-y divide-[#D9C5A3]/15 border-t border-b border-[#D9C5A3]/20">
                <div className="py-4 sm:py-5 flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-[#5C6B45]/25 border border-[#D9C5A3]/30 text-[#D9C5A3] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-[#F5EFE3]">Age 14–45 years</h3>
                    <p className="text-xs sm:text-sm text-[#D9C5A3]/90 mt-1 leading-relaxed">
                      14 to 45 years for Skill Training &amp; Open Schooling; 18–45 years for Leadership tracks.
                    </p>
                  </div>
                </div>

                <div className="py-4 sm:py-5 flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-[#5C6B45]/25 border border-[#D9C5A3]/30 text-[#D9C5A3] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-[#F5EFE3]">
                      Eligible communities &amp; reservations
                    </h3>
                    <p className="text-xs sm:text-sm text-[#D9C5A3]/90 mt-1 leading-relaxed">
                      Notified minority communities and ST / SC / OBC categories, with 33% seats reserved for women and 3% for PwDs.
                    </p>
                  </div>
                </div>

                <div className="py-4 sm:py-5 flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-[#5C6B45]/25 border border-[#D9C5A3]/30 text-[#D9C5A3] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-[#F5EFE3]">Aadhaar-linked bank account</h3>
                    <p className="text-xs sm:text-sm text-[#D9C5A3]/90 mt-1 leading-relaxed">
                      Required for monthly training stipend disbursement (up to ₹3,000/month + residential support) with 70% attendance.
                    </p>
                  </div>
                </div>

                <div className="py-4 sm:py-5 flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-[#5C6B45]/25 border border-[#D9C5A3]/30 text-[#D9C5A3] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-[#F5EFE3]">Job-role &amp; document readiness</h3>
                    <p className="text-xs sm:text-sm text-[#D9C5A3]/90 mt-1 leading-relaxed">
                      Education and community/ST/minority certificates are verified against the selected NSQF craft trade.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#D9C5A3]/70 pt-3">
                Eligibility details are subject to the current official admission notice and PM VIKAS Scheme guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Four Connected Scheme Pillars ("PM VIKAS QUOTA CONTEXT") */}
      <section id="pm-vikas-scheme" className="scroll-mt-20 py-14 sm:py-16 bg-white border-b border-[#D9C5A3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
                PM VIKAS SCHEME QUOTA
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#3B3028]">
                Four parts of a stronger future
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#6E5D50] max-w-lg">
              Conducted by MHHDC under its allocated quota for Pradhan Mantri Virasat Ka Samvardhan (PM VIKAS), uniting five artisan welfare initiatives.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-[#D9C5A3] rounded-xl overflow-hidden bg-white">
            <div className="border-r border-b border-[#D9C5A3] p-6 space-y-2.5 bg-[#FAF6EE]/50">
              <span className="font-serif text-lg text-[#8B5E3C] block">01</span>
              <GraduationCap className="w-5 h-5 text-[#5C6B45]" />
              <h3 className="font-serif text-lg text-[#3B3028]">Skilling &amp; training</h3>
              <p className="text-xs text-[#6E5D50] leading-relaxed">
                Hands-on traditional training under master artisans (<em>Guru-Shishya Parampara</em>) and NSQF-aligned craft courses.
              </p>
            </div>

            <div className="border-r border-b border-[#D9C5A3] p-6 space-y-2.5 bg-[#FAF6EE]/50">
              <span className="font-serif text-lg text-[#8B5E3C] block">02</span>
              <Users className="w-5 h-5 text-[#5C6B45]" />
              <h3 className="font-serif text-lg text-[#3B3028]">Leadership &amp; enterprise</h3>
              <p className="text-xs text-[#6E5D50] leading-relaxed">
                Leadership and entrepreneurship training for women and youth, including trained <em>Biz Sakhi</em> business mentors.
              </p>
            </div>

            <div className="border-r border-b border-[#D9C5A3] p-6 space-y-2.5 bg-[#FAF6EE]/50">
              <span className="font-serif text-lg text-[#8B5E3C] block">03</span>
              <BookOpen className="w-5 h-5 text-[#5C6B45]" />
              <h3 className="font-serif text-lg text-[#3B3028]">Open schooling bridge</h3>
              <p className="text-xs text-[#6E5D50] leading-relaxed">
                Education bridge support for school dropouts from artisan families to complete Class 8th, 10th, or 12th via NIOS.
              </p>
            </div>

            <div className="border-r border-b border-[#D9C5A3] p-6 space-y-2.5 bg-[#FAF6EE]/50">
              <span className="font-serif text-lg text-[#8B5E3C] block">04</span>
              <Store className="w-5 h-5 text-[#5C6B45]" />
              <h3 className="font-serif text-lg text-[#3B3028]">Craft villages &amp; markets</h3>
              <p className="text-xs text-[#6E5D50] leading-relaxed">
                Common training facilities, SHG credit linkage, exhibition stalls, and market access for trained artisans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Minimalist Mandatory Documents Checklist */}
      <section className="bg-[#EFE7D6] border-y border-[#D9C5A3] py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
                BEFORE YOU APPLY
              </span>
              <h2 className="font-serif text-3xl text-[#3B3028]">
                Keep these documents ready.
              </h2>
              <p className="text-sm text-[#6E5D50] leading-relaxed">
                All five uploads below are mandatory for submission. Ensure clear JPG, PNG, WEBP, or PDF files strictly under <strong>5 MB</strong> each.
              </p>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#3B3028]">
              <div className="flex items-start gap-2.5 bg-white/75 p-4 rounded-xl border border-[#D9C5A3]">
                <CheckCircle2 className="w-4 h-4 text-[#5C6B45] shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Aadhaar Card</strong>
                  <span className="text-xs text-[#6E5D50]">Self-attested clear copy</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-white/75 p-4 rounded-xl border border-[#D9C5A3]">
                <CheckCircle2 className="w-4 h-4 text-[#5C6B45] shrink-0 mt-0.5" />
                <div>
                  <strong className="block">ST / Minority Certificate</strong>
                  <span className="text-xs text-[#6E5D50]">Community, ST/SC/OBC, or minority proof</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-white/75 p-4 rounded-xl border border-[#D9C5A3]">
                <CheckCircle2 className="w-4 h-4 text-[#5C6B45] shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Address Proof</strong>
                  <span className="text-xs text-[#6E5D50]">Residential address verification document</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 bg-white/75 p-4 rounded-xl border border-[#D9C5A3]">
                <CheckCircle2 className="w-4 h-4 text-[#5C6B45] shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Education Certificate</strong>
                  <span className="text-xs text-[#6E5D50]">School / age proof per job-role norms</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 sm:col-span-2 bg-white/75 p-4 rounded-xl border border-[#D9C5A3]">
                <CheckCircle2 className="w-4 h-4 text-[#5C6B45] shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Recent Passport-Size Photograph</strong>
                  <span className="text-xs text-[#6E5D50]">Plus Aadhaar-linked bank passbook details for stipend transfers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. MHHDCL Video & Media Archive & Stipend Benefits */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-14">
        <ProjectMediaSection />

        <section className="bg-gradient-to-br from-[#2A211B] to-[#3B3028] text-[#F5EFE3] rounded-2xl p-6 sm:p-10 border border-[#D9C5A3]/25 shadow-sm">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-8">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D9C5A3]">
              TRAINEE BENEFITS
            </span>
            <h2 className="font-serif text-3xl text-[#F5EFE3]">
              Support for every admitted trainee
            </h2>
            <p className="text-sm text-[#D9C5A3]/90">
              Financial, training, and market support provided under MHHDC&apos;s allocated PM VIKAS Scheme quota
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#3B3028]/70 p-5 rounded-xl border border-[#D9C5A3]/20 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#8B5E3C]/25 border border-[#D9C5A3]/25 flex items-center justify-center text-[#D9C5A3]">
                <Banknote className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-[#F5EFE3]">Monthly Stipend</h3>
              <p className="text-xs text-[#D9C5A3]/85 leading-relaxed">
                Up to ₹3,000/month for traditional craft training, plus ₹2,000/month residential support where applicable.
              </p>
            </div>
            <div className="bg-[#3B3028]/70 p-5 rounded-xl border border-[#D9C5A3]/20 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#8B5E3C]/25 border border-[#D9C5A3]/25 flex items-center justify-center text-[#D9C5A3]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-[#F5EFE3]">Master Trainers</h3>
              <p className="text-xs text-[#D9C5A3]/85 leading-relaxed">
                Learn hands-on weaving and craft techniques under experienced master artisan trainers.
              </p>
            </div>
            <div className="bg-[#3B3028]/70 p-5 rounded-xl border border-[#D9C5A3]/20 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#8B5E3C]/25 border border-[#D9C5A3]/25 flex items-center justify-center text-[#D9C5A3]">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-[#F5EFE3]">NSQF / SSC Certificate</h3>
              <p className="text-xs text-[#D9C5A3]/85 leading-relaxed">
                Receive an accredited assessment certificate upon completing training with minimum attendance.
              </p>
            </div>
            <div className="bg-[#3B3028]/70 p-5 rounded-xl border border-[#D9C5A3]/20 space-y-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#8B5E3C]/25 border border-[#D9C5A3]/25 flex items-center justify-center text-[#D9C5A3]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-base text-[#F5EFE3]">Credit &amp; Market Access</h3>
              <p className="text-xs text-[#D9C5A3]/85 leading-relaxed">
                Guidance for Self-Help Groups, credit linkage, exhibitions, and craft retail catalogues.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
