import { useState } from "react";
import { ClientsGrid } from "@/components/clients/ClientsGrid";
import { ClientFilters } from "@/components/clients/ClientFilters";
import { AddClientDialog } from "@/components/clients/AddClientDialog";
import { useClients, type ClientStatus } from "@/hooks/useClients";

const Clients = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ClientStatus | "Todos">("Todos");

  const { data: clients = [], isLoading } = useClients({
    status: status === "Todos" ? undefined : status,
    search,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Clientes (Alunos)</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e acompanhe seu progresso
          </p>
        </div>
        <AddClientDialog />
      </div>

      <ClientFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
      />

      <ClientsGrid clients={clients} isLoading={isLoading} />
    </div>
  );
};

export default Clients;
