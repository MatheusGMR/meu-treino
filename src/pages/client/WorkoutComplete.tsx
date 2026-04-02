import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Dumbbell, TrendingUp } from "lucide-react";
import { WorkoutFeedbackDialog } from "@/components/client/WorkoutFeedbackDialog";
import { motion } from "framer-motion";

const WorkoutComplete = () => {
  const navigate = useNavigate();
  const { scheduleId } = useParams();
  const location = useLocation();
  const [showFeedback, setShowFeedback] = useState(true);

  const { startTime, exercisesCount, sessionName } = (location.state as any) || {};
  
  const elapsedMs = startTime ? Date.now() - startTime : 0;
  const totalMinutes = Math.round(elapsedMs / 60000);

  const handleFeedback = (rating: string) => {
    setShowFeedback(false);
    // Future: save rating to DB
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Animated Checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-14 h-14 text-green-600" />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-3xl font-bold text-foreground mb-2 text-center"
      >
        Treino Concluído! 🎉
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-muted-foreground text-center mb-8"
      >
        {sessionName || "Parabéns pelo esforço!"}
      </motion.p>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8"
      >
        <div className="p-4 rounded-lg border border-border bg-card text-center transition-all hover:border-primary">
          <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{totalMinutes || '--'}</p>
          <p className="text-xs text-muted-foreground uppercase font-medium">Minutos</p>
        </div>
        <div className="p-4 rounded-lg border border-border bg-card text-center transition-all hover:border-primary">
          <Dumbbell className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold text-foreground">{exercisesCount || '--'}</p>
          <p className="text-xs text-muted-foreground uppercase font-medium">Exercícios</p>
        </div>
      </motion.div>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full max-w-sm space-y-3"
      >
        <Button
          onClick={() => navigate("/client/dashboard")}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg hover:-translate-y-0.5 transition-all"
          size="lg"
        >
          Voltar ao Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/client/history")}
          className="w-full rounded-lg font-bold"
          size="lg"
        >
          Ver Histórico
        </Button>
      </motion.div>

      {/* Feedback Dialog */}
      <WorkoutFeedbackDialog
        open={showFeedback}
        onOpenChange={setShowFeedback}
        onSubmit={handleFeedback}
      />
    </div>
  );
};

export default WorkoutComplete;
