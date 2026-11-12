import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import type { User } from "../types";
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Shield,
  Layers,
  FileCheck2,
  PhoneCall,
  Home,
  CheckCircle,
} from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  let user: User | null = null;
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch {
    user = null;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/categories", label: "Artisan Trades", icon: Layers },
    ...(token
      ? [
          { to: "/apply", label: "New Application", icon: FileCheck2 },
          { to: "/dashboard", label: "My Applications", icon: CheckCircle },
        ]
      : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. National Tricolor Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

      {/* 2. Top Government Banner */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 sm:px-8 py-2 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400">
            <span className="text-amber-400 font-bold uppercase tracking-wider">Official Portal</span>
            <span>•</span>
            <span>Directorate of Handloom & Skilled Artisan Development</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-300">
              <PhoneCall className="w-3 h-3 text-emerald-400" /> Toll-Free Helpline: 1800-200-7890
            </span>
            <span className="text-slate-600">|</span>
            <Link
              to="/admin/login"
              className="text-slate-400 hover:text-white flex items-center gap-1 transition font-medium"
            >
              <Shield className="w-3 h-3 text-primary-400" /> Admin Moderation Console
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          {/* Logo & Identity */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-800 to-primary-950 rounded-2xl flex items-center justify-center text-2xl shadow-md shadow-primary-950/20 group-hover:scale-105 transition-transform duration-200">
              🧵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-950">
                  Kala<span className="text-primary-700">Kriti</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-900 px-2 py-0.5 rounded-full border border-primary-200 hidden sm:inline-block">
                  Govt. Accredited
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium -mt-0.5">
                Handloom & Skilled Artisan Skill Development Portal
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map(link => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    active
                      ? "bg-primary-50 text-primary-800 border border-primary-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? "text-primary-700" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth Controls */}
          <div className="hidden md:flex items-center gap-3">
            {token ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  <UserIcon className="w-4 h-4 text-primary-700" />
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {user?.mobile_number || "Candidate"}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition"
                >
                  Candidate Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary-700 hover:bg-primary-800 shadow-sm shadow-primary-900/20 transition"
                >
                  New Registration
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-5 space-y-2">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive(link.to) ? "bg-primary-50 text-primary-800" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {token ? (
                <>
                  <div className="px-3 py-1.5 text-xs text-slate-500 font-mono">
                    Logged in as: {user?.mobile_number}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700"
                  >
                    Candidate Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center py-2.5 rounded-xl text-xs font-bold text-white bg-primary-700"
                  >
                    New Registration
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 4. Main Body Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <Outlet />
      </main>

      {/* 5. Modern Government Portal Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-extrabold text-lg">
                <span>🧵</span> KalaKriti Handloom Portal
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                An affirmative action skill development mission aimed at empowering traditional weavers, textile
                artisans, and rural craft practitioners through certified vocational training.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">Accredited Trades</h4>
              <ul className="space-y-1.5 text-slate-400 text-xs">
                <li>• Jacquard & Loin Loom Weaving</li>
                <li>• Traditional Hand Embroidery</li>
                <li>• Bamboo Craft & Applique Art</li>
                <li>• Traditional Painting & Carpet Weaving</li>
                <li>• Fashion & Home Furnishings Merchandiser</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">Trainee Entitlements</h4>
              <ul className="space-y-1.5 text-slate-400 text-xs">
                <li>• Free Training & Consumables</li>
                <li>• Direct Benefit Transfer (DBT) Monthly Stipend</li>
                <li>• Government Recognized NSQF Skill Certificate</li>
                <li>• Cooperative & Handloom Cluster Onboarding</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">Helpdesk & Support</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                Toll-Free National Artisan Careline:
                <strong className="block text-emerald-400 text-sm mt-0.5">1800-200-7890</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Email Support: helpdesk@handloom.artisan.gov.in
                <br />
                Operating Hours: 09:30 AM to 06:00 PM (Mon-Sat)
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              © 2026 Directorate of Handloom & Skilled Artisan Development. All Rights Reserved.
            </div>
            <div className="flex gap-4">
              <Link to="/categories" className="hover:text-slate-300">
                Trades
              </Link>
              <Link to="/apply" className="hover:text-slate-300">
                Apply Online
              </Link>
              <Link to="/admin/login" className="hover:text-slate-300">
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
