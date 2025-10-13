import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Dumbbell, Activity, UserX } from "lucide-react";

interface AdminClientCardProps {
  client: {
    id: string;
    full_name: string;
    avatar_url?: string;
    status?: string;
    personal_name?: string;
    total_workouts?: number;
    completed_sessions?: number;
  };
  onReassign: (clientId: string) => void;
}

export const AdminClientCard = ({ client, onReassign }: AdminClientCardProps) => {
  const initials = client.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const statusVariant =
    client.status === "Ativo" ? "default" : client.status === "Inativo" ? "secondary" : "destructive";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={client.avatar_url} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{client.full_name}</CardTitle>
              {client.status && <Badge variant={statusVariant} className="mt-1">{client.status}</Badge>}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          {client.personal_name ? (
            <>
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Personal: {client.personal_name}</span>
            </>
          ) : (
            <>
              <UserX className="h-4 w-4 text-destructive" />
              <span className="text-destructive">Sem profissional atribuído</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            <span>{client.total_workouts || 0} treinos</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span>{client.completed_sessions || 0} sessões</span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={() => onReassign(client.id)}>
          Reatribuir Profissional
        </Button>
      </CardContent>
    </Card>
  );
};
