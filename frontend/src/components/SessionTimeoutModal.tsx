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
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
        {/* National Security Header Banner */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
            <span className="font-semibold text-xs tracking-wider uppercase text-amber-400">
              MHHDC Portal Security Control
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Idle Guard</span>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-inner">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <h2
            id="session-timeout-title"
            className="text-lg font-bold text-slate-900 mb-1.5"
          >
            Session Inactivity Warning
          </h2>

          <p className="text-xs text-slate-600 leading-relaxed mb-5">
            In compliance with portal security policies, your authenticated session will automatically expire after{" "}
            <span className="font-semibold text-slate-900">3 minutes of inactivity</span> to protect confidential application data.
          </p>

          {/* Countdown Display Card */}
          <div
            className={`p-4 rounded-xl border mb-5 transition-colors ${
              isUrgent
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-amber-50/80 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2 font-mono">
              <Clock className={`w-4 h-4 ${isUrgent ? "text-rose-600 animate-pulse" : "text-amber-600"}`} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Automatic Sign-Out In
              </span>
            </div>
            <div className="text-3xl font-extrabold tracking-tight font-mono">
              00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              seconds remaining
            </span>

            {/* Progress bar */}
            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full transition-all duration-1000 ${
                  isUrgent ? "bg-rose-600" : "bg-amber-500"
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
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Stay Logged In
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Footer Audit Notice */}
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-mono">
            Session activity is securely tracked &amp; audited on the central server.
          </p>
        </div>
      </div>
    </div>
  );
}
