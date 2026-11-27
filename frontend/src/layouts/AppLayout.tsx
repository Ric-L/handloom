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
  PhoneCall,
  HelpCircle,
} from "lucide-react";

type TextScale = "sm" | "md" | "lg";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>(() => {
    return (localStorage.getItem("portal_text_scale") as TextScale) || "md";
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (textScale === "sm") root.style.fontSize = "15px";
    else if (textScale === "lg") root.style.fontSize = "18px";
    else root.style.fontSize = "16px";
    localStorage.setItem("portal_text_scale", textScale);
  }, [textScale]);

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

  const navLinks = [
    { to: "/", label: "HOME" },
    { to: "/#track-status", label: "APPLICATION STATUS" },
    { to: "/categories", label: "TRAINING COURSES" },
    { to: "/dashboard", label: "VERIFY / DOWNLOAD SLIP" },
    ...(token ? [{ to: "/apply", label: "APPLY ONLINE" }] : []),
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
        setTimeout(() => {
          document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
        }, 120);
      } else {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-800">
      {/* Slim Top Accessibility & Helpline Strip */}
      <div className="bg-slate-900 text-slate-200 text-[11px] px-4 sm:px-6 lg:px-8 py-1 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-300">Government of India</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 hidden sm:inline">Ministry of Minority Affairs • PM VIKAS</span>
          </div>

          <div className="flex items-center gap-3">
            <a href="tel:18002007890" className="flex items-center gap-1 text-slate-200 hover:text-amber-300 transition">
              <PhoneCall className="w-3 h-3 text-amber-400" />
              <span>Helpline: <strong>1800 200 7890</strong></span>
            </a>

            <span className="text-slate-700 hidden sm:inline">|</span>

            <div className="hidden sm:flex items-center gap-1" role="group" aria-label="Text size">
              {(["sm", "md", "lg"] as TextScale[]).map((size, idx) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTextScale(size)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    textScale === size ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {idx === 0 ? "A-" : idx === 1 ? "A" : "A+"}
                </button>
              ))}
            </div>

            <span className="text-slate-700">|</span>

            <Link to="/admin/login" className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition">
              <Shield className="w-3 h-3 text-sky-400" />
              <span>Official Login</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Clean White e-Seba Style Main Header */}
      <header
        className={`sticky top-0 z-40 bg-white transition-shadow duration-200 border-b border-slate-200/80 ${
          scrolled ? "shadow-md" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Left: Emblem + PM VIKAS Brand Lockup */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/emblem-india.png"
              alt="State Emblem of India"
              className="h-10 w-auto object-contain shrink-0"
            />
            <div className="leading-tight">
              <div className="text-xs font-bold text-amber-600 tracking-wide">
                प्रधानमंत्री विरासत का संवर्धन
              </div>
              <div className="text-lg font-extrabold text-emerald-800 tracking-tight font-serif">
                PM VIKAS <span className="text-[#0f256e] font-sans font-bold text-sm">Portal</span>
              </div>
            </div>
          </Link>

          {/* Center: Clean Uppercase Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
            {navLinks.map((link) =>
              link.to.startsWith("/#") ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.to);
                  }}
                  className={`text-xs font-semibold tracking-wider transition cursor-pointer ${
                    isActive(link.to)
                      ? "text-[#0f256e] font-bold"
                      : "text-slate-700 hover:text-[#0f256e]"
                  }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-xs font-semibold tracking-wider transition ${
                    isActive(link.to)
                      ? "text-[#0f256e] font-bold"
                      : "text-slate-700 hover:text-[#0f256e]"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right: Solid Deep Navy LOGIN Button (or Account Controls) */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {token ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#0f256e]" />
                  <span>{user?.mobile_number || "My Account"}</span>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>LOGOUT</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2.5 rounded-md text-xs font-bold tracking-wider uppercase text-white bg-[#0f256e] hover:bg-blue-950 shadow-xs transition"
              >
                LOGIN
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-2 shadow-lg">
            {navLinks.map((link) =>
              link.to.startsWith("/#") ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.to);
                  }}
                  className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-2 border-t border-slate-100">
              {token ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 rounded-lg"
                >
                  LOGOUT ({user?.mobile_number})
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 rounded-md text-xs font-bold uppercase tracking-wider text-white bg-[#0f256e]"
                >
                  LOGIN
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 w-full bg-slate-50 ${
          location.pathname === "/" ? "" : "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        }`}
      >
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 text-sm border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-white font-bold text-lg">
                <img src="/favicon.svg" alt="PM VIKAS" className="w-8 h-8 object-contain" />
                <span>PM VIKAS Citizen Portal</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                An initiative of the Ministry of Minority Affairs, Government of India, providing free skill training, monthly stipend, and toolkits to traditional artisans and weavers.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-3">Quick Links</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li><Link to="/categories" className="hover:text-amber-300 transition">Training Courses</Link></li>
                <li><Link to="/apply" className="hover:text-amber-300 transition">Apply for Training</Link></li>
                <li><Link to="/dashboard" className="hover:text-amber-300 transition">My Submitted Applications</Link></li>
                <li><Link to="/login" className="hover:text-amber-300 transition">Citizen Sign In / Register</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Need Help?
              </h4>
              <p className="text-sm text-slate-300 mb-2">
                Toll-Free Helpline:
                <strong className="block text-amber-300 text-base mt-0.5">1800 200 7890</strong>
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Email: helpdesk@handloomproject.gov.in
                <br />
                Hours: 9:30 AM to 6:00 PM (Monday – Saturday)
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div>© 2026 Ministry of Minority Affairs, Government of India (PM VIKAS). All Rights Reserved.</div>
            <div className="flex gap-5">
              <Link to="/categories" className="hover:text-white">Courses</Link>
              <Link to="/apply" className="hover:text-white">Apply</Link>
              <Link to="/admin/login" className="hover:text-white">Official Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
