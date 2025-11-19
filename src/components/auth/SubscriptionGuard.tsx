import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";

export const SubscriptionGuard = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isPersonal, loading: roleLoading } = useRole();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !isPersonal) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("personal_subscriptions")
        .select("status")
        .eq("personal_id", user.id)
        .single();

      // Se não tem assinatura, verifica se há planos no sistema
      if (!data?.status) {
        const { data: plans } = await supabase
          .from("subscription_plans")
          .select("id")
          .eq("active", true)
          .limit(1);
        
        // Se não há planos = modo desenvolvimento, permite acesso
        if (!plans || plans.length === 0) {
          setSubscriptionStatus("active"); // Simula assinatura ativa
          setLoading(false);
          return;
        }
      }

      setSubscriptionStatus(data?.status || null);
      setLoading(false);
    };

    if (!roleLoading) {
      checkSubscription();
    }
  }, [user, isPersonal, roleLoading]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  if (isPersonal && subscriptionStatus !== "active" && subscriptionStatus !== "trialing") {
    return <Navigate to="/escolher-plano" replace />;
  }

  return <>{children}</>;
};
