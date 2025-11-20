import { useState } from "react";
import { Pencil, Trash2, Shield, AlertCircle, AlertTriangle, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteMethod } from "@/hooks/useMethods";
import { MethodDialog } from "./MethodDialog";
import type { Database } from "@/integrations/supabase/types";

type Method = Database["public"]["Tables"]["methods"]["Row"];

interface MethodsTableProps {
  methods: Method[];
  isLoading: boolean;
}

const getRiskIcon = (riskLevel: string) => {
  switch (riskLevel) {
    case "Baixo risco":
      return <Shield className="w-4 h-4 text-green-500" />;
    case "Médio risco":
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    case "Alto risco":
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case "Alto risco de fadiga":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

const getEnergyCostBadge = (energyCost: string) => {
  switch (energyCost) {
    case "Alto":
      return <Badge variant="destructive">Alto</Badge>;
    case "Médio":
      return <Badge>Médio</Badge>;
    case "Baixo":
      return <Badge variant="secondary">Baixo</Badge>;
    default:
      return null;
  }
};

const getObjectiveBadge = (objective: string | null) => {
  if (!objective) return null;
  
  const colorMap: Record<string, string> = {
    "Hipertrofia": "bg-purple-500 text-white hover:bg-purple-600",
    "Força": "bg-red-500 text-white hover:bg-red-600",
    "Resistência": "bg-green-500 text-white hover:bg-green-600",
    "Potência": "bg-orange-500 text-white hover:bg-orange-600",
    "Hipertrofia + Força": "bg-blue-500 text-white hover:bg-blue-600",
    "Força + Hipertrofia": "bg-blue-600 text-white hover:bg-blue-700",
    "Equilíbrio / Hipertrofia": "bg-teal-500 text-white hover:bg-teal-600",
    "Hipertrofia pesada": "bg-purple-700 text-white hover:bg-purple-800",
    "Força + Potência": "bg-red-600 text-white hover:bg-red-700",
  };
  
  return (
    <Badge className={colorMap[objective] || ""}>
      {objective}
    </Badge>
  );
};

export const MethodsTable = ({ methods, isLoading }: MethodsTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMethod, setEditMethod] = useState<Method | null>(null);
  const deleteMethod = useDeleteMethod();

  const handleDelete = () => {
    if (deleteId) {
      deleteMethod.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!methods || methods.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum método encontrado
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Repetições</TableHead>
              <TableHead>Descanso</TableHead>
              <TableHead>Carga</TableHead>
              <TableHead>Risco</TableHead>
              <TableHead>Custo Energético</TableHead>
              <TableHead>Cadência</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.map((method) => (
              <TableRow key={method.id}>
                <TableCell className="font-medium">
                  {method.name || "Sem nome"}
                  {method.reps_description && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {method.reps_description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {getObjectiveBadge(method.objective)}
                </TableCell>
                <TableCell>
                  {method.reps_min}-{method.reps_max}
                </TableCell>
                <TableCell>{method.rest_seconds}s</TableCell>
                <TableCell>
                  <Badge variant={
                    method.load_level === "Alta" ? "destructive" :
                    method.load_level === "Baixa" ? "secondary" : "default"
                  }>
                    {method.load_level}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Tooltip>
                    <TooltipTrigger>
                      {getRiskIcon(method.risk_level)}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{method.risk_level}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {getEnergyCostBadge(method.energy_cost)}
                </TableCell>
                <TableCell>
                  {method.cadence_contraction}-{method.cadence_pause}-
                  {method.cadence_stretch}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {method.video_url && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(method.video_url!, "_blank")}
                        >
                          <Youtube className="w-4 h-4 text-red-500" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver vídeo no YouTube</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditMethod(method)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(method.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MethodDialog
        method={editMethod}
        open={!!editMethod}
        onOpenChange={(open) => !open && setEditMethod(null)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este método? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
};
