import { useState } from "react";
import { Edit, Trash2, Eye } from "lucide-react";
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
import type { Database } from "@/integrations/supabase/types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface ExercisesTableProps {
  exercises: Exercise[];
  isLoading: boolean;
}

export const ExercisesTable = ({ exercises, isLoading }: ExercisesTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const deleteMutation = useDeleteExercise();

  const handleDelete = () => {
    if (!deleteId) return;
    const exercise = exercises.find((e) => e.id === deleteId);
    deleteMutation.mutate({
      id: deleteId,
      mediaUrl: exercise?.media_url || undefined,
    });
    setDeleteId(null);
  };

  const getIntensityColor = (intensity: string) => {
    const colors = {
      Fácil: "bg-green-500/10 text-green-500",
      Intermediário: "bg-yellow-500/10 text-yellow-500",
      Difícil: "bg-red-500/10 text-red-500",
    };
    return colors[intensity as keyof typeof colors] || "";
  };

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
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Grupo Muscular</TableHead>
              <TableHead>Intensidade</TableHead>
              <TableHead>Equipamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((exercise) => (
              <TableRow key={exercise.id}>
                <TableCell className="font-medium">{exercise.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{exercise.exercise_group}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getIntensityColor(exercise.intensity)}>
                    {exercise.intensity}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {exercise.equipment || "-"}
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
