import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminMetrics } from "../../api";
import QuotaMetricsHeader from "../../components/admin/QuotaMetricsHeader";
import {
  FileText,
  Users,
  UserCog,
  Tag,
  ArrowRight,
  TrendingUp,
  MapPin,
  BarChart3,
  ArrowUpDown,
} from "lucide-react";
import type { User } from "../../types";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [districtSort, setDistrictSort] = useState<"count" | "name">("count");
  const [hideZeroDistricts, setHideZeroDistricts] = useState(false);

  const userJson = localStorage.getItem("user");
  let currentUser: User | null = null;
  try {
    if (userJson) currentUser = JSON.parse(userJson);
  } catch {
    currentUser = null;
  }
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Fetch Live Metrics (including district breakdown)
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["adminMetrics"],
    queryFn: getAdminMetrics,
    refetchInterval: 15000,
  });

  const sortedDistricts = useMemo(() => {
    const raw = metrics?.districts || [];
    const filtered = hideZeroDistricts ? raw.filter((d) => d.total_applied > 0) : [...raw];
    if (districtSort === "name") {
      return filtered.sort((a, b) => a.district.localeCompare(b.district));
    }
    return filtered.sort((a, b) =>
      b.total_applied !== a.total_applied
        ? b.total_applied - a.total_applied
        : a.district.localeCompare(b.district)
    );
  }, [metrics?.districts, districtSort, hideZeroDistricts]);

  const maxDistrictCount = useMemo(() => {
    const counts = (metrics?.districts || []).map((d) => d.total_applied);
    return Math.max(1, ...counts);
  }, [metrics?.districts]);

  const activeDistrictCount = useMemo(() => {
    return (metrics?.districts || []).filter((d) => d.total_applied > 0).length;
  }, [metrics?.districts]);

  return (
    <div className="space-y-8">
      {/* 1. Live Executive Quota & Metrics Header */}
      <QuotaMetricsHeader
        metrics={metrics}
        isLoading={isMetricsLoading}
        onRefresh={() => refetchMetrics()}
        onSelectCategory={(catId) => {
          navigate(catId ? `/admin/applications?category_id=${catId}` : "/admin/applications");
        }}
      />

      {/* 2. District-Wise Application Analytics */}
      <section
        aria-labelledby="district-analytics-heading"
        className="bg-white rounded-2xl border border-[#D9C5A3] p-6 sm:p-7 shadow-2xs space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E9DEC8]">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#8B5E3C]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#5C6B45]">
                REGIONAL ANALYTICS
              </span>
            </div>
            <h2
              id="district-analytics-heading"
              className="font-serif text-2xl text-[#3B3028] mt-1"
            >
              District-Wise Application Breakdown (Manipur)
            </h2>
            <p className="text-xs text-[#6E5D50] mt-0.5">
              Live application volume aggregated across {activeDistrictCount} active district
              {activeDistrictCount === 1 ? "" : "s"} out of {(metrics?.districts || []).length || 16}. Click any district to inspect its queue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setHideZeroDistricts((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                hideZeroDistricts
                  ? "bg-[#5C6B45] text-[#F5EFE3] border-[#5C6B45]"
                  : "bg-[#FAF6EE] text-[#3B3028] border-[#D9C5A3] hover:bg-[#EDE3D2]"
              }`}
            >
              {hideZeroDistricts ? "Active Districts Only" : "Show Active Only"}
            </button>

            <button
              type="button"
              onClick={() => setDistrictSort((s) => (s === "count" ? "name" : "count"))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FAF6EE] hover:bg-[#EDE3D2] text-[#3B3028] border border-[#D9C5A3] transition cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8B5E3C]" />
              <span>Sort: {districtSort === "count" ? "Applications" : "District A–Z"}</span>
            </button>
          </div>
        </div>

        {/* Visual Bar Comparison (Top Districts / Active Districts) */}
        {sortedDistricts.length === 0 ? (
          <div className="p-8 text-center bg-[#FAF6EE] rounded-xl border border-[#D9C5A3] text-sm text-[#6E5D50]">
            No district application records match the current filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Bar Visualization */}
            <div className="lg:col-span-5 bg-[#FAF6EE] rounded-xl border border-[#D9C5A3] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9C5A3] pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3B3028] flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-[#8B5E3C]" />
                  Distribution Chart
                </span>
                <span className="text-[11px] font-mono text-[#6E5D50]">
                  Total: {metrics?.total_applied ?? 0}
                </span>
              </div>

              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {sortedDistricts.map((dm) => {
                  const barPct = dm.total_applied > 0 ? Math.max(6, Math.round((dm.total_applied / maxDistrictCount) * 100)) : 0;
                  const sharePct =
                    metrics && metrics.total_applied > 0
                      ? ((dm.total_applied / metrics.total_applied) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <button
                      key={dm.district}
                      type="button"
                      onClick={() => navigate(`/admin/applications?district=${encodeURIComponent(dm.district)}`)}
                      className="w-full text-left group space-y-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#3B3028] group-hover:text-[#8B5E3C] transition">
                          {dm.district}
                        </span>
                        <span className="font-mono text-[#6E5D50]">
                          <strong className="text-[#3B3028]">{dm.total_applied}</strong> ({sharePct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-white rounded-full border border-[#D9C5A3] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#8B5E3C] to-[#5C6B45] transition-all duration-300"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Tabular District Breakdown */}
            <div className="lg:col-span-7 overflow-x-auto border border-[#D9C5A3] rounded-xl">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#FAF6EE] border-b border-[#D9C5A3] text-[11px] font-bold uppercase tracking-wider text-[#6E5D50]">
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-3 text-right">Applied</th>
                    <th className="py-3 px-3 text-right">Pending</th>
                    <th className="py-3 px-3 text-right">Approved</th>
                    <th className="py-3 px-3 text-right">Rejected</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DEC8] bg-white">
                  {sortedDistricts.map((dm) => (
                    <tr
                      key={dm.district}
                      className="hover:bg-[#FAF6EE] transition-colors"
                    >
                      <td className="py-2.5 px-4 font-semibold text-[#3B3028]">{dm.district}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#3B3028]">
                        {dm.total_applied}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#8B5E3C]">
                        {dm.pending}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#5C6B45] font-semibold">
                        {dm.approved}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#A9442A]">
                        {dm.rejected}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          to={`/admin/applications?district=${encodeURIComponent(dm.district)}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#8B5E3C] hover:underline"
                        >
                          <span>Filter</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* 3. Quick Operations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#3B3028] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#8B5E3C]" />
            Quick Workspaces
          </h2>
          <span className="text-xs text-[#6E5D50] font-medium">Select a section to manage</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Applications */}
          <Link
            to="/admin/applications"
            className="group p-5 bg-white rounded-2xl border border-[#D9C5A3] shadow-2xs hover:border-[#8B5E3C] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F3EAE2] text-[#8B5E3C] border border-[#D9C5A3] flex items-center justify-center mb-3 group-hover:bg-[#8B5E3C] group-hover:text-[#F5EFE3] transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#3B3028] text-sm">Applications Queue</h3>
              <p className="text-xs text-[#6E5D50] mt-1">
                Verify submitted forms, check uploaded documents, and approve or return applications.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E9DEC8] flex items-center justify-between text-xs font-bold text-[#8B5E3C]">
              <span>{metrics?.pending ?? 0} Pending Review</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Candidates */}
          <Link
            to="/admin/candidates"
            className="group p-5 bg-white rounded-2xl border border-[#D9C5A3] shadow-2xs hover:border-[#8B5E3C] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#EEF2E7] text-[#5C6B45] border border-[#5C6B45]/25 flex items-center justify-center mb-3 group-hover:bg-[#5C6B45] group-hover:text-[#F5EFE3] transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#3B3028] text-sm">Registered Candidates</h3>
              <p className="text-xs text-[#6E5D50] mt-1">
                Directory of all registered applicants with registration dates and application counts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E9DEC8] flex items-center justify-between text-xs font-bold text-[#5C6B45]">
              <span>View All Candidates</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Categories CRUD (Super Admin) */}
          {isSuperAdmin ? (
            <Link
              to="/admin/categories"
              className="group p-5 bg-white rounded-2xl border border-[#D9C5A3] shadow-2xs hover:border-[#8B5E3C] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#F3EAE2] text-[#8B5E3C] border border-[#D9C5A3] flex items-center justify-center mb-3 group-hover:bg-[#8B5E3C] group-hover:text-[#F5EFE3] transition-colors">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#3B3028] text-sm">Trade Categories</h3>
                <p className="text-xs text-[#6E5D50] mt-1">
                  Create training trades, adjust quota allocations, and toggle intake windows.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E9DEC8] flex items-center justify-between text-xs font-bold text-[#8B5E3C]">
                <span>Manage Categories</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ) : (
            <div className="p-5 bg-[#FAF6EE] rounded-2xl border border-[#D9C5A3] opacity-70 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#EDE3D2] text-[#6E5D50] flex items-center justify-center mb-3">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#3B3028] text-sm">Trade Categories</h3>
                <p className="text-xs text-[#6E5D50] mt-1">Restricted to Super Administrators.</p>
              </div>
              <span className="text-xs text-[#6E5D50] italic mt-4 pt-3 border-t border-[#D9C5A3]">
                Super Admin Only
              </span>
            </div>
          )}

          {/* Card 4: Users & RBAC (Super Admin) */}
          {isSuperAdmin ? (
            <Link
              to="/admin/users"
              className="group p-5 bg-white rounded-2xl border border-[#D9C5A3] shadow-2xs hover:border-[#8B5E3C] hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#EEF2E7] text-[#5C6B45] border border-[#5C6B45]/25 flex items-center justify-center mb-3 group-hover:bg-[#5C6B45] group-hover:text-[#F5EFE3] transition-colors">
                  <UserCog className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#3B3028] text-sm">Users &amp; RBAC</h3>
                <p className="text-xs text-[#6E5D50] mt-1">
                  Inspect system user accounts and assign administrative reviewer permissions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E9DEC8] flex items-center justify-between text-xs font-bold text-[#5C6B45]">
                <span>Access RBAC Console</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ) : (
            <div className="p-5 bg-[#FAF6EE] rounded-2xl border border-[#D9C5A3] opacity-70 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#EDE3D2] text-[#6E5D50] flex items-center justify-center mb-3">
                  <UserCog className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[#3B3028] text-sm">Users &amp; RBAC</h3>
                <p className="text-xs text-[#6E5D50] mt-1">Restricted to Super Administrators.</p>
              </div>
              <span className="text-xs text-[#6E5D50] italic mt-4 pt-3 border-t border-[#D9C5A3]">
                Super Admin Only
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
