import { ClientCard } from "./ClientCard";
import type { Client } from "@/hooks/useClients";
import { Users } from "lucide-react";

interface ClientsGridProps {
  clients: Client[];
  isLoading: boolean;
}

export const ClientsGrid = ({ clients, isLoading }: ClientsGridProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
        <p className="text-muted-foreground">
          Adicione seu primeiro cliente para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  );
};
