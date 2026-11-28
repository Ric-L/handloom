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
    { icon: LayoutDashboard, label: "Dashboard & Analytics", to: "/admin", exact: true },
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
    <div className="min-h-screen bg-[#F5EFE3] font-sans text-[#3B3028] antialiased flex flex-col">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-[#2A211B]/65 backdrop-blur-xs md:hidden"
        />
      )}

      {/* 1. Affixed Full-Height Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#3B3028] text-[#D9C5A3] border-r border-[#2A211B] flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Portal Identity */}
          <div className="px-5 py-4 border-b border-[#2A211B] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#FAF6EE] px-2 py-1 rounded-xl flex items-center justify-center shrink-0 border border-[#D9C5A3] shadow-xs">
                <img src="/mhhdcl-logo.png" alt="MHHDCL" className="h-9 w-auto object-contain" />
              </div>
              <div className="min-w-0">
                <h2 className="font-serif font-bold text-[#F5EFE3] text-base tracking-tight leading-tight truncate">
                  MHHDC Admin
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isSuperAdmin
                        ? "bg-[#8B5E3C]/30 text-[#F5EFE3] border-[#D9C5A3]/40"
                        : "bg-[#5C6B45]/35 text-[#F5EFE3] border-[#D9C5A3]/30"
                    }`}
                  >
                    {isSuperAdmin && <Crown className="w-2.5 h-2.5 text-[#D9C5A3]" />}
                    {isSuperAdmin ? "Super Admin" : "Reviewer Admin"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-1.5 text-[#D9C5A3] hover:text-[#F5EFE3] rounded-lg hover:bg-[#2A211B]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9C5A3]/60 px-3 mb-2">
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
                        ? "text-[#F5EFE3] bg-[#8B5E3C] shadow-xs"
                        : "text-[#D9C5A3] hover:text-[#F5EFE3] hover:bg-[#2A211B]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#F5EFE3]" : "text-[#D9C5A3]/80"}`} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Pinned Capsule */}
        <div className="p-3 border-t border-[#2A211B] bg-[#2A211B]/80 space-y-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#3B3028] border border-[#D9C5A3]/20 rounded-lg text-[11px] text-[#D9C5A3] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#5C6B45] animate-pulse inline-block shrink-0" />
            <span className="truncate">ACID Quota Guard Active</span>
          </div>

          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#3B3028] border border-[#D9C5A3]/25 rounded-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-[#F5EFE3] shrink-0 ${
                  isSuperAdmin ? "bg-[#8B5E3C]" : "bg-[#5C6B45]"
                }`}
              >
                {isSuperAdmin ? "SA" : "RA"}
              </div>
              <div className="min-w-0 text-left">
                <div className="font-bold text-[#F5EFE3] text-xs font-mono tracking-tight leading-tight truncate">
                  {currentUser?.mobile_number || "9999999999"}
                </div>
                <div className="text-[10px] text-[#D9C5A3]/80 truncate">
                  {isSuperAdmin ? "Super Admin" : "Reviewer Admin"}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign out of Administrator Session"
              className="p-1.5 text-[#D9C5A3] hover:text-[#F5EFE3] hover:bg-[#8B5E3C]/30 rounded-lg transition shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Content Layout */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 min-h-screen">
        {/* Top Security Bar */}
        <div className="bg-[#2A211B] text-[#D9C5A3] text-[11px] px-4 sm:px-8 py-2 border-b border-[#3B3028] flex flex-col sm:flex-row items-center justify-between gap-1.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 font-bold tracking-wider uppercase text-[#D9C5A3]">
              <span className="w-2 h-2 rounded-full bg-[#5C6B45] animate-pulse inline-block" />
              MHHDC Admin Console
            </span>
            <span className="text-[#6E5D50] hidden sm:inline">|</span>
            <span className="text-[#D9C5A3]/80 hidden sm:inline">
              Manipur Handloom &amp; Handicrafts Development Corporation Ltd.
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#D9C5A3]/90">
            <span className="flex items-center gap-1 text-[11px] font-mono">
              <Database className="w-3 h-3" /> ACID Row-Level Locked Quota Guard
            </span>
            <span className="text-[#6E5D50]">|</span>
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D9C5A3] hover:text-[#F5EFE3] flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3 h-3" /> Public Portal
            </Link>
          </div>
        </div>

        {/* Executive Header */}
        <header className="bg-[#FAF6EE] border-b border-[#D9C5A3] shadow-2xs px-4 sm:px-8 py-3.5 sticky top-0 z-30 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-[#3B3028] rounded-lg border border-[#D9C5A3] bg-white hover:bg-[#EDE3D2] transition shrink-0"
                title="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <h1 className="font-serif font-bold text-[#3B3028] text-lg sm:text-xl tracking-tight leading-tight truncate">
                  MHHDC Registration &amp; Admission Console
                </h1>
                <p className="text-xs text-[#6E5D50] font-medium truncate hidden sm:block">
                  District Analytics, Application Review &amp; Seat Quota Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2.5 bg-white border border-[#D9C5A3] px-3 py-1.5 rounded-lg text-xs">
                <span className="text-[#6E5D50]">Signed in:</span>
                <span className="font-bold font-mono text-[#3B3028]">
                  {currentUser?.mobile_number || "9999999999"}
                </span>
              </div>

              <button
                onClick={logout}
                title="Sign out"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#8B5E3C] bg-[#F3EAE2] hover:bg-[#E4D0BA] border border-[#D9C5A3] rounded-lg transition cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto px-4 sm:px-8 py-6 space-y-6 bg-[#F5EFE3]">
          <Outlet />
        </main>

        {/* Footer Compliance Strip */}
        <footer className="bg-[#FAF6EE] border-t border-[#D9C5A3] py-4 px-6 text-center text-xs text-[#6E5D50] shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2">
            <span>
              Manipur Handloom &amp; Handicrafts Development Corporation Ltd. • Admissions &amp; Quota Guard
            </span>
            <span className="font-mono text-[#6E5D50]">
              PostgreSQL ACID Concurrency • PM VIKAS Scheme Quota
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
