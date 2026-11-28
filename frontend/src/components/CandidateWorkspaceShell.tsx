import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus2,
  BookOpen,
  UserCircle2,
  PhoneCall,
  ArrowLeft,
  ChevronRight,
  Bell,
} from "lucide-react";
import type { User } from "../types";

interface CandidateWorkspaceShellProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: React.ReactNode;
}

export default function CandidateWorkspaceShell({
  title,
  subtitle,
  eyebrow = "CANDIDATE PORTAL",
  children,
}: CandidateWorkspaceShellProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab");

  let user: User | null = null;
  try {
    const raw = localStorage.getItem("user");
    if (raw) user = JSON.parse(raw);
  } catch {
    user = null;
  }

  const navItems = [
    {
      label: "My dashboard",
      to: "/dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/dashboard" && currentTab !== "profile",
    },
    {
      label: "New application",
      to: "/apply",
      icon: FilePlus2,
      active: location.pathname.startsWith("/apply"),
    },
    {
      label: "Training trades",
      to: "/categories",
      icon: BookOpen,
      active: location.pathname === "/categories",
    },
    {
      label: "My profile",
      to: "/dashboard?tab=profile",
      icon: UserCircle2,
      active: location.pathname === "/dashboard" && currentTab === "profile",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Editorial Portal Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[#D9C5A3]">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5C6B45] block">
            {eyebrow}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#3B3028] leading-tight">
            {title}
          </h1>
          <p className="text-sm text-[#6E5D50]">{subtitle}</p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#D9C5A3] text-xs font-medium text-[#3B3028] self-start sm:self-auto shadow-2xs">
          <UserCircle2 className="w-4 h-4 text-[#5C6B45]" />
          <span>{user?.full_name || user?.mobile_number || "Signed-in Applicant"}</span>
          {user?.district && (
            <span className="text-[11px] text-[#8B5E3C] font-semibold border-l border-[#D9C5A3] pl-2">
              {user.district}
            </span>
          )}
        </div>
      </div>

      {/* Left Sidebar + Right Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white border border-[#D9C5A3] rounded-2xl p-4 space-y-4 shadow-2xs">
            <div className="px-2 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E5D50]">
                YOUR ACCOUNT
              </span>
            </div>

            <nav className="space-y-1" aria-label="Candidate navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition ${
                      item.active
                        ? "bg-[#EEF2E7] text-[#3E492D] font-semibold border border-[#5C6B45]/30"
                        : "text-[#3B3028] hover:bg-[#FAF6EE] font-medium border border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          item.active ? "text-[#5C6B45]" : "text-[#8B5E3C]"
                        }`}
                      />
                      <span>{item.label}</span>
                    </span>
                    {item.active && <ChevronRight className="w-4 h-4 text-[#5C6B45]" />}
                  </Link>
                );
              })}
            </nav>

            {/* Support Box */}
            <div className="bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl p-4 space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#EEF2E7] text-[#5C6B45] flex items-center justify-center border border-[#5C6B45]/25">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-[#3B3028]">Need a hand?</h3>
              <p className="text-[11px] text-[#6E5D50] leading-relaxed">
                Visit MHHDC HQ at Governor Road, Paona Bazar, Imphal for assistance.
              </p>
              <a
                href="tel:03852451495"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5C6B45] hover:underline pt-0.5"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 0385-245 1495</span>
              </a>
            </div>

            <div className="pt-2 border-t border-[#E9DEC8]">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-[#6E5D50] hover:text-[#3B3028] transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to public home</span>
              </Link>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-9 min-w-0">{children}</div>
      </div>
    </div>
  );
}
