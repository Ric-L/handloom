import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../api";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, BookOpen, ArrowRight, ShieldAlert, Search } from "lucide-react";

export default function CategoriesPage() {
  const [search, setSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((cat) => {
      if (openOnly && !cat.is_approval_open) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return cat.title.toLowerCase().includes(q) || cat.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data, search, openOnly]);

  if (isLoading) {
    return (
      <div className="text-center py-24 text-slate-500 space-y-3">
        <div className="animate-spin w-9 h-9 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-base font-medium">Loading available training courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="font-bold text-base">Unable to Load Courses</h3>
        <p className="text-sm text-rose-700">
          We could not load the training courses right now. Please refresh the page or try again in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              MHHDC Allocated Training Quota • PM VIKAS Scheme
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
              Available Handloom &amp; Artisan Courses
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Choose a course below to apply through Manipur Handloom &amp; Handicrafts Development Corporation Ltd. Selected candidates admitted under MHHDC&apos;s PM VIKAS Scheme quota receive free training, a monthly stipend, and recognized NSQF certification.
            </p>
          </div>
        </div>

        {/* Simple Search & Filter Bar (e-Seba Service Discovery style) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses by name (e.g., Weaving, Embroidery, Bamboo)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpenOnly(!openOnly)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition cursor-pointer whitespace-nowrap ${
              openOnly
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {openOnly ? "Showing: Open Courses Only" : "Show Open Courses Only"}
          </button>
        </div>
      </div>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2">
          <p className="text-base font-bold text-slate-800">No matching courses found</p>
          <p className="text-sm text-slate-500">Try clearing your search or showing all courses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
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
                    {cat.is_approval_open ? "Open for Admission" : "Admissions Closed"}
                  </span>
                </div>

                <h2 className="font-bold text-slate-900 text-lg leading-snug mb-4">{cat.title}</h2>

                <div className="space-y-2.5 py-3 border-y border-slate-100 text-sm text-slate-600 mb-6">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Duration: <strong>6 Months (Full-Time)</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Practical loom &amp; craft training</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free training + Monthly stipend + Toolkit</span>
                  </div>
                </div>
              </div>

              <div>
                {cat.is_approval_open ? (
                  <Link
                    to={`/apply?category=${cat.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-sm shadow-xs transition"
                  >
                    <span>Apply for This Course</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-500 font-semibold py-3 rounded-xl text-sm cursor-not-allowed border border-slate-200"
                  >
                    Admissions Closed (Seats Full)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
