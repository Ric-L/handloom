import axios from "axios";
import { API_BASE_URL } from "../lib/constants";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HTTP-only cookies and CSRF cookies across requests
});

client.interceptors.request.use((config) => {
  // Attach bearer token for defense-in-depth / backwards compatibility
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach CSRF Token for state-modifying requests
  const csrfToken = getCookie("csrf_token");
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
  (res) => res,
  (err) => {
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
