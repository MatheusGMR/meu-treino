import { useState } from "react";
import { Plus, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessions } from "@/hooks/useSessions";

interface ExistingSessionSelectorProps {
  onSelectSession: (sessionId: string) => void;
  selectedSessionIds: string[];
}

export const ExistingSessionSelector = ({
  onSelectSession,
  selectedSessionIds,
}: ExistingSessionSelectorProps) => {
  const [search, setSearch] = useState("");
  const { data: sessions, isLoading } = useSessions({ search });

  const getTypeColor = (type: string) => {
    const colors = {
      Mobilidade: "bg-blue-500/10 text-blue-500",
      Alongamento: "bg-purple-500/10 text-purple-500",
      Musculação: "bg-orange-500/10 text-orange-500",
    };
    return colors[type as keyof typeof colors] || "";
  };

  const isSelected = (sessionId: string) => selectedSessionIds.includes(sessionId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-2">
          {search ? "Nenhuma sessão encontrada" : "Você ainda não criou nenhuma sessão"}
        </p>
        <p className="text-sm text-muted-foreground">
          {search ? "Tente buscar por outro termo" : "Crie sessões na página de Sessões primeiro"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div>
        <Input
          placeholder="Buscar sessões por nome ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Exercícios</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{session.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getTypeColor(session.session_type)}>
                    {session.session_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {session.session_exercises?.[0]?.count || 0} exercícios
                </TableCell>
                <TableCell className="text-right">
                  {isSelected(session.id) ? (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="w-3 h-3" />
                      Adicionada
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onSelectSession(session.id)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
