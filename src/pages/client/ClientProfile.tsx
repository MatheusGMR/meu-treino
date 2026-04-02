import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BottomNavigation } from "@/components/client/BottomNavigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, FileText, Bell, User, ChevronRight, Clock, Target, Droplets } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ClientProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const progressItems = [
    { icon: Target, label: "Fazer seu treino", path: "/client/dashboard" },
    { icon: Droplets, label: "Beber água", path: null },
    { icon: Clock, label: "Histórico de treinos", path: "/client/history" },
  ];

  const menuItems = [
    { icon: User, label: "Dados Pessoais", onClick: () => {} },
    { icon: FileText, label: "Anamnese", onClick: () => navigate("/client/anamnesis") },
    { icon: Bell, label: "Notificações", onClick: () => {} },
  ];

  return (
    <div className="client-dark min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-5 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Mais</h1>
          <Avatar className="w-9 h-9 border-2 border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Progress Section */}
        <div>
          <h2 className="text-center text-lg font-bold text-foreground mb-4">Seu progresso</h2>
          <div className="space-y-2">
            {progressItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => item.path && navigate(item.path)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0 border-border"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground text-sm">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-destructive text-destructive font-bold text-sm uppercase tracking-wider hover:bg-destructive hover:text-destructive-foreground transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>

      <BottomNavigation activeTab="mais" />
    </div>
  );
};

export default ClientProfile;
