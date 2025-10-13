import { Dumbbell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const WelcomeSplash = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || "Aluno";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-accent animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <Dumbbell className="w-12 h-12 text-background" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-5xl md:text-6xl font-bold text-background">
            Olá, {userName},
          </h1>
          <p className="text-2xl md:text-3xl font-medium text-background/90">
            tenha um bom treino!
          </p>
        </div>
      </div>
    </div>
  );
};
