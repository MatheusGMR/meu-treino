import { useRole, AppRole } from "@/hooks/useRole";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { roles, loading } = useRole();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading && roles.length > 0) {
      setInitialLoad(false);
    } else if (!loading) {
      // Se não está loading mas não tem roles, aguardar 2 segundos
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading, roles]);

  if (loading || initialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  const hasPermission = allowedRoles.some((role) => roles.includes(role));

  if (!hasPermission) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
