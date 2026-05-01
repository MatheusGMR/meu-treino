import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFunnelTracking } from "@/hooks/useFunnelTracking";
import meuTreinoLogo from "@/assets/meu-treino-logo.png";

const EligibilityApproved = () => {
  const navigate = useNavigate();
  const { track } = useFunnelTracking();

  useEffect(() => {
    track("eligibility_approved_view");
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-border/30">
        <img src={meuTreinoLogo} alt="Meu Treino" className="h-8 rounded-lg" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            className="relative mx-auto w-28 h-28"
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
            <div className="relative w-full h-full rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
              <CheckCircle2 className="w-14 h-14 text-primary" />
            </div>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2"
                initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
                animate={{
                  x: Math.cos((i * Math.PI) / 3) * 80,
                  y: Math.sin((i * Math.PI) / 3) * 80,
                  opacity: 0,
                  scale: 1.5,
                }}
                transition={{ duration: 1.2, delay: 0.3 + i * 0.05, ease: "easeOut" }}
              >
                <Sparkles className="w-4 h-4 text-primary" />
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <h1 className="text-3xl sm:text-4xl font-bold">
              Você foi aprovada! 🎉
            </h1>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              Que alegria ter você aqui. Antes do próximo passo, vamos te conhecer
              um pouco melhor para personalizar o seu protocolo do jeito certo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              size="lg"
              className="w-full h-14 text-base gap-2"
              onClick={() => navigate("/client/onboarding", { replace: true })}
            >
              Conhecer você
              <ArrowRight className="w-5 h-5" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Leva menos de 2 minutos. Sem julgamento, só para acertar o ritmo.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EligibilityApproved;
