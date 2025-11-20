import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMethods } from "@/hooks/useMethods";
import { MethodsTable } from "@/components/methods/MethodsTable";
import { MethodDialog } from "@/components/methods/MethodDialog";

const Methods = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [objectiveFilter, setObjectiveFilter] = useState<string>("all");
  const [energyCostFilter, setEnergyCostFilter] = useState<string>("all");
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>("all");
  const { data: methods, isLoading } = useMethods(search);

  // Filtrar métodos localmente
  const filteredMethods = methods?.filter((method) => {
    if (objectiveFilter !== "all" && method.objective !== objectiveFilter) return false;
    if (energyCostFilter !== "all" && method.energy_cost !== energyCostFilter) return false;
    if (riskLevelFilter !== "all" && method.risk_level !== riskLevelFilter) return false;
    return true;
  });

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

      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Buscar por nome ou carga..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={objectiveFilter} onValueChange={setObjectiveFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por objetivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os objetivos</SelectItem>
            <SelectItem value="Hipertrofia">Hipertrofia</SelectItem>
            <SelectItem value="Força">Força</SelectItem>
            <SelectItem value="Resistência">Resistência</SelectItem>
            <SelectItem value="Potência">Potência</SelectItem>
            <SelectItem value="Hipertrofia + Força">Hipertrofia + Força</SelectItem>
            <SelectItem value="Força + Hipertrofia">Força + Hipertrofia</SelectItem>
            <SelectItem value="Equilíbrio / Hipertrofia">Equilíbrio / Hipertrofia</SelectItem>
            <SelectItem value="Hipertrofia pesada">Hipertrofia pesada</SelectItem>
            <SelectItem value="Força + Potência">Força + Potência</SelectItem>
          </SelectContent>
        </Select>

        <Select value={energyCostFilter} onValueChange={setEnergyCostFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Custo energético" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os custos</SelectItem>
            <SelectItem value="Alto">Alto</SelectItem>
            <SelectItem value="Médio">Médio</SelectItem>
            <SelectItem value="Baixo">Baixo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Nível de risco" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os riscos</SelectItem>
            <SelectItem value="Baixo risco">Baixo risco</SelectItem>
            <SelectItem value="Médio risco">Médio risco</SelectItem>
            <SelectItem value="Alto risco">Alto risco</SelectItem>
            <SelectItem value="Alto risco de fadiga">Alto risco de fadiga</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <MethodsTable methods={filteredMethods || []} isLoading={isLoading} />

      <MethodDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
};

export default Methods;
