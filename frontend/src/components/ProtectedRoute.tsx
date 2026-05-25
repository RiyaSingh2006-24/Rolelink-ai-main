import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: Array<"jobseeker" | "employer">;
  fallbackPath?: string;
};

const ProtectedRoute = ({ children, allowedRoles, fallbackPath }: ProtectedRouteProps) => {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles) {
    if (!role) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
    if (!allowedRoles.includes(role)) {
      const fallback = fallbackPath || (role === "employer" ? "/employer-dashboard" : "/dashboard");
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
