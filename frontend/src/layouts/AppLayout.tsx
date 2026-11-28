import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import type { User } from "../types";
import { logoutUser } from "../api";
import TrackStatusModal from "../components/TrackStatusModal";
import {
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Shield,
  PhoneCall,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

type TextScale = "sm" | "md" | "lg";

export interface AppOutletContext {
  openTrackModal: () => void;
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
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

  useEffect(() => {
    setPortalDropdownOpen(false);
  }, [location.pathname, location.hash]);

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
    { to: "/", label: "Overview" },
    { to: "/categories", label: "Training trades" },
    { to: "/#pm-vikas-scheme", label: "Eligibility" },
    { to: "#track-modal", label: "Track status" },
    ...(token ? [{ to: "/dashboard", label: "My portal" }] : []),
  ];

  const isActive = (path: string) => {
    if (path === "#track-modal") {
      return location.pathname.startsWith("/track");
    }
    if (path.startsWith("/#")) {
      return location.pathname === "/" && location.hash === path.replace("/", "");
    }
    return location.pathname === path && !location.hash;
  };

  const handleNavClick = (to: string) => {
    setMobileMenuOpen(false);
    if (to === "#track-modal") {
      setTrackModalOpen(true);
      return;
    }
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
    <div className="min-h-screen bg-[#F5EFE3] flex flex-col font-sans text-[#3B3028]">
      {/* Slim Deep Earth Top Strip */}
      <div className="bg-[#2A211B] text-[#D9C5A3] text-[11px] px-4 sm:px-6 lg:px-8 py-1.5 border-b border-[#3B3028]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#F5EFE3]">
              Manipur Handloom &amp; Handicrafts Development Corporation Ltd.
            </span>
            <span className="text-[#8D7B6D] hidden sm:inline">|</span>
            <span className="text-[#D9C5A3]/85 hidden sm:inline">Paona Bazar, Imphal 795001</span>
          </div>

          <div className="flex items-center gap-3">
            <a href="tel:03852451495" className="flex items-center gap-1 text-[#D9C5A3] hover:text-[#F5EFE3] transition">
              <PhoneCall className="w-3 h-3 text-[#D9C5A3]" />
              <span>
                Help &amp; support: <strong className="text-[#F5EFE3]">0385-245 1495</strong>
              </span>
            </a>

            <span className="text-[#6E5D50] hidden sm:inline">|</span>

            <div className="hidden sm:flex items-center gap-1" role="group" aria-label="Text size">
              {(["sm", "md", "lg"] as TextScale[]).map((size, idx) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setTextScale(size)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${textScale === size
                    ? "bg-[#8B5E3C] text-[#F5EFE3]"
                    : "bg-[#3B3028] text-[#D9C5A3] hover:bg-[#5C6B45]"
                    }`}
                >
                  {idx === 0 ? "A-" : idx === 1 ? "A" : "A+"}
                </button>
              ))}
            </div>

            <span className="text-[#6E5D50]">|</span>

            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1 text-[#D9C5A3] hover:text-[#F5EFE3] transition"
            >
              <Shield className="w-3 h-3 text-[#D9C5A3]" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Clean Sticky Header */}
      <header
        className={`sticky top-0 z-40 bg-[#FAF6EE]/95 backdrop-blur-md transition-shadow duration-200 border-b border-[#D9C5A3] ${scrolled ? "shadow-sm" : ""
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Left: MHHDCL Brand Lockup */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img
              src="/mhhdcl-logo.png"
              alt="Manipur Handloom and Handicrafts Development Corporation Ltd."
              className="h-12 w-auto object-contain shrink-0"
            />
            <div className="leading-tight">
              <div className="text-[10px] sm:text-[11px] font-bold text-[#5C6B45] tracking-[0.14em] uppercase">
                MHHDCL
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-[#3B3028] tracking-tight leading-snug max-w-[200px] sm:max-w-[260px]">
                Manipur Handloom &amp; Handicrafts Development Corp. Ltd.
              </div>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Main navigation">
            {navLinks.map((link) =>
              link.to === "#track-modal" ? (
                <button
                  key={link.to}
                  type="button"
                  onClick={() => handleNavClick(link.to)}
                  className={`text-sm font-medium transition cursor-pointer ${
                    isActive(link.to)
                      ? "text-[#8B5E3C] font-semibold underline decoration-[#8B5E3C] underline-offset-8"
                      : "text-[#3B3028] hover:text-[#8B5E3C]"
                  }`}
                >
                  {link.label}
                </button>
              ) : link.to.startsWith("/#") ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.to);
                  }}
                  className={`text-sm font-medium transition cursor-pointer ${isActive(link.to)
                    ? "text-[#8B5E3C] font-semibold underline decoration-[#8B5E3C] underline-offset-8"
                    : "text-[#3B3028] hover:text-[#8B5E3C]"
                    }`}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-medium transition ${isActive(link.to)
                    ? "text-[#8B5E3C] font-semibold underline decoration-[#8B5E3C] underline-offset-8"
                    : "text-[#3B3028] hover:text-[#8B5E3C]"
                    }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0 relative">
            <a
              href="tel:03852451495"
              title="Imphal Head Office Helpline: 0385-245 1495"
              className="w-9 h-9 rounded-full border border-[#D9C5A3] bg-white flex items-center justify-center text-[#6E5D50] hover:text-[#3B3028] hover:border-[#8B5E3C] transition"
            >
              <HelpCircle className="w-4 h-4" />
            </a>

            {token ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-[#EFE7D6] text-[#3B3028] border border-[#D9C5A3] transition"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#5C6B45]" />
                  <span>{user?.full_name?.split(" ")[0] || user?.mobile_number || "My Account"}</span>
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-[#8B5E3C] bg-[#F3EAE2] hover:bg-[#E4D0BA] border border-[#D9C5A3] transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPortalDropdownOpen((o) => !o)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-[#F5EFE3] bg-[#8B5E3C] hover:bg-[#734C30] border border-[#734C30] shadow-xs transition cursor-pointer"
                >
                  <span>Login/Sign Up</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {portalDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#FAF6EE] border border-[#D9C5A3] rounded-xl shadow-lg py-1.5 z-50">
                    <Link
                      to="/login"
                      onClick={() => setPortalDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-[#3B3028] hover:bg-[#EDE3D2] transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setPortalDropdownOpen(false)}
                      className="block px-4 py-2.5 text-sm font-semibold text-[#8B5E3C] hover:bg-[#EDE3D2] transition border-t border-[#E9DEC8]"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-lg text-[#3B3028] hover:bg-[#EDE3D2] border border-[#D9C5A3]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FAF6EE] border-t border-[#D9C5A3] px-4 py-4 space-y-2 shadow-lg">
            {navLinks.map((link) =>
              link.to === "#track-modal" ? (
                <button
                  key={link.to}
                  type="button"
                  onClick={() => handleNavClick(link.to)}
                  className="w-full text-left block px-4 py-2.5 rounded-lg text-sm font-medium text-[#3B3028] hover:bg-[#EDE3D2] cursor-pointer"
                >
                  {link.label}
                </button>
              ) : link.to.startsWith("/#") ? (
                <a
                  key={link.to}
                  href={link.to}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.to);
                  }}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#3B3028] hover:bg-[#EDE3D2]"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium text-[#3B3028] hover:bg-[#EDE3D2]"
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-2 border-t border-[#D9C5A3] space-y-2">
              {token ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#8B5E3C] hover:bg-[#EDE3D2] rounded-lg"
                >
                  Sign Out ({user?.mobile_number})
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 rounded-lg text-xs font-semibold text-[#F5EFE3] bg-[#8B5E3C]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-center py-2.5 rounded-lg text-xs font-semibold text-[#3B3028] border border-[#D9C5A3] bg-white"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main
        className={`flex-1 w-full bg-[#F5EFE3] ${location.pathname === "/" ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          }`}
      >
        <Outlet context={{ openTrackModal: () => setTrackModalOpen(true) } satisfies AppOutletContext} />
      </main>

      <TrackStatusModal
        isOpen={trackModalOpen}
        onClose={() => setTrackModalOpen(false)}
      />

      {/* Deep Earth Footer */}
      <footer className="bg-[#2A211B] text-[#D9C5A3] text-sm border-t border-[#3B3028]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[#F5EFE3] font-bold text-base leading-snug">
                <span className="bg-[#FAF6EE] rounded-xl px-2 py-1.5 shadow-xs shrink-0 inline-flex items-center justify-center border border-[#D9C5A3]">
                  <img src="/mhhdcl-logo.png" alt="MHHDCL" className="h-10 w-auto object-contain" />
                </span>
                <span className="font-serif text-lg">
                  Manipur Handloom &amp; Handicrafts Development Corporation Ltd.
                </span>
              </div>
              <p className="text-[#D9C5A3]/85 text-xs sm:text-sm leading-relaxed">
                Registration and admission portal operated by Manipur Handloom &amp; Handicrafts Development Corporation Ltd. (MHHDC) for residential skill training programmes conducted under the PM VIKAS Scheme.
              </p>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5EFE3] mb-3">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm text-[#D9C5A3]">
                <li>
                  <Link to="/categories" className="hover:text-[#F5EFE3] transition">
                    Training Courses
                  </Link>
                </li>
                <li>
                  <Link to="/apply" className="hover:text-[#F5EFE3] transition">
                    Apply for Training
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="hover:text-[#F5EFE3] transition">
                    My Submitted Applications
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#F5EFE3] transition">
                    Login / Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F5EFE3] mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#D9C5A3]" />
                Need Assistance?
              </h4>
              <p className="text-sm text-[#D9C5A3] mb-2">
                Imphal Head Office:
                <strong className="block font-serif text-[#F5EFE3] text-xl mt-0.5">
                  0385-245 1495
                </strong>
              </p>
              <p className="text-xs text-[#D9C5A3]/80 leading-relaxed">
                Governor Road, Paona Bazar, Imphal 795001
                <br />
                Hours: 9:30 AM to 6:00 PM (Monday – Saturday)
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#3B3028] flex flex-col sm:flex-row items-center justify-between text-xs text-[#D9C5A3]/75 gap-3">
            <div>© 2026 Manipur Handloom and Handicrafts Development Corporation Ltd. All Rights Reserved.</div>
            <div className="flex gap-5">
              <Link to="/categories" className="hover:text-[#F5EFE3]">
                Courses
              </Link>
              <Link to="/apply" className="hover:text-[#F5EFE3]">
                Apply
              </Link>
              <Link to="/admin/login" className="hover:text-[#F5EFE3]">
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
