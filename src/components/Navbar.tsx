import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import logoJmFull from "@/assets/logo-jm-full.png";
import logoJmIcon from "@/assets/logo-jm-icon.png";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src={logoJmFull} 
              alt="Junior Mello Treinamentos" 
              className="h-10 w-auto hidden sm:block rounded-lg"
            />
            <img 
              src={logoJmIcon} 
              alt="JM" 
              className="h-10 w-10 sm:hidden rounded-lg"
            />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Início
            </a>
            <a href="#features" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Recursos
            </a>
            <a href="#roles" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Para Você
            </a>
            <a href="#contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Contato
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a href="/auth/login">
              <Button variant="ghost">Entrar</Button>
            </a>
            <a href="/auth/register">
              <Button variant="hero">Começar Grátis</Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};
