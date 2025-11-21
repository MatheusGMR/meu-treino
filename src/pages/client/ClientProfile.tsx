import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BottomNavigation } from "@/components/client/BottomNavigation";
import { SolidBackgroundWrapper } from "@/components/SolidBackgroundWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, FileText, Bell, User, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ClientProfile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      return data;
    },
    enabled: !!user,
  });

  const menuItems = [
    {
      icon: User,
      label: "Dados Pessoais",
      onClick: () => {},
    },
    {
      icon: FileText,
      label: "Anamnese",
      onClick: () => navigate("/client/anamnesis"),
    },
    {
      icon: Bell,
      label: "Notificações",
      onClick: () => {},
    },
  ];

  return (
    <SolidBackgroundWrapper>
      <div className="min-h-screen bg-white pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-border/50 shadow-sm">
          <div className="px-5 py-4">
            <h1 className="text-2xl font-bold text-foreground">
              Perfil
            </h1>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground">
                    {profile?.full_name || 'Usuário'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <Card>
            <CardContent className="p-0">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors border-b last:border-b-0 border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Card>
            <CardContent className="p-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </CardContent>
          </Card>
        </div>

        <BottomNavigation activeTab="mais" />
      </div>
    </SolidBackgroundWrapper>
  );
};

export default ClientProfile;
