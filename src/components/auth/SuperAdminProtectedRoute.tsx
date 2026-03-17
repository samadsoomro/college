import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
}

const SuperAdminProtectedRoute: React.FC<SuperAdminProtectedRouteProps> = ({ children }) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/super-admin/me");
        setIsAuth(res.ok);
      } catch (error) {
        setIsAuth(false);
      }
    };
    checkAuth();
  }, [location.pathname]);

  if (isAuth === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium animate-pulse">Verifying System Access...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/gcfm/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SuperAdminProtectedRoute;
