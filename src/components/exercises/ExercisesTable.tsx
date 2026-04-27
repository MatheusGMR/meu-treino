import { useMemo, useState } from "react";
import { Edit, Trash2, Eye, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import { ExerciseDialog } from "./ExerciseDialog";
import { ExercisePreview } from "./ExercisePreview";
import { useDeleteExercise } from "@/hooks/useExercises";
import { NewBadge } from "@/components/shared/NewBadge";
import type { Database } from "@/integrations/supabase/types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface ExercisesTableProps {
  exercises: Exercise[];
  isLoading: boolean;
}

type SortKey = "external_id" | "name" | "block" | "exercise_group" | "safety_level" | "level";
type SortDir = "asc" | "desc";

const SAFETY_ORDER: Record<string, number> = { S1: 1, S2: 2, S3: 3, S4: 4, S5: 5 };
const LEVEL_ORDER: Record<string, number> = { Iniciante: 1, Intermediário: 2, Avançado: 3 };

export const ExercisesTable = ({ exercises, isLoading }: ExercisesTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const deleteMutation = useDeleteExercise();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId);
    setDeleteId(null);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      // 3º clique limpa ordenação
      setSortKey(null);
      setSortDir("asc");
    }
  };

  const getSortValue = (ex: any, key: SortKey): string | number => {
    switch (key) {
      case "external_id":
        return (ex.external_id ?? "").toString().toLowerCase();
      case "name":
        return (ex.name ?? "").toString().toLowerCase();
      case "block":
        return (ex.block ?? "").toString().toLowerCase();
      case "exercise_group":
        return (ex.exercise_group ?? "").toString().toLowerCase();
      case "safety_level":
        return SAFETY_ORDER[ex.safety_level] ?? 999;
      case "level":
        return LEVEL_ORDER[ex.level] ?? 999;
    }
  };

  const sortedExercises = useMemo(() => {
    if (!sortKey) return exercises;
    const arr = [...exercises];
    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [exercises, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    );
  };

  const SortableHead = ({
    k,
    label,
    align = "left",
  }: {
    k: SortKey;
    label: string;
    align?: "left" | "right";
  }) => (
    <TableHead className={align === "right" ? "text-right" : ""}>
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1.5 hover:text-foreground transition-colors ${
          sortKey === k ? "text-foreground font-semibold" : ""
        }`}
        title="Clique para ordenar"
      >
        {label}
        <SortIcon k={k} />
      </button>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <p className="text-muted-foreground mb-2">Nenhum exercício encontrado</p>
        <p className="text-sm text-muted-foreground">
          Crie seu primeiro exercício para começar!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg bg-card/100 backdrop-blur-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead k="external_id" label="ID" />
              <SortableHead k="name" label="Nome" />
              <SortableHead k="block" label="Bloco" />
              <SortableHead k="exercise_group" label="Grupo" />
              <SortableHead k="safety_level" label="Segurança" />
              <SortableHead k="level" label="Nível" />
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedExercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {(exercise as any).external_id || "—"}
                </TableCell>
                <TableCell className="font-medium pr-6">
                  <div className="flex items-center gap-2">
                    {exercise.name}
                    {exercise.is_new && exercise.added_at && (
                      <NewBadge 
                        addedAt={exercise.added_at} 
                        sourceReference={exercise.source_reference} 
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {(exercise as any).block ? (
                    <Badge variant="secondary">{(exercise as any).block}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{exercise.exercise_group}</Badge>
                </TableCell>
                <TableCell>
                  {(exercise as any).safety_level ? (
                    <Badge
                      className={
                        (exercise as any).safety_level === "S1" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
                        (exercise as any).safety_level === "S2" ? "bg-lime-500/20 text-lime-300 border-lime-500/40" :
                        (exercise as any).safety_level === "S3" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                        (exercise as any).safety_level === "S4" ? "bg-orange-500/20 text-orange-300 border-orange-500/40" :
                        "bg-red-500/20 text-red-300 border-red-500/40"
                      }
                    >
                      {(exercise as any).safety_level}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {exercise.level ? (
                    <Badge 
                      variant={
                        exercise.level === "Iniciante" ? "default" :
                        exercise.level === "Intermediário" ? "secondary" :
                        "destructive"
                      }
                    >
                      {exercise.level}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setPreviewExercise(exercise)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditExercise(exercise)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(exercise.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ExerciseDialog
        exercise={editExercise || undefined}
        open={!!editExercise}
        onOpenChange={(open) => !open && setEditExercise(null)}
      />

      <ExercisePreview
        exercise={previewExercise}
        open={!!previewExercise}
        onOpenChange={(open) => !open && setPreviewExercise(null)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este exercício? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
