import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { MethodDialog } from "./MethodDialog";
import { useDeleteMethod } from "@/hooks/useMethods";
import type { Database } from "@/integrations/supabase/types";

type Method = Database["public"]["Tables"]["methods"]["Row"];

interface MethodsTableProps {
  methods: Method[];
  isLoading: boolean;
}

const getLoadColor = (level: string) => {
  switch (level) {
    case "Alta":
      return "destructive";
    case "Média":
      return "default";
    case "Baixa":
      return "secondary";
    default:
      return "default";
  }
};

export const MethodsTable = ({ methods, isLoading }: MethodsTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editMethod, setEditMethod] = useState<Method | undefined>();
  const deleteMutation = useDeleteMethod();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!methods.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum método encontrado
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Repetições</TableHead>
              <TableHead>Descanso</TableHead>
              <TableHead>Carga</TableHead>
              <TableHead>Cadência</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {methods.map((method) => (
              <TableRow key={method.id}>
                <TableCell className="font-medium">
                  {method.name || "Sem nome"}
                </TableCell>
                <TableCell>
                  {method.reps_min}-{method.reps_max}
                </TableCell>
                <TableCell>{method.rest_seconds}s</TableCell>
                <TableCell>
                  <Badge variant={getLoadColor(method.load_level)}>
                    {method.load_level}
                  </Badge>
                </TableCell>
                <TableCell>
                  {method.cadence_contraction}/{method.cadence_pause}/
                  {method.cadence_stretch}
                </TableCell>
                <TableCell className="text-right space-x-2">
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
        onOpenChange={(open) => !open && setEditMethod(undefined)}
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
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
