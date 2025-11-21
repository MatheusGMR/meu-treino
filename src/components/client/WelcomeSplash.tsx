import { useAuth } from "@/hooks/useAuth";
import logoJmIcon from "@/assets/logo-jm-icon.png";

export const WelcomeSplash = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || "Aluno";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-8 px-4">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-[24px] bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div className="text-6xl font-bold text-white">MT</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Olá, {userName}!
          </h1>
          <p className="text-2xl md:text-3xl font-medium text-white/90">
            Tenha um bom treino!
          </p>
        </div>
      </div>
    </div>
  );
};
