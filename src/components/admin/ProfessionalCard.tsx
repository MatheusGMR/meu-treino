import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Mail, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

interface ProfessionalCardProps {
  professional: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    active_clients_count: number;
  };
}

export const ProfessionalCard = ({ professional }: ProfessionalCardProps) => {
  const initials = professional.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={professional.avatar_url} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{professional.full_name}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                Personal Trainer
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {professional.active_clients_count}{" "}
            {professional.active_clients_count === 1 ? "cliente ativo" : "clientes ativos"}
          </span>
        </div>

        {professional.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{professional.phone}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link to={`/admin/professionals/${professional.id}`}>Ver Detalhes</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
