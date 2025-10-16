import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  interval: string;
  trial_days: number;
  stripe_price_id: string | null;
  active: boolean;
  created_at: string;
}

interface PersonalSubscription {
  id: string;
  personal_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  subscription_plans: SubscriptionPlan;
}

export const usePersonalSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PersonalSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      const { data } = await supabase
        .from("personal_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("personal_id", user.id)
        .single();

      setSubscription(data);
      setLoading(false);
    };

    fetchSubscription();

    const channel = supabase
      .channel("personal-subscription")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "personal_subscriptions",
          filter: `personal_id=eq.${user.id}`,
        },
        () => fetchSubscription()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { subscription, loading };
};
