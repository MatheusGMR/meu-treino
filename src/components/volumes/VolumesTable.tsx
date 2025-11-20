import { useState } from "react";
import { Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { VolumeDialog } from "./VolumeDialog";
import { useDeleteVolume } from "@/hooks/useVolumes";
import type { Database } from "@/integrations/supabase/types";

type Volume = Database["public"]["Tables"]["volumes"]["Row"];

interface VolumesTableProps {
  volumes: Volume[];
  isLoading: boolean;
}

const getGoalColor = (goal: string | null) => {
  if (!goal) return "bg-muted text-muted-foreground";
  if (goal.includes("Força")) return "bg-red-500/10 text-red-700 border-red-500/30";
  if (goal.includes("Hipertrofia")) return "bg-purple-500/10 text-purple-700 border-purple-500/30";
  if (goal.includes("Resistência")) return "bg-green-500/10 text-green-700 border-green-500/30";
  if (goal.includes("Iniciante")) return "bg-blue-500/10 text-blue-600 border-blue-500/30";
  if (goal.includes("Intermediário")) return "bg-blue-500/15 text-blue-700 border-blue-500/30";
  if (goal.includes("Avançado")) return "bg-blue-500/20 text-blue-800 border-blue-500/30";
  return "bg-muted text-muted-foreground";
};

export const VolumesTable = ({ volumes, isLoading }: VolumesTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editVolume, setEditVolume] = useState<Volume | undefined>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const deleteMutation = useDeleteVolume();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
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

  if (!volumes.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum volume encontrado
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Séries</TableHead>
              <TableHead>Exercícios</TableHead>
              <TableHead>Volume Semanal</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volumes.map((volume) => {
              const isExpanded = expandedRows.has(volume.id);
              const hasWeeklyVolume = volume.min_weekly_sets && volume.optimal_weekly_sets && volume.max_weekly_sets;
              
              return (
                <>
                  <TableRow key={volume.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell onClick={() => toggleRow(volume.id)}>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium" onClick={() => toggleRow(volume.id)}>
                      {volume.name}
                    </TableCell>
                    <TableCell onClick={() => toggleRow(volume.id)}>
                      {volume.goal ? (
                        <Badge variant="outline" className={getGoalColor(volume.goal)}>
                          {volume.goal}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => toggleRow(volume.id)}>
                      {volume.series_min && volume.series_max ? (
                        <span className="text-sm">{volume.series_min}-{volume.series_max}</span>
                      ) : (
                        <span className="text-sm">{volume.num_series}</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => toggleRow(volume.id)}>
                      {volume.exercise_min && volume.exercise_max ? (
                        <span className="text-sm">{volume.exercise_min}-{volume.exercise_max}</span>
                      ) : (
                        <span className="text-sm">{volume.num_exercises}</span>
                      )}
                    </TableCell>
                    <TableCell onClick={() => toggleRow(volume.id)}>
                      {hasWeeklyVolume ? (
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                            {volume.min_weekly_sets}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-500/30">
                            {volume.optimal_weekly_sets}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-red-500/10 text-red-700 border-red-500/30">
                            {volume.max_weekly_sets}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditVolume(volume);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(volume.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30">
                        <div className="p-4 space-y-4">
                          {volume.movement_pattern && (
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium">Padrão de Movimento</h4>
                              <p className="text-sm text-muted-foreground">{volume.movement_pattern}</p>
                            </div>
                          )}

                          {volume.weekly_volume_description && (
                            <div className="space-y-1">
                              <h4 className="text-sm font-medium">Descrição do Volume Semanal</h4>
                              <p className="text-sm text-muted-foreground">{volume.weekly_volume_description}</p>
                            </div>
                          )}

                          {hasWeeklyVolume && (
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Faixa de Volume Semanal</h4>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-20">Min ({volume.min_weekly_sets})</span>
                                  <div className="flex-1 relative h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-yellow-500"
                                      style={{ width: `${(volume.min_weekly_sets! / volume.max_weekly_sets!) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-20">Ótimo ({volume.optimal_weekly_sets})</span>
                                  <div className="flex-1 relative h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500"
                                      style={{ width: `${(volume.optimal_weekly_sets! / volume.max_weekly_sets!) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-20">Max ({volume.max_weekly_sets})</span>
                                  <div className="flex-1 relative h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-red-500" style={{ width: '100%' }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <VolumeDialog
        volume={editVolume}
        open={!!editVolume}
        onOpenChange={(open) => !open && setEditVolume(undefined)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este volume? Esta ação não pode ser
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
