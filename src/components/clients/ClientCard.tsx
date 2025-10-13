import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Client } from "@/hooks/useClients";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClientCardProps {
  client: Client;
}

export const ClientCard = ({ client }: ClientCardProps) => {
  const navigate = useNavigate();

  const getAge = () => {
    if (!client.birth_date) return null;
    return differenceInYears(new Date(), new Date(client.birth_date));
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Ativo":
        return "default";
      case "Inativo":
        return "secondary";
      case "Suspenso":
        return "destructive";
      default:
        return "outline";
    }
  };

  const age = getAge();

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={client.avatar_url || undefined} />
            <AvatarFallback className="text-lg">
              {client.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{client.full_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {age && <span className="text-sm text-muted-foreground">{age} anos</span>}
              {client.gender && (
                <span className="text-sm text-muted-foreground">• {client.gender}</span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {client.assignment && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={getStatusVariant(client.assignment.status)}>
                {client.assignment.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Desde {format(new Date(client.assignment.start_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </>
        )}
        <Button className="w-full" onClick={() => navigate(`/personal/clients/${client.id}`)}>
          <Users className="h-4 w-4 mr-2" />
          Ver Perfil
        </Button>
      </CardContent>
    </Card>
  );
};
