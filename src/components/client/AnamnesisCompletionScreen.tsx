import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Gift, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoJmFull from "@/assets/logo-jm-full.png";

interface AnamnesisCompletionScreenProps {
  userName: string;
  isGeneratingWorkout: boolean;
  trialWorkoutReady: boolean;
  onContinue: () => void;
}

export const AnamnesisCompletionScreen = ({
  userName,
  isGeneratingWorkout,
  trialWorkoutReady,
  onContinue,
}: AnamnesisCompletionScreenProps) => {
  const [showContent, setShowContent] = useState(false);
  const [showGift, setShowGift] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 600);
    const t2 = setTimeout(() => setShowGift(true), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-accent overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: Math.random() * 20 + 5,
              height: Math.random() * 20 + 5,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.1, 0.4, 0.1],
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-lg mx-auto">
        {/* Checkmark animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            >
              <Check className="w-12 h-12 text-white stroke-[3]" />
            </motion.div>
          </div>
        </motion.div>

        {/* Main text */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="space-y-4 mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Obrigado, {userName}! 🎉
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium">
                Estamos muito felizes em começar essa jornada com você!
              </p>
              <p className="text-lg text-white/75">
                Suas informações foram salvas e seu personal já foi notificado.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gift section */}
        <AnimatePresence>
          {showGift && (
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7, type: "spring" }}
              className="space-y-6"
            >
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Gift className="w-6 h-6 text-white" />
                  <span className="text-lg font-semibold text-white">
                    Preparamos um presente para você!
                  </span>
                </div>
                <p className="text-white/85 text-sm mb-4">
                  Enquanto seu treino personalizado está sendo criado pelo profissional, 
                  preparamos um <strong>treino experimental</strong> baseado nas suas respostas 
                  para você já conhecer a plataforma.
                </p>

                {isGeneratingWorkout && !trialWorkoutReady && (
                  <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando seu treino de teste...</span>
                  </div>
                )}

                {trialWorkoutReady && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-center gap-2 text-white text-sm font-medium"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Treino de teste pronto!</span>
                  </motion.div>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-white/70 text-xs">
                  📧 Você também receberá um e-mail com o link de acesso à plataforma.
                </p>
              </div>

              <Button
                onClick={onContinue}
                size="lg"
                className="w-full bg-white text-primary hover:bg-white/90 font-semibold text-lg py-6 rounded-xl shadow-xl"
                disabled={isGeneratingWorkout && !trialWorkoutReady}
              >
                {trialWorkoutReady ? (
                  <>
                    Conhecer meu treino
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Preparando...
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
