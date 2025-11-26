import { Home, Dumbbell, Users, Settings, LogOut, ChevronRight, Activity, ClipboardList, Crown, BarChart, Hash, Zap, Sparkles, Upload } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoJmFull from "@/assets/logo-jm-full.png";

export const AppSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isPersonal, isAdmin, isClient } = useRole();
  const [repertorioOpen, setRepertorioOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));

  return (
    <div className="flex flex-col h-full bg-transparent border-r border-sidebar-border/50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center justify-center">
          <img 
            src={logoJmFull} 
            alt="Junior Mello Treinamentos" 
            className="h-12 w-auto rounded-lg"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link to="/dashboard">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              isActive("/dashboard") && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <Home className="w-5 h-5" />
            Dashboard
          </Button>
        </Link>

        {(isPersonal || isAdmin) && (
          <>
            <Collapsible open={repertorioOpen} onOpenChange={setRepertorioOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between",
                    isParentActive(["/personal/workouts", "/personal/sessions", "/personal/exercises", "/personal/volumes", "/personal/methods"]) && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Dumbbell className="w-5 h-5" />
                    Repertório
                  </div>
                  <ChevronRight className={cn("w-4 h-4 transition-transform", repertorioOpen && "rotate-90")} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 mt-1 space-y-1">
                <Link to="/personal/workouts">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-3 font-normal",
                      isActive("/personal/workouts") && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Treinos
                  </Button>
                </Link>
                <Link to="/personal/sessions">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-3 font-normal",
                      isActive("/personal/sessions") && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Activity className="w-4 h-4" />
                    Sessões
                  </Button>
                </Link>
                <Link to="/personal/exercises">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-3 font-normal",
                      isActive("/personal/exercises") && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Dumbbell className="w-4 h-4" />
                    Exercícios
                  </Button>
                </Link>
                <Link to="/personal/volumes">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-3 font-normal",
                      isActive("/personal/volumes") && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Hash className="w-4 h-4" />
                    Volumes
                  </Button>
                </Link>
                <Link to="/personal/methods">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start gap-3 font-normal",
                      isActive("/personal/methods") && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    <Zap className="w-4 h-4" />
                    Métodos
                  </Button>
                </Link>
              </CollapsibleContent>
            </Collapsible>

            <Link to="/personal/clients">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3",
                  location.pathname.startsWith("/personal/clients") && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Users className="w-5 h-5" />
                Clientes
              </Button>
            </Link>
          </>
        )}

        {isClient && (
          <Link to="/client/history">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3",
                isActive("/client/history") && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <BarChart className="w-5 h-5" />
              Histórico
            </Button>
          </Link>
        )}

        {isAdmin && (
          <Collapsible open={adminOpen} onOpenChange={setAdminOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between",
                  isParentActive(["/admin"]) && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5" />
                  Administração
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform", adminOpen && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 mt-1 space-y-1">
              <Link to="/admin/dashboard">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive("/admin/dashboard") && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/admin/professionals">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive("/admin/professionals") && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Users className="w-4 h-4" />
                  Profissionais
                </Button>
              </Link>
              <Link to="/admin/clients">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive("/admin/clients") && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Users className="w-4 h-4" />
                  Clientes
                </Button>
              </Link>
              <Link to="/admin/assignments">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive("/admin/assignments") && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Activity className="w-4 h-4" />
                  Atribuições
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive("/admin/users") && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Usuários
                </Button>
              </Link>
              <Link to="/admin/pending-updates">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive("/admin/pending-updates") && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  Atualizações
                </Button>
              </Link>
              <Link to="/admin/exercise-import">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start gap-3 font-normal",
                    isActive("/admin/exercise-import") && "bg-sidebar-accent text-sidebar-accent-foreground"
                  )}
                >
                  <Upload className="w-4 h-4" />
                  Importar CSV
                </Button>
              </Link>
            </CollapsibleContent>
          </Collapsible>
        )}

        <Separator className="my-4" />

        <Link to="/settings">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3",
              isActive("/settings") && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <Settings className="w-5 h-5" />
            Configurações
          </Button>
        </Link>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut()}
        >
          <LogOut className="w-5 h-5" />
          Sair
        </Button>
      </div>
    </div>
  );
};
