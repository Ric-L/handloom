import React from "react";
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from "lucide-react";

interface SessionTimeoutModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
  maxSeconds?: number;
}

export default function SessionTimeoutModal({
  isOpen,
  secondsRemaining,
  onExtend,
  onLogout,
  maxSeconds = 45,
}: SessionTimeoutModalProps) {
  if (!isOpen) return null;

  // Calculate percentage of remaining time
  const percentRemaining = Math.max(0, Math.min(100, (secondsRemaining / maxSeconds) * 100));

  // Determine urgency color
  const isUrgent = secondsRemaining <= 15;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#FAF6EE] rounded-2xl shadow-2xl border border-[#D9C5A3] overflow-hidden text-[#3B3028]">
        {/* Header Banner */}
        <div className="bg-[#3B3028] text-[#F5EFE3] px-5 py-3.5 flex items-center justify-between border-b border-[#2A211B]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9C5A3] animate-ping inline-block" />
            <span className="font-semibold text-xs tracking-wider uppercase text-[#D9C5A3]">
              MHHDC Portal Security Control
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#D9C5A3]/80">Idle Guard</span>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center bg-white">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#F5EFE3] border-2 border-[#D9C5A3] flex items-center justify-center text-[#8B5E3C] mb-4 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2
            id="session-timeout-title"
            className="font-serif text-xl font-bold text-[#3B3028] mb-1.5"
          >
            Session Inactivity Warning
          </h2>

          <p className="text-xs text-[#6E5D50] leading-relaxed mb-5">
            In compliance with portal security policies, your authenticated session will automatically expire after{" "}
            <span className="font-semibold text-[#3B3028]">3 minutes of inactivity</span> to protect confidential application data.
          </p>

          {/* Countdown Display Card */}
          <div
            className={`p-4 rounded-xl border mb-5 transition-colors ${
              isUrgent
                ? "bg-[#FDF2EE] border-[#A9442A] text-[#632919]"
                : "bg-[#F5EFE3] border-[#D9C5A3] text-[#3B3028]"
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2 font-mono">
              <Clock className={`w-4 h-4 ${isUrgent ? "text-[#A9442A] animate-pulse" : "text-[#8B5E3C]"}`} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Automatic Sign-Out In
              </span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight font-mono">
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </div>
            <span className="text-[11px] text-[#6E5D50] mt-1 block">
              seconds remaining
            </span>

            {/* Progress bar */}
            <div className="w-full bg-[#EDE3D2] h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full transition-all duration-1000 ${
                  isUrgent ? "bg-[#A9442A]" : "bg-[#8B5E3C]"
                }`}
                style={{ width: `${percentRemaining}%` }}
              />
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onExtend}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8B5E3C] hover:bg-[#734C30] text-[#F5EFE3] rounded-lg text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#8B5E3C]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Stay Logged In
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-[#F5EFE3] hover:bg-[#EDE3D2] text-[#3B3028] border border-[#D9C5A3] rounded-lg text-sm font-medium transition focus:outline-none"
            >
              <LogOut className="w-4 h-4 text-[#6E5D50]" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer Audit Notice */}
        <div className="bg-[#FAF6EE] px-5 py-2.5 border-t border-[#D9C5A3] text-center">
          <p className="text-[10px] text-[#6E5D50] font-mono">
            Session activity is securely tracked &amp; audited on the central server.
          </p>
        </div>
      </div>
    </div>
  );
}
