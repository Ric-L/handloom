import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../api";
import { Link } from "react-router-dom";
import { Layers, CheckCircle2, Clock, BookOpen, ArrowRight, ShieldAlert } from "lucide-react";

export default function CategoriesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  if (isLoading) {
    return (
      <div className="text-center py-24 text-slate-400 space-y-3">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm font-medium text-slate-500">Loading accredited artisan trades...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-center space-y-2">
        <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="font-bold text-sm">Failed to Load Trades</h3>
        <p className="text-xs text-rose-600">Please ensure the backend API server is running and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
            Vocational Skill Framework
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">
            Accredited Artisan Trades
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Government-certified training programmes across traditional handloom, weaving, and textile crafts.
            Candidates may submit an application for one trade per admission cycle.
          </p>
        </div>
      </div>

      {/* Trade Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.map(cat => (
          <div
            key={cat.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
          >
            <div>
              {/* Card Top */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-primary-800 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-lg">
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
                  {cat.is_approval_open ? "Admissions Open" : "Admissions Closed"}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-bold text-slate-900 text-lg leading-snug mb-3">{cat.title}</h2>

              {/* Key Features */}
              <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600 mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                  <span>Duration: <strong>6 Months (Full-Time)</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                  <span>Curriculum: Practical Loom Work & Design</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-700 shrink-0" />
                  <span>Benefits: Monthly DBT Stipend + Toolkit</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div>
              {cat.is_approval_open ? (
                <Link
                  to={`/apply?category=${cat.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition"
                >
                  Apply for this Trade <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <button
                  disabled
                  className="w-full bg-slate-100 text-slate-400 font-bold py-2.5 rounded-xl text-xs cursor-not-allowed border border-slate-200"
                >
                  Admissions Closed (Batch Full)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
