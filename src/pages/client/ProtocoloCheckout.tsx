import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import { CreditCard, QrCode, Loader2, ShieldCheck, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import meuTreinoLogo from "@/assets/meu-treino-logo.png";

const ProtocoloCheckout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track } = useFunnelTracking();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    track("checkout_start");
  }, []);

  const handlePayment = async (method: "credit_card" | "pix") => {
    if (!user?.id) return;
    setLoading(method);

    try {
      track("checkout_attempt", undefined, { method });

      // Call edge function for Mercado Pago checkout
      const { data, error } = await supabase.functions.invoke("create-protocolo-checkout", {
        body: { paymentMethod: method },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Mercado Pago checkout
        window.location.href = data.url;
      } else if (data?.qr_code) {
        // PIX: show QR code (future implementation)
        toast({ title: "PIX gerado!", description: "Escaneie o QR Code para pagar." });
      } else {
        throw new Error("Resposta inválida do servidor de pagamento");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível iniciar o pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const benefits = [
    "Treino personalizado e adaptado às suas necessidades",
    "Acompanhamento profissional do time JMP",
    "App com treino guiado exercício por exercício",
    "Reajuste automático conforme sua disposição",
    "Acesso à anamnese completa e perfil de treino",
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border/30">
        <img src={meuTreinoLogo} alt="Meu Treino" className="h-8 rounded-lg" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="w-4 h-4 text-primary" />
          Pagamento Seguro
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <h1 className="text-3xl font-bold">Protocolo Destravamento</h1>
            <p className="text-muted-foreground">
              Complete seu pagamento para iniciar sua transformação
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-primary/20">
              <CardContent className="pt-6 space-y-3">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Price */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-4xl font-bold text-primary">R$ 219,90</div>
            <p className="text-sm text-muted-foreground">/mês • Cancele quando quiser</p>
          </motion.div>

          {/* Payment Methods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <Button
              size="lg"
              className="w-full h-14 text-base gap-3"
              onClick={() => handlePayment("credit_card")}
              disabled={!!loading}
            >
              {loading === "credit_card" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CreditCard className="w-5 h-5" />
              )}
              Pagar com Cartão de Crédito
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full h-14 text-base gap-3"
              onClick={() => handlePayment("pix")}
              disabled={!!loading}
            >
              {loading === "pix" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
              Pagar com PIX
            </Button>
          </motion.div>

          <p className="text-xs text-center text-muted-foreground">
            Pagamento processado com segurança via Mercado Pago.
            <br />
            Ao prosseguir, você aceita os termos de serviço.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProtocoloCheckout;
