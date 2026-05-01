import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import meuTreinoLogo from "@/assets/meu-treino-logo.png";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track } = useFunnelTracking();
  const [searchParams] = useSearchParams();
  const [updating, setUpdating] = useState(true);

  useEffect(() => {
    const processPayment = async () => {
      if (!user?.id) return;

      track("checkout_complete");

      // Update eligibility payment status
      try {
        await supabase
          .from("eligibility_submissions")
          .update({ payment_status: "paid", payment_provider: "mercadopago" } as any)
          .eq("user_id", user.id);
      } catch (e) {
        console.error("Error updating payment status:", e);
      }

      // Mark eligibility as done
      sessionStorage.setItem("eligibility_done", "true");
      
      setUpdating(false);

      // Redirect to anamnesis after 2 seconds
      setTimeout(() => {
        navigate("/client/dashboard", { replace: true });
      }, 2500);
    };

    processPayment();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        className="text-center space-y-6"
      >
        <img src={meuTreinoLogo} alt="Meu Treino" className="h-12 rounded-lg mx-auto" />
        
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Pagamento Confirmado! 🎉</h1>
          <p className="text-muted-foreground mt-2">
            Agora vamos conhecer você melhor para montar seu protocolo personalizado.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Redirecionando para sua anamnese...
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutSuccess;
