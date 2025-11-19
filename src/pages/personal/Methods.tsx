import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMethods } from "@/hooks/useMethods";
import { MethodsTable } from "@/components/methods/MethodsTable";
import { MethodDialog } from "@/components/methods/MethodDialog";

const Methods = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: methods, isLoading } = useMethods(search);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Métodos</h1>
          <p className="text-muted-foreground">
            Gerencie os métodos de treinamento
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Método
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nome ou carga..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <MethodsTable methods={methods || []} isLoading={isLoading} />

      <MethodDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default Methods;
