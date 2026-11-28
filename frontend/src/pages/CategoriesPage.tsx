import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCategories, getMyApplications } from "../api";
import { Search, Clock, BookOpen, CheckCircle2, ArrowRight, RotateCcw } from "lucide-react";

export default function CategoriesPage() {
  const token = localStorage.getItem("token");

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: myApps } = useQuery({
    queryKey: ["myApplications"],
    queryFn: getMyApplications,
    enabled: Boolean(token),
  });

  const activeCategoryMap = useMemo(() => {
    const map = new Map<number, "PENDING" | "APPROVED">();
    (myApps || []).forEach((app) => {
      if (app.status === "PENDING" || app.status === "APPROVED") {
        map.set(app.category_id, app.status);
      }
    });
    return map;
  }, [myApps]);

  const rejectedCategorySet = useMemo(() => {
    const set = new Set<number>();
    (myApps || []).forEach((app) => {
      if (app.status === "REJECTED" && !activeCategoryMap.has(app.category_id)) {
        set.add(app.category_id);
      }
    });
    return set;
  }, [myApps, activeCategoryMap]);

  const [search, setSearch] = useState("");
  const [openOnly, setOpenOnly] = useState(false);

  const filtered = useMemo(() => {
    if (!categories) return [];
    const q = search.trim().toLowerCase();
    return categories.filter((c) => {
      if (openOnly && !c.is_approval_open) return false;
      if (!q) return true;
      return c.title.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    });
  }, [categories, search, openOnly]);

  if (isLoading) {
    return (
      <div className="text-center py-24 text-[#6E5D50] space-y-3">
        <div className="animate-spin w-9 h-9 border-4 border-[#8B5E3C] border-t-transparent rounded-full mx-auto" />
        <p className="text-base font-medium">Loading training courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto my-12 p-6 bg-[#FDF2EE] border border-[#8B5E3C]/50 rounded-2xl text-[#632919] text-center space-y-2">
        <h3 className="font-serif text-xl">Could Not Load Courses</h3>
        <p className="text-sm">
          We could not reach the admission server right now. Please refresh this page in a few moments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Editorial Page Header */}
      <div className="bg-[#FAF6EE] rounded-2xl border border-[#D9C5A3] p-6 sm:p-8 space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45] bg-[#EEF2E7] px-3 py-1 rounded-full border border-[#5C6B45]/30">
              MHHDC Allocated Training Quota • PM VIKAS Scheme
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#3B3028] tracking-tight">
              Available Handloom &amp; Artisan Trades
            </h1>
            <p className="text-sm text-[#6E5D50] max-w-2xl leading-relaxed">
              Choose a craft discipline below to apply through Manipur Handloom &amp; Handicrafts Development Corporation Ltd. Selected trainees receive free residential training, monthly stipend, and NSQF certification.
            </p>
          </div>
          <span className="text-xs font-medium text-[#6E5D50] shrink-0">
            {filtered.length} {filtered.length === 1 ? "pathway" : "pathways"} available
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 border-t border-[#E9DEC8]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8D7B6D] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search trades by name or code (e.g. Weaving, Embroidery, Bamboo)..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#D9C5A3] rounded-lg bg-white focus:ring-2 focus:ring-[#8B5E3C]/25 focus:border-[#8B5E3C] focus:outline-none text-[#3B3028] placeholder-[#8D7B6D]"
            />
          </div>
          <button
            type="button"
            onClick={() => setOpenOnly(!openOnly)}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold border transition cursor-pointer whitespace-nowrap ${
              openOnly
                ? "bg-[#5C6B45] text-[#F5EFE3] border-[#5C6B45]"
                : "bg-white text-[#3B3028] border-[#D9C5A3] hover:bg-[#EDE3D2]"
            }`}
          >
            {openOnly ? "Showing: Open Trades Only" : "Show Open Trades Only"}
          </button>
        </div>
      </div>

      {/* Connected Hairline Course Matrix */}
      {filtered.length === 0 ? (
        <div className="bg-[#FAF6EE] rounded-2xl border border-[#D9C5A3] p-12 text-center space-y-2">
          <p className="font-serif text-xl text-[#3B3028]">No matching trades found</p>
          <p className="text-sm text-[#6E5D50]">Try clearing your search or showing all trades.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#D9C5A3] rounded-xl overflow-hidden bg-white shadow-xs">
          {filtered.map((cat, idx) => (
            <div
              key={cat.id}
              className="border-r border-b border-[#D9C5A3] p-6 sm:p-7 flex flex-col justify-between bg-white hover:bg-[#FAF6EE] transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8B5E3C] block">
                      {cat.code}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        cat.is_approval_open
                          ? "bg-[#EEF2E7] text-[#3E492D] border border-[#5C6B45]/30"
                          : "bg-[#F7E5DF] text-[#7A3526] border border-[#C97B65]/40"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          cat.is_approval_open ? "bg-[#5C6B45]" : "bg-[#8B5E3C]"
                        }`}
                      />
                      {cat.is_approval_open ? "Admissions Open" : "Seats Full"}
                    </span>
                  </div>
                  <span className="font-serif text-2xl text-[#D9C5A3] select-none">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <h2 className="font-serif text-xl text-[#3B3028] leading-snug mb-4">{cat.title}</h2>

                <div className="space-y-2 py-3 border-y border-[#E9DEC8] text-xs text-[#6E5D50] mb-5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" />
                    <span>Residential Full-Time Training Programme</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-[#8B5E3C] shrink-0" />
                    <span>Hands-on Master Weaver &amp; Craft Instruction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#5C6B45] shrink-0" />
                    <span>Free Training • Stipend • NSQF Certificate</span>
                  </div>
                </div>
              </div>

              <div>
                {activeCategoryMap.get(cat.id) ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#5C6B45] bg-[#EEF2E7] px-3 py-1.5 rounded-lg border border-[#5C6B45]/30 hover:bg-[#E1E8D5] transition"
                  >
                    <span>
                      {activeCategoryMap.get(cat.id) === "APPROVED"
                        ? "Admission Approved — View in Portal"
                        : "Application Pending — View in Portal"}
                    </span>
                  </Link>
                ) : cat.is_approval_open ? (
                  <Link
                    to={`/apply?category=${cat.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#8B5E3C] hover:text-[#734C30] group"
                  >
                    {rejectedCategorySet.has(cat.id) ? (
                      <>
                        <RotateCcw className="w-4 h-4 shrink-0" />
                        <span>Reapply for trade</span>
                      </>
                    ) : (
                      <span>Explore &amp; apply</span>
                    )}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8D7B6D]">
                    Admissions Closed (Seats Full)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
