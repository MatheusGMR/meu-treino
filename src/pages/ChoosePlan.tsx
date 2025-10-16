import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SolidBackgroundWrapper } from "@/components/SolidBackgroundWrapper";

export default function ChoosePlan() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .single();

      setPlan(data);
    };

    fetchPlan();
  }, []);

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke("create-personal-checkout");

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Erro ao criar checkout:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!plan) {
    return (
      <SolidBackgroundWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SolidBackgroundWrapper>
    );
  }

  return (
    <SolidBackgroundWrapper>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Escolha Seu Plano</h1>
            <p className="text-muted-foreground">
              Comece hoje mesmo e transforme o seu negócio de personal trainer
            </p>
          </div>

          <Card className="max-w-md mx-auto border-primary/20">
            <CardHeader className="text-center pb-8">
              {plan.trial_days > 0 && (
                <Badge className="w-fit mx-auto mb-4" variant="secondary">
                  {plan.trial_days} dias grátis
                </Badge>
              )}
              <CardTitle className="text-3xl">{plan.name}</CardTitle>
              {plan.description && (
                <CardDescription className="text-base mt-2">{plan.description}</CardDescription>
              )}
              <div className="mt-6">
                <span className="text-5xl font-bold">R$ {plan.price}</span>
                <span className="text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Gerenciamento ilimitado de clientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Criação de treinos e sessões personalizadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Biblioteca completa de exercícios</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Avaliações físicas e acompanhamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Receba pagamentos dos seus clientes via Stripe</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span>Dashboard completo de métricas</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button 
                onClick={handleSubscribe} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Assinar Agora"
                )}
              </Button>
              <Button 
                onClick={() => navigate("/")} 
                variant="ghost"
                className="w-full"
              >
                Voltar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </SolidBackgroundWrapper>
  );
}
