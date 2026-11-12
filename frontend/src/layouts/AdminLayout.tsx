import { Link, Outlet, useNavigate } from "react-router-dom";
import type { User } from "../types";
import { ShieldCheck, LogOut, ExternalLink, LayoutDashboard } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const userJson = localStorage.getItem("user");
  let currentUser: User | null = null;
  try {
    if (userJson) currentUser = JSON.parse(userJson);
  } catch {
    currentUser = null;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Top Government Portal Bar */}
      <div className="bg-gray-950 text-gray-300 text-[11px] px-6 py-1.5 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary-400">Government of India / State Directorate of Handloom</span>
          <span className="text-gray-600">•</span>
          <span>Official Skilled Artisan Skill Development & Admission Mission</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-white flex items-center gap-1 transition">
            <ExternalLink className="w-3 h-3" /> Public Candidate Portal
          </Link>
        </div>
      </div>

      {/* Main Admin Navigation Header */}
      <header className="bg-white border-b border-gray-200 shadow-xs px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-800 rounded-xl flex items-center justify-center text-white shadow-md shadow-primary-900/20">
              <ShieldCheck className="w-6 h-6 text-primary-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-gray-900 text-lg leading-tight tracking-tight">
                  Handloom Moderation Portal
                </h1>
                <span className="text-[10px] font-mono uppercase bg-primary-100 text-primary-800 font-bold px-2 py-0.5 rounded-full border border-primary-200">
                  {currentUser?.role || "ADMIN"}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Autonomous Atomic Quota Enforcement & Application Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <Link
                to="/admin"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-gray-900 shadow-xs flex items-center gap-1.5 transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-primary-700" /> Dashboard & Moderation
              </Link>
            </nav>

            <div className="h-6 w-px bg-gray-200"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-gray-900">{currentUser?.mobile_number}</div>
                <div className="text-[10px] text-gray-500 capitalize">
                  {currentUser?.role === "SUPER_ADMIN" ? "Super Administrator" : "Reviewer Administrator"}
                </div>
              </div>

              <button
                onClick={logout}
                title="Sign out of Administrator Session"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-500 mt-12">
        <p>
          Handloom & Skilled Artisan Portal • Secure Administrative Console • Row-Level Locked Quota Enforcement
        </p>
      </footer>
    </div>
  );
}
