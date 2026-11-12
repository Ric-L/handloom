import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { User } from "../types";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");

  if (!token || !userJson) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  try {
    const user: User = JSON.parse(userJson);
    if (user.role !== "SUPER_ADMIN" && user.role !== "REVIEWER_ADMIN") {
      // Clear unauthorized token and redirect to admin login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return (
        <Navigate
          to="/admin/login"
          state={{ error: "Access denied: Applicant accounts are not permitted in the Admin Portal." }}
          replace
        />
      );
    }
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
