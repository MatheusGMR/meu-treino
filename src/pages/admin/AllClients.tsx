import { useState } from "react";
import { AppLayout } from "@/layouts/AppLayout";
import { useAdminClients } from "@/hooks/useAdminClients";
import { AdminClientCard } from "@/components/admin/AdminClientCard";
import { ReassignClientDialog } from "@/components/admin/ReassignClientDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AllClients() {
  const { data: clients, isLoading } = useAdminClients();
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
    currentProfessionalId?: string;
  } | null>(null);

  const handleReassign = (clientId: string) => {
    const client = clients?.find((c) => c.id === clientId);
    if (client) {
      setSelectedClient({
        id: client.id,
        name: client.full_name,
        currentProfessionalId: client.personal_id || undefined,
      });
      setReassignDialogOpen(true);
    }
  };

  const activeClients = clients?.filter((c) => c.status === "Ativo") || [];
  const inactiveClients = clients?.filter((c) => c.status !== "Ativo") || [];
  const unassignedClients = clients?.filter((c) => !c.personal_id) || [];

  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-8 w-8" />
            Todos os Clientes
          </h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os clientes do sistema
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todos ({clients?.length || 0})</TabsTrigger>
            <TabsTrigger value="active">Ativos ({activeClients.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inativos ({inactiveClients.length})</TabsTrigger>
            <TabsTrigger value="unassigned">Sem Profissional ({unassignedClients.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-56" />
                ))}
              </div>
            ) : clients && clients.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {clients.map((client) => (
                  <AdminClientCard
                    key={client.id}
                    client={client}
                    onReassign={handleReassign}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                <p className="text-muted-foreground">
                  Os profissionais podem cadastrar clientes em suas áreas
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeClients.map((client) => (
                <AdminClientCard
                  key={client.id}
                  client={client}
                  onReassign={handleReassign}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inactive" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {inactiveClients.map((client) => (
                <AdminClientCard
                  key={client.id}
                  client={client}
                  onReassign={handleReassign}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="unassigned" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {unassignedClients.map((client) => (
                <AdminClientCard
                  key={client.id}
                  client={client}
                  onReassign={handleReassign}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {selectedClient && (
        <ReassignClientDialog
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          currentProfessionalId={selectedClient.currentProfessionalId}
        />
      )}
    </AppLayout>
  );
}
