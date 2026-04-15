import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FunnelStep {
  label: string;
  count: number;
  eventType: string;
}

interface MarketingMetrics {
  funnel: FunnelStep[];
  dailyEvents: { date: string; count: number }[];
  recentLeads: {
    id: string;
    full_name: string;
    phone: string;
    gender: string;
    age: number;
    is_vs_gold: boolean;
    pain_shoulder: boolean;
    pain_lower_back: boolean;
    pain_knee: boolean;
    payment_status: string;
    created_at: string;
  }[];
}

export const useMarketingMetrics = (dateRange: { from: string; to: string }) => {
  return useQuery({
    queryKey: ["marketing-metrics", dateRange],
    queryFn: async (): Promise<MarketingMetrics> => {
      const funnelSteps = [
        { label: "Visitas LP", eventType: "page_view" },
        { label: "Clique CTA", eventType: "cta_click" },
        { label: "Elegibilidade Iniciada", eventType: "eligibility_start" },
        { label: "Elegibilidade Completa", eventType: "eligibility_complete" },
        { label: "Checkout Iniciado", eventType: "checkout_start" },
        { label: "Checkout Completo", eventType: "checkout_complete" },
        { label: "Anamnese Iniciada", eventType: "anamnesis_start" },
        { label: "Anamnese Completa", eventType: "anamnesis_complete" },
      ];

      const funnelPromises = funnelSteps.map(async (step) => {
        const { count } = await supabase
          .from("funnel_events")
          .select("*", { count: "exact", head: true })
          .eq("event_type", step.eventType)
          .gte("created_at", dateRange.from)
          .lte("created_at", dateRange.to);
        return { ...step, count: count || 0 };
      });

      const funnel = await Promise.all(funnelPromises);

      // Daily events for chart
      const { data: dailyData } = await supabase
        .from("funnel_events")
        .select("created_at")
        .gte("created_at", dateRange.from)
        .lte("created_at", dateRange.to)
        .order("created_at", { ascending: true });

      const dailyMap = new Map<string, number>();
      (dailyData || []).forEach((e: any) => {
        const date = new Date(e.created_at).toISOString().split("T")[0];
        dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
      });
      const dailyEvents = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

      // Recent leads
      const { data: leads } = await supabase
        .from("eligibility_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50) as any;

      return {
        funnel,
        dailyEvents,
        recentLeads: leads || [],
      };
    },
  });
};
