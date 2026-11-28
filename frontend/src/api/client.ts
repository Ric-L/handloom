import axios from "axios";
import { API_BASE_URL } from "../lib/constants";

const CSRF_STORAGE_KEY = "csrf_token";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

function getStoredCsrfToken(): string | null {
  try {
    return typeof sessionStorage !== "undefined" ? sessionStorage.getItem(CSRF_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

function setStoredCsrfToken(token?: string | null) {
  if (!token) return;
  try {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    }
  } catch {
    // Ignore storage quota or private-mode restrictions
  }
}

function extractCsrfFromHeaders(headers: any): string | null {
  if (!headers) return null;
  if (typeof headers.get === "function") {
    return headers.get("x-csrf-token") || headers.get("X-CSRF-Token") || null;
  }
  return headers["x-csrf-token"] || headers["X-CSRF-Token"] || null;
}

function captureCsrfFromResponse(response: any) {
  if (!response) return;
  const token = extractCsrfFromHeaders(response.headers) || response.data?.csrf_token;
  if (typeof token === "string" && token.trim()) {
    setStoredCsrfToken(token.trim());
  }
}

const CSRF_EXEMPT_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/admin-login",
  "/admin/auth/login",
  "/auth/csrf-token",
];

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HTTP-only cookies and CSRF cookies across requests
});

client.interceptors.request.use(async (config) => {
  // Attach bearer token for defense-in-depth / backwards compatibility
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach CSRF Token for state-modifying requests (fall back to header-cached token on cross-origin deploys like *.onrender.com)
  let csrfToken = getCookie("csrf_token") || getStoredCsrfToken();
  const method = (config.method || "get").toLowerCase();
  const isMutating = method !== "get" && method !== "head" && method !== "options";
  const isExempt = CSRF_EXEMPT_PATHS.some((p) => (config.url || "").includes(p));

  if (isMutating && !isExempt && !csrfToken) {
    try {
      const csrfRes = await axios.get(`${API_BASE_URL}/auth/csrf-token`, { withCredentials: true });
      captureCsrfFromResponse(csrfRes);
      csrfToken = getCookie("csrf_token") || getStoredCsrfToken();
    } catch {
      // Proceed and let backend respond cleanly if unreachable
    }
  }

  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  // Notify active session listeners of API activity
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("portal:user-activity"));
  }

  return config;
});

client.interceptors.response.use(
  (res) => {
    captureCsrfFromResponse(res);
    return res;
  },
  (err) => {
    captureCsrfFromResponse(err?.response);
    if (err.response?.status === 401) {
      const isIdleTimeout = err.response?.data?.code === "SESSION_IDLE_TIMEOUT";
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("portal:session-expired", {
            detail: { isIdleTimeout },
          })
        );

        const isAdminPath = window.location.pathname.startsWith("/admin");
        const queryParam = isIdleTimeout ? "?reason=session_expired" : "";

        if (isAdminPath && window.location.pathname !== "/admin/login") {
          window.location.href = `/admin/login${queryParam}`;
        } else if (!isAdminPath && window.location.pathname !== "/login" && window.location.pathname !== "/register") {
          window.location.href = `/login${queryParam}`;
        }
      }
    }
    return Promise.reject(err);
  }
);

export default client;
