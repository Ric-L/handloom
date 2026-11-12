import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CategoriesPage from "./pages/CategoriesPage";
import ApplyPage from "./pages/ApplyPage";
import DashboardPage from "./pages/DashboardPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminRoute from "./components/AdminRoute";

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
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
            <Route path="/admin/applications" element={<Navigate to="/admin" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
