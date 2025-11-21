import { Menu, Home, History, LogOut, AlertCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAnamnesisStatus } from "@/hooks/useAnamnesisStatus";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoJmFull from "@/assets/logo-jm-full.png";
import logoJmIcon from "@/assets/logo-jm-icon.png";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const ClientHeader = () => {
  const { signOut } = useAuth();
  const location = useLocation();
  const { anamnesisCompleted } = useAnamnesisStatus();

  const menuItems = [
    { label: "Dashboard", path: "/client/dashboard", icon: Home },
    { label: "Histórico", path: "/client/history", icon: History },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/60 border-b border-white/20 shadow-lg">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/client/dashboard" className="flex items-center gap-3">
            <div className="font-bold text-xl text-primary">Meu Treino</div>
            {anamnesisCompleted === false && (
              <Badge variant="warning" className="flex items-center gap-1 animate-pulse">
                <AlertCircle className="h-3 w-3" />
                <span className="hidden sm:inline">Anamnese Pendente</span>
                <span className="sm:hidden">!</span>
              </Badge>
            )}
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </nav>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-3/4 max-w-sm">
              <SheetHeader>
            <SheetTitle className="flex items-center">
              <div className="font-bold text-xl text-primary">Meu Treino</div>
            </SheetTitle>
              </SheetHeader>
              
              <nav className="flex flex-col gap-2 mt-8">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-[16px] transition-all duration-300 ${
                        isActive(item.path)
                          ? "bg-primary text-primary-foreground shadow-lg"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
