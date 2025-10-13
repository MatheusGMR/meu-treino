import { Button } from "@/components/ui/button";
import { Dumbbell, TrendingUp, Users } from "lucide-react";
import heroImage from "@/assets/hero-fitness.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-3xl animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Dumbbell className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Plataforma Completa de Treinos</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Transforme Seu
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Corpo & Mente
            </span>
          </h1>

          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-2xl">
            A plataforma definitiva para personal trainers e seus clientes. 
            Gerencie treinos, acompanhe evolução e alcance resultados extraordinários.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <a href="/auth/register">
              <Button variant="hero" size="lg" className="text-lg">
                Começar Agora
              </Button>
            </a>
            <a href="#features">
              <Button variant="outline" size="lg" className="text-lg">
                Saiba Mais
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Users className="w-5 h-5" />
                <p className="text-3xl font-bold">500+</p>
              </div>
              <p className="text-sm text-muted-foreground">Clientes Ativos</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <Dumbbell className="w-5 h-5" />
                <p className="text-3xl font-bold">50+</p>
              </div>
              <p className="text-sm text-muted-foreground">Personal Trainers</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <p className="text-3xl font-bold">98%</p>
              </div>
              <p className="text-sm text-muted-foreground">Satisfação</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
