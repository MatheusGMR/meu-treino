import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useClientDetails, useUpdateClientAssignment } from "@/hooks/useClients";
import { ClientInfoForm } from "@/components/clients/ClientInfoForm";
import { AssessmentsTab } from "@/components/clients/AssessmentsTab";
import { WorkoutsTab } from "@/components/clients/WorkoutsTab";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClientStatus } from "@/hooks/useClients";

const ClientDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useClientDetails(clientId!);
  const updateAssignment = useUpdateClientAssignment();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-muted rounded" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button className="mt-4" onClick={() => navigate("/personal/clients")}>
          Voltar para Clientes
        </Button>
      </div>
    );
  }

  const handleStatusChange = async (status: ClientStatus) => {
    if (clientId) {
      await updateAssignment.mutateAsync({
        clientId,
        data: { status },
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/personal/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{data.profile.full_name}</h1>
          <p className="text-muted-foreground">Detalhes do cliente</p>
        </div>
        {data.assignment && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={data.assignment.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="assessments">Avaliações</TabsTrigger>
          <TabsTrigger value="workouts">Treinos</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ClientInfoForm clientId={clientId!} profile={data.profile} />
        </TabsContent>

        <TabsContent value="assessments">
          <AssessmentsTab clientId={clientId!} />
        </TabsContent>

        <TabsContent value="workouts">
          <WorkoutsTab clientId={clientId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetails;
