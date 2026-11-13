import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAdminMetrics, getCategories } from "../../api";
import QuotaMetricsHeader from "../../components/admin/QuotaMetricsHeader";
import {
  FileText,
  Users,
  UserCog,
  Tag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
} from "lucide-react";
import type { User } from "../../types";

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const userJson = localStorage.getItem("user");
  let currentUser: User | null = null;
  try {
    if (userJson) currentUser = JSON.parse(userJson);
  } catch {
    currentUser = null;
  }
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  // Fetch Live Metrics
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useQuery({
    queryKey: ["adminMetrics"],
    queryFn: getAdminMetrics,
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-8">
      {/* 1. Live Executive Quota & Metrics Header */}
      <QuotaMetricsHeader
        metrics={metrics}
        isLoading={isMetricsLoading}
        onRefresh={() => refetchMetrics()}
        onSelectCategory={(catId) => {
          navigate(`/admin/applications`);
        }}
      />

      {/* 2. Quick Operations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-700" />
            Administrative Operations &amp; Workspaces
          </h2>
          <span className="text-xs text-slate-500 font-medium">Click any workspace to proceed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Applications */}
          <Link
            to="/admin/applications"
            className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Applications Queue</h3>
              <p className="text-xs text-slate-500 mt-1">
                Review pending registrations, candidate documents, and enforce category quotas.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>{metrics?.pending ?? 0} Pending Review</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Candidates */}
          <Link
            to="/admin/candidates"
            className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">Registered Candidates</h3>
              <p className="text-xs text-slate-500 mt-1">
                Directory of all platform registered applicants with registration dates and filed counts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
              <span>View All Candidates</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Categories CRUD (Super Admin) */}
          {isSuperAdmin ? (
            <Link
              to="/admin/categories"
              className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Trade Categories</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Create new training trades, adjust quota allocations, and toggle application intake.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700">
                <span>Manage Categories</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ) : (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 opacity-60 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center mb-3">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-700 text-sm">Trade Categories</h3>
                <p className="text-xs text-slate-500 mt-1">Restricted to Super Administrators.</p>
              </div>
              <span className="text-xs text-slate-400 italic mt-4 pt-3 border-t border-slate-200">
                Super Admin Only
              </span>
            </div>
          )}

          {/* Card 4: Users & RBAC (Super Admin) */}
          {isSuperAdmin ? (
            <Link
              to="/admin/users"
              className="group p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <UserCog className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">Users &amp; RBAC</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect all system user accounts and assign administrative reviewer roles.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>Access RBAC Console</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ) : (
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 opacity-60 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center mb-3">
                  <UserCog className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-700 text-sm">Users &amp; RBAC</h3>
                <p className="text-xs text-slate-500 mt-1">Restricted to Super Administrators.</p>
              </div>
              <span className="text-xs text-slate-400 italic mt-4 pt-3 border-t border-slate-200">
                Super Admin Only
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
