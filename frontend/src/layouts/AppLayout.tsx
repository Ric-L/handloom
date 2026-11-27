import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import type { User } from "../types";
import { logoutUser } from "../api";
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
  Film,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  let user: User | null = null;
  try {
    if (userJson) user = JSON.parse(userJson);
  } catch {
    user = null;
  }

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    badge?: string;
  }

  const navLinks: NavItem[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/#trades", label: "Artisan Trades", icon: Layers },
    { to: "/#project-media", label: "Media & Films", icon: Film },
    ...(token
      ? [
          { to: "/apply", label: "New Application", icon: FileCheck2 },
          { to: "/dashboard", label: "My Applications", icon: CheckCircle },
        ]
      : []),
  ];

  const isActive = (path: string) => {
    if (path.startsWith("/#")) {
      return location.pathname === "/" && location.hash === path.replace("/", "");
    }
    return location.pathname === path && !location.hash;
  };

  const handleNavClick = (to: string) => {
    setMobileMenuOpen(false);
    if (to.startsWith("/#")) {
      const hash = to.replace("/", "");
      if (location.pathname !== "/") {
        navigate(to);
      } else {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 1. Official Blue Gradient Accent Strip */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-900 via-sky-400 to-indigo-800 shadow-xs" />

      {/* 2. Top Administrative Utility Banner */}
      <div className="bg-slate-950 text-slate-300 text-[11px] px-4 sm:px-8 py-1 border-b border-slate-800/80">
        <div className="max-w-7xl 2xl:max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-4">
          {/* Left: Official Authority Notice */}
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider bg-amber-400 text-slate-950 uppercase shadow-xs">
              Official Portal
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 font-semibold tracking-wide">
              Ministry of Minority Affairs • Government of India | PM VIKAS Portal
            </span>
          </div>

          {/* Right: Helpline & Admin Link */}
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="tel:18002007890"
              className="flex items-center gap-1.5 text-slate-300 hover:text-sky-300 transition font-medium"
            >
              <PhoneCall className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Toll-Free Helpline:</span>
              <strong className="text-sky-400 font-bold">1800 200 7890</strong>
            </a>
            <span className="text-slate-700">|</span>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition font-medium"
            >
              <Shield className="w-3 h-3 text-blue-400" />
              <span>Admin Moderation Console</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200/80 py-1.5"
            : "bg-white border-b border-slate-200 py-1.5 sm:py-2"
        }`}
      >
        <div className="max-w-7xl 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Brand Identity / Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            {/* Official State Emblem of India */}
            <img
              src="/emblem-india.png"
              alt="State Emblem of India"
              className="h-8 sm:h-9 w-auto object-contain shrink-0 hidden sm:block drop-shadow-xs"
            />
            {/* PM VIKAS Emblem Logo */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-200 shrink-0">
              <img
                src="/favicon.svg"
                alt="PM VIKAS Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-xs"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-slate-950 font-serif leading-none">
                  PM <span className="text-blue-700 font-sans">VIKAS</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  MoMA Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-600 font-semibold tracking-tight mt-0.5 leading-none hidden md:block">
                Pradhan Mantri Virasat Ka Samvardhan • प्रधानमंत्री विरासत का संवर्धन
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return link.to.startsWith("/#") ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.to);
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-blue-50 text-blue-800 border border-blue-200/90 shadow-xs"
                      : "text-slate-600 hover:text-blue-700 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-blue-700" : "text-slate-400 group-hover:text-blue-600"}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black tracking-wide bg-amber-400 text-slate-950 uppercase">
                      {link.badge}
                    </span>
                  )}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? "bg-blue-50 text-blue-800 border border-blue-200/90 shadow-xs"
                      : "text-slate-600 hover:text-blue-700 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? "text-blue-700" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Official Skill India Partner Logo (Desktop) */}
          <div className="hidden xl:flex items-center border-l border-slate-200 pl-3 my-0.5 shrink-0">
            <img
              src="/skill-india-logo.png"
              alt="Skill India - Kaushal Bharat, Kushal Bharat"
              className="h-7 max-h-7 w-auto object-contain opacity-90 hover:opacity-100 transition"
            />
          </div>

          {/* Right Action Controls */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {token ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 px-3 py-1.5 rounded-lg border border-slate-200 transition"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <UserIcon className="w-3.5 h-3.5 text-blue-700" />
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {user?.mobile_number || "Candidate"}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-blue-800 hover:bg-blue-50/60 border border-slate-300 hover:border-blue-300 transition whitespace-nowrap"
                >
                  Candidate Login
                </Link>
                <Link
                  to="/apply"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black text-white bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 shadow-md shadow-blue-900/20 hover:shadow-lg transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                  <span>Apply Online</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2.5 rounded-xl text-slate-700 hover:text-blue-800 hover:bg-slate-100 border border-slate-200 transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-2.5 animate-in slide-in-from-top-2 duration-200 shadow-xl">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-2 mb-1">
              Main Navigation
            </div>
            {navLinks.map((link) =>
              link.to.startsWith("/#") ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.to);
                  }}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-blue-800 hover:bg-blue-50/60"
                >
                  <div className="flex items-center gap-2.5">
                    <link.icon className="w-4 h-4 text-blue-700" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                      {link.badge}
                    </span>
                  )}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-bold transition ${
                    isActive(link.to)
                      ? "bg-blue-50 text-blue-800 border border-blue-200"
                      : "text-slate-700 hover:text-blue-800 hover:bg-blue-50/60"
                  }`}
                >
                  <link.icon className="w-4 h-4 text-blue-700" />
                  <span>{link.label}</span>
                </Link>
              )
            )}

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
                    className="w-full text-left px-3.5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Candidate Login
                  </Link>
                  <Link
                    to="/apply"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 shadow"
                  >
                    Apply Online
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 4. Main Body Content */}
      <main className={`flex-1 w-full ${location.pathname === "/" ? "" : "max-w-7xl 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-8"}`}>
        <Outlet />
      </main>

      {/* 5. Modern Government Portal Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 mt-20">
        <div className="max-w-7xl 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-white font-extrabold text-lg">
                <img src="/favicon.svg" alt="PM VIKAS" className="w-8 h-8 object-contain" />
                <span>PM VIKAS Portal</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Pradhan Mantri Virasat Ka Samvardhan (PM VIKAS) is a flagship central sector scheme implemented by the Ministry of Minority Affairs, Government of India, dedicated to skilling, entrepreneurship, and livelihood support for traditional artisans.
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
                <strong className="block text-sky-400 text-sm mt-0.5 font-bold">1800 200 7890</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Email Support: helpdesk@handloomproject.gov.in
                <br />
                Operating Hours: 09:30 AM to 06:00 PM (Mon-Sat)
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 text-center flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              © 2026 Ministry of Minority Affairs, Government of India (PM VIKAS). All Rights Reserved.
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
