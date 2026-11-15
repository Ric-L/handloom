import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CategoriesPage from "./pages/CategoriesPage";
import ApplyPage from "./pages/ApplyPage";
import RegistrationUpdatePage from "./pages/RegistrationUpdatePage";
import DashboardPage from "./pages/DashboardPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminApplicationsPage from "./pages/admin/AdminApplicationsPage";
import AdminCandidatesPage from "./pages/admin/AdminCandidatesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminApplicationDetailPage from "./pages/admin/AdminApplicationDetailPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import AdminRoute from "./components/AdminRoute";
import { useIdleTimeout } from "./hooks/useIdleTimeout";
import SessionTimeoutModal from "./components/SessionTimeoutModal";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 15_000,
    },
  },
});

function CandidateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  const location = useLocation();
  const returnUrl = encodeURIComponent(location.pathname + location.search);
  return token ? <>{children}</> : <Navigate to={`/login?redirect=${returnUrl}`} replace />;
}

function GlobalSessionGuard() {
  const { isWarningOpen, secondsRemaining, extendSession, logout } = useIdleTimeout({
    timeoutSeconds: 180, // strict 3-minute idle session timeout
    warningSeconds: 45,  // 45-second advance warning countdown
  });

  return (
    <SessionTimeoutModal
      isOpen={isWarningOpen}
      secondsRemaining={secondsRemaining}
      onExtend={extendSession}
      onLogout={logout}
      maxSeconds={45}
    />
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GlobalSessionGuard />
        <Routes>
          {/* Public & Candidate Experience */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route
              path="/apply"
              element={
                <CandidateRoute>
                  <ApplyPage />
                </CandidateRoute>
              }
            />
            <Route
              path="/apply/update/:id"
              element={
                <CandidateRoute>
                  <RegistrationUpdatePage />
                </CandidateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <CandidateRoute>
                  <DashboardPage />
                </CandidateRoute>
              }
            />
          </Route>

          {/* Dedicated Admin Login */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Console */}
          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/applications" element={<AdminApplicationsPage />} />
            <Route path="/admin/applications/:id" element={<AdminApplicationDetailPage />} />
            <Route path="/admin/candidates" element={<AdminCandidatesPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
