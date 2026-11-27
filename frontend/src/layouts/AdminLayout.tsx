import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import type { User } from "../types";
import { logoutUser } from "../api";
import {
  LogOut,
  ExternalLink,
  LayoutDashboard,
  Crown,
  Database,
  FileText,
  Users,
  UserCog,
  Tag,
  ScrollText,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userJson = localStorage.getItem("user");
  let currentUser: User | null = null;
  try {
    if (userJson) currentUser = JSON.parse(userJson);
  } catch {
    currentUser = null;
  }

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
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
          { icon: ScrollText, label: "Audit Ledger", to: "/admin/audit-logs", exact: false },
        ]
      : []),
  ];

  const isActive = (to: string, exact: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-slate-100/80 font-sans text-slate-800 antialiased flex flex-col">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        />
      )}

      {/* 1. Affixed Full-Height Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Section: Brand & Nav */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Portal Identity */}
          <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <img src="/favicon.svg" alt="PM VIKAS" className="w-9 h-9 object-contain drop-shadow" />
              </div>
              <div className="min-w-0">
                <h2 className="font-black text-white text-sm tracking-tight leading-tight truncate">
                  PM VIKAS Portal
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isSuperAdmin
                        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                        : "bg-blue-500/15 text-sky-300 border-blue-500/30"
                    }`}
                  >
                    {isSuperAdmin && <Crown className="w-2.5 h-2.5 text-amber-400" />}
                    {isSuperAdmin ? "Super Admin" : "Reviewer Admin"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
              Navigation Menu
            </div>
            <nav className="flex flex-col gap-1">
              {navItems.map(({ icon: Icon, label, to, exact }) => {
                const active = isActive(to, exact);
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? "text-white bg-blue-600 shadow-sm shadow-blue-950/50"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-white" : "text-slate-400"}`} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Pinned Capsule */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block shrink-0" />
            <span className="truncate">ACID Quota Guard Active</span>
          </div>

          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  isSuperAdmin ? "bg-amber-600" : "bg-blue-600"
                }`}
              >
                {isSuperAdmin ? "SA" : "RA"}
              </div>
              <div className="min-w-0 text-left">
                <div className="font-bold text-white text-xs font-mono tracking-tight leading-tight truncate">
                  {currentUser?.mobile_number || "9999999999"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {isSuperAdmin ? "Super Admin" : "Reviewer Admin"}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out of Administrator Session"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Layout (Permanently offset by sidebar on desktop) */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 min-h-screen">
        {/* National Directorate Security Header Bar */}
        <div className="bg-slate-950 text-slate-300 text-[11px] px-4 sm:px-8 py-2 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-amber-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
              Official Admin Console
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">
              Ministry of Minority Affairs • Pradhan Mantri Virasat Ka Samvardhan (PM VIKAS)
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

        {/* Executive Header */}
        <header className="bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-8 py-3.5 sticky top-0 z-30 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition shrink-0"
                title="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-tight truncate">
                  PM VIKAS Official Portal
                </h1>
                <p className="text-xs text-slate-500 font-medium truncate hidden sm:block">
                  Application Review, Seat Quota Management &amp; Candidate Verification
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-500">Logged as:</span>
                <span className="font-bold font-mono text-slate-900">{currentUser?.mobile_number || "9999999999"}</span>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto px-4 sm:px-8 py-6 space-y-6">
          <Outlet />
        </main>

        {/* Footer Compliance Strip */}
        <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-400 shrink-0">
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
    </div>
  );
}
