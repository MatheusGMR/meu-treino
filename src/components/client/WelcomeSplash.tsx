import { useAuth } from "@/hooks/useAuth";
import logoJmIcon from "@/assets/logo-jm-icon.png";

export const WelcomeSplash = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || "Aluno";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary-glow to-accent animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-6 px-4">
        <div className="flex justify-center">
          <div className="w-28 h-28 rounded-2xl bg-background/20 backdrop-blur-sm flex items-center justify-center p-4">
            <img 
              src={logoJmIcon} 
              alt="JM" 
              className="w-full h-full object-contain rounded-xl"
            />
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
