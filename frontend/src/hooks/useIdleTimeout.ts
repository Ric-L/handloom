import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { refreshSession, logoutUser } from "../api";

interface UseIdleTimeoutOptions {
  timeoutSeconds?: number;   // Total idle duration before logout (default: 180s = 3 minutes)
  warningSeconds?: number;   // Warning countdown duration (default: 45s)
  onTimeout?: () => void;
}

export function useIdleTimeout({
  timeoutSeconds = 180,
  warningSeconds = 45,
  onTimeout,
}: UseIdleTimeoutOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);

  const lastActivityRef = useRef<number>(Date.now());
  const warningTimerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const isWarningOpenRef = useRef<boolean>(false);

  // Keep ref synchronized with state to avoid stale closure in event handlers
  useEffect(() => {
    isWarningOpenRef.current = isWarningOpen;
  }, [isWarningOpen]);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isAuthenticated = Boolean(token);

  // Determine current portal context
  const isAdminPortal = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/admin/login";

  // Perform full server-side invalidation and client logout
  const handleLogout = useCallback(
    async (isIdleTimeout: boolean = true) => {
      // Clear timers immediately
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

      setIsWarningOpen(false);

      try {
        await logoutUser();
      } catch {
        // Ignore network errors during logout
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (onTimeout) {
        onTimeout();
      }

      const redirectPath = isAdminPortal ? "/admin/login" : "/login";
      const reasonParam = isIdleTimeout ? "?reason=session_expired" : "";
      navigate(`${redirectPath}${reasonParam}`, { replace: true });
    },
    [isAdminPortal, navigate, onTimeout]
  );

  // Start the 45-second countdown timer once warning threshold is reached
  const startCountdown = useCallback(() => {
    setIsWarningOpen(true);
    setSecondsRemaining(warningSeconds);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const expiryTime = Date.now() + warningSeconds * 1000;

    countdownIntervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000));
      setSecondsRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        handleLogout(true);
      }
    }, 1000);
  }, [handleLogout, warningSeconds]);

  // Reset the idle timer on valid user activity
  const resetTimer = useCallback(() => {
    // If the warning dialog is actively displayed, do not reset automatically via mouse jitter.
    // The user must explicitly click "Stay Logged In" to confirm presence.
    if (isWarningOpenRef.current) {
      return;
    }

    lastActivityRef.current = Date.now();

    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const warningTriggerMs = (timeoutSeconds - warningSeconds) * 1000;

    warningTimerRef.current = setTimeout(() => {
      startCountdown();
    }, warningTriggerMs);
  }, [startCountdown, timeoutSeconds, warningSeconds]);

  // Explicit user confirmation to extend session (Stay Logged In)
  const extendSession = useCallback(async () => {
    try {
      await refreshSession();
    } catch {
      // If server rejected refresh because session already died, logout
      handleLogout(true);
      return;
    }

    setIsWarningOpen(false);
    resetTimer();
  }, [handleLogout, resetTimer]);

  useEffect(() => {
    // Only monitor idle timeout for authenticated users outside login/register pages
    if (!isAuthenticated || isLoginPage) {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setIsWarningOpen(false);
      return;
    }

    // Initialize timer
    resetTimer();

    // Throttled activity listener
    let lastHandled = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastHandled > 1000) {
        lastHandled = now;
        resetTimer();
      }
    };

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll", "click"];
    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));
    window.addEventListener("portal:user-activity", handleActivity);

    // Listen for forced expiration event from API client interceptor
    const handleExpiredEvent = () => {
      handleLogout(true);
    };
    window.addEventListener("portal:session-expired", handleExpiredEvent);

    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      window.removeEventListener("portal:user-activity", handleActivity);
      window.removeEventListener("portal:session-expired", handleExpiredEvent);
    };
  }, [handleLogout, isAuthenticated, isLoginPage, resetTimer]);

  return {
    isWarningOpen,
    secondsRemaining,
    extendSession,
    logout: () => handleLogout(false),
  };
}
