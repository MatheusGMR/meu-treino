import { Home, Dumbbell, Users, Settings, LogOut, ChevronRight, ChevronLeft, Activity, ClipboardList, Crown, BarChart, Hash, Zap, Sparkles, Upload
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { cn } from "@/lib/utils";
import logoJmFull from "@/assets/logo-jm-full.png";
import logoJmIcon from "@/assets/logo-jm-icon.png";

interface AppSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const AppSidebar = ({ collapsed = false, onToggle }: AppSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { isPersonal, isAdmin, isClient } = useRole();
  const [repertorioOpen, setRepertorioOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));

  // Helper para renderizar item com ou sem tooltip
  const NavItem = ({ 
    to, 
    icon: Icon, 
    label, 
    active,
    size = "default"
  }: { 
    to: string; 
    icon: React.ElementType; 
    label: string; 
    active: boolean;
    size?: "default" | "sm";
  }) => {
    const content = (
      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : "default"}
        className={cn(
          "w-full gap-3",
          collapsed ? "justify-center px-2" : "justify-start",
          active && "bg-sidebar-accent text-sidebar-accent-foreground",
          size === "sm" && "font-normal"
        )}
      >
        <Icon className={size === "sm" ? "w-4 h-4" : "w-5 h-5"} />
        {!collapsed && label}
      </Button>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to={to}>{content}</Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return <Link to={to}>{content}</Link>;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full bg-transparent border-r border-sidebar-border/50">
        {/* Logo + Toggle */}
        <div className={cn("p-4 border-b border-sidebar-border flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <Link to="/dashboard" className="flex items-center justify-center">
            <img 
              src={collapsed ? logoJmIcon : logoJmFull} 
              alt="Junior Mello Treinamentos" 
              className={collapsed ? "h-8 w-8 rounded-lg" : "h-12 w-auto rounded-lg"}
            />
          </Link>
          {onToggle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className={cn("h-8 w-8", collapsed && "absolute right-1 top-4")}
                >
                  {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{collapsed ? "Expandir menu" : "Recolher menu"}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <NavItem to="/dashboard" icon={Home} label="Dashboard" active={isActive("/dashboard")} />

          {(isPersonal || isAdmin) && (
            <>
              {collapsed ? (
                // Modo colapsado: mostrar apenas ícone do Dumbbell
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/personal/workouts">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-center px-2",
                          isParentActive(["/personal/workouts", "/personal/sessions", "/personal/exercises", "/personal/volumes", "/personal/methods"]) && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <Dumbbell className="w-5 h-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Repertório</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
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
                    <NavItem to="/personal/workouts" icon={ClipboardList} label="Treinos" active={isActive("/personal/workouts")} size="sm" />
                    <NavItem to="/personal/sessions" icon={Activity} label="Sessões" active={isActive("/personal/sessions")} size="sm" />
                    <NavItem to="/personal/exercises" icon={Dumbbell} label="Exercícios" active={isActive("/personal/exercises")} size="sm" />
                    <NavItem to="/personal/volumes" icon={Hash} label="Volumes" active={isActive("/personal/volumes")} size="sm" />
                    <NavItem to="/personal/methods" icon={Zap} label="Métodos" active={isActive("/personal/methods")} size="sm" />
                  </CollapsibleContent>
                </Collapsible>
              )}

              <NavItem 
                to="/personal/clients" 
                icon={Users} 
                label="Clientes" 
                active={location.pathname.startsWith("/personal/clients")} 
              />
            </>
          )}

          {isClient && (
            <NavItem to="/client/history" icon={BarChart} label="Histórico" active={isActive("/client/history")} />
          )}

          {isAdmin && (
            <>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/admin/dashboard">
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-center px-2",
                          isParentActive(["/admin"]) && "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        <Crown className="w-5 h-5" />
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Administração</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
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
                    <NavItem to="/admin/dashboard" icon={Home} label="Dashboard" active={isActive("/admin/dashboard")} size="sm" />
                    <NavItem to="/admin/professionals" icon={Users} label="Profissionais" active={isActive("/admin/professionals")} size="sm" />
                    <NavItem to="/admin/clients" icon={Users} label="Clientes" active={isActive("/admin/clients")} size="sm" />
                    <NavItem to="/admin/assignments" icon={Activity} label="Atribuições" active={isActive("/admin/assignments")} size="sm" />
                    <NavItem to="/admin/users" icon={Settings} label="Usuários" active={isActive("/admin/users")} size="sm" />
                    <NavItem to="/admin/pending-updates" icon={Sparkles} label="Atualizações" active={isActive("/admin/pending-updates")} size="sm" />
                    <NavItem to="/admin/exercise-import" icon={Upload} label="Importar CSV" active={isActive("/admin/exercise-import")} size="sm" />
                  </CollapsibleContent>
                </Collapsible>
              )}
            </>
          )}

          <Separator className="my-4" />

          <NavItem to="/settings" icon={Settings} label="Configurações" active={isActive("/settings")} />
        </nav>

        {/* User Section */}
        <div className="p-2 border-t border-sidebar-border">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-center px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Sair</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => signOut()}
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
