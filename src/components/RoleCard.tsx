import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface RoleCardProps {
  title: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  variant?: "default" | "primary" | "accent";
}

export const RoleCard = ({ title, description, features, icon: Icon, variant = "default" }: RoleCardProps) => {
  const cardClasses = {
    default: "",
    primary: "border-primary/50 bg-gradient-card",
    accent: "border-accent/50 bg-gradient-card",
  };

  return (
    <Card className={`group hover:shadow-glow transition-all duration-300 hover:scale-105 ${cardClasses[variant]}`}>
      <CardHeader>
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <a href="/auth/register" className="w-full">
          <Button className="w-full" variant={variant === "primary" ? "hero" : "default"}>
            Começar Agora
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
};
