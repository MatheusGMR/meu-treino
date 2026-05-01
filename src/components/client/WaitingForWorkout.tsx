import { Card, CardContent } from "@/components/ui/card";
import meuTreinoLogo from "@/assets/meu-treino-logo.png";
import { Dumbbell, Sparkles } from "lucide-react";

export const WaitingForWorkout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardContent className="pt-12 pb-10 px-6 text-center">
          <div className="flex justify-center mb-6">
            <img src={meuTreinoLogo} alt="Meu Treino" className="h-16" />
          </div>
          
          {/* Ícone animado */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping opacity-20">
                <Dumbbell className="w-20 h-20 text-primary" />
              </div>
              <Dumbbell className="w-20 h-20 text-primary relative" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
            <span className="inline-block animate-spin-slow">🎉</span>
            <span>Tudo pronto para começar!</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-6">
            Seu treino inicial já está liberado. Você pode iniciá-lo agora mesmo no seu ritmo.
          </p>

          <div className="bg-primary/5 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <p className="font-semibold text-foreground">
                O que vem a seguir?
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Em breve um profissional da JMP entrará em contato com você para acompanhar de perto a sua jornada e dar os próximos passos rumo a uma vida mais saudável. 💚
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Enquanto isso, comece seu treino e aproveite — estamos com você nessa.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
