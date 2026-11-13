import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import type { User } from "../types";
import {
  ShieldCheck,
  LogOut,
  ExternalLink,
  LayoutDashboard,
  Crown,
  Database,
  FileText,
  Users,
  UserCog,
  Tag,
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const userJson = localStorage.getItem("user");
  let currentUser: User | null = null;
  try {
    if (userJson) currentUser = JSON.parse(userJson);
  } catch {
    currentUser = null;
  }

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/admin", exact: true },
    { icon: FileText, label: "Applications", to: "/admin/applications", exact: false },
    { icon: Users, label: "Candidates", to: "/admin/candidates", exact: false },
    ...(isSuperAdmin
      ? [
          { icon: UserCog, label: "Users & RBAC", to: "/admin/users", exact: false },
          { icon: Tag, label: "Trade Categories", to: "/admin/categories", exact: false },
        ]
      : []),
  ];

  const isActive = (to: string, exact: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col font-sans text-slate-800 antialiased">
      {/* 1. National Directorate Security Header Bar */}
      <div className="bg-slate-950 text-slate-300 text-[11px] px-4 sm:px-8 py-2 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-1.5">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-amber-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            Official Admin Console
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            Ministry of Textiles • Directorate of Handloom &amp; Skilled Artisan Development
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span className="flex items-center gap-1 text-[11px] text-sky-400 font-mono">
            <Database className="w-3 h-3" /> ACID Row-Level Locked Quota Guard
          </span>
          <span className="text-slate-700">|</span>
          <Link
            to="/"
            target="_blank"
            className="text-slate-400 hover:text-white flex items-center gap-1 transition"
          >
            <ExternalLink className="w-3 h-3 text-sky-400" /> Public Portal
          </Link>
        </div>
      </div>

      {/* 2. Executive Navigation & Profile Header */}
      <header className="bg-white border-b border-slate-200/90 shadow-xs px-4 sm:px-8 py-3.5 sticky top-0 z-40">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-950 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-950/20 border border-blue-700/30">
              <ShieldCheck className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-black text-slate-950 text-lg sm:text-xl tracking-tight leading-tight">
                  Handloom Moderation Command Center
                </h1>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${
                    isSuperAdmin
                      ? "bg-amber-50 text-amber-800 border-amber-300/80"
                      : "bg-blue-50 text-blue-800 border-blue-300/80"
                  }`}
                >
                  {isSuperAdmin && <Crown className="w-3 h-3 text-amber-600" />}
                  {isSuperAdmin ? "Super Admin" : "Reviewer Admin"}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">
                Autonomous Atomic Quota Enforcement &amp; Verification Dossier Management
              </p>
            </div>
          </div>

          {/* Right Header: Admin Identity & Logout */}
          <div className="flex items-center gap-4">
            <div className="h-7 w-px bg-slate-200 hidden sm:block" />

            {/* Admin User Capsule */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold text-white shadow-xs ${
                    isSuperAdmin ? "bg-amber-600" : "bg-blue-700"
                  }`}
                >
                  {currentUser?.role === "SUPER_ADMIN" ? "SA" : "RA"}
                </div>
                <div className="text-left text-xs">
                  <div className="font-extrabold text-slate-900 font-mono tracking-tight leading-tight">
                    {currentUser?.mobile_number || "9999999999"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {isSuperAdmin ? "Super Administrator" : "Reviewer Administrator"}
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out of Administrator Session"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Sidebar + Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col py-4 sticky top-[calc(var(--header-height,0px))] self-start min-h-[calc(100vh-7rem)]">
          <nav className="flex flex-col gap-1 mt-2">
            {navItems.map(({ icon: Icon, label, to, exact }) => {
              const active = isActive(to, exact);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl mx-2 text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? "text-white bg-blue-700 shadow-lg shadow-blue-900/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto px-6 py-8 space-y-6">
          <Outlet />
        </main>
      </div>

      {/* 4. Footer Compliance Strip */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-400">
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
          <span>
            Handloom &amp; Skilled Artisan Development Initiative • Administrative Moderation &amp; Quota Guard
          </span>
          <span className="font-mono text-slate-500">
            PostgreSQL ACID Concurrency • 3,020 Target Quota Allocation
          </span>
        </div>
      </footer>
    </div>
  );
}
