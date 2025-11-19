import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExercises } from "@/hooks/useExercises";
import { useVolumes } from "@/hooks/useVolumes";
import { useMethods } from "@/hooks/useMethods";
import { Search, Plus, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";

interface ExercisePickerWithAnalysisProps {
  onAddExercise: (exercise: SessionExerciseData) => void;
  selectedExerciseIds: string[];
  contraindications?: string[];
}

export const ExercisePickerWithAnalysis = ({
  onAddExercise,
  selectedExerciseIds,
  contraindications = [],
}: ExercisePickerWithAnalysisProps) => {
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [selectedVolume, setSelectedVolume] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  const { data: exercises } = useExercises();
  const { data: volumes } = useVolumes();
  const { data: methods } = useMethods();

  // Filtrar exercícios
  const filteredExercises = exercises?.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = filterGroup === "all" || ex.exercise_group === filterGroup;
    const notSelected = !selectedExerciseIds.includes(ex.id);
    return matchesSearch && matchesGroup && notSelected;
  });

  // Grupos musculares únicos
  const muscleGroups = Array.from(
    new Set(exercises?.map((ex) => ex.exercise_group) || [])
  );

  // Verificar se exercício tem contraindicação
  const hasContraindication = (exercise: any) => {
    if (!exercise.contraindication) return false;
    return contraindications.some((c) =>
      exercise.contraindication?.toLowerCase().includes(c.toLowerCase())
    );
  };

  const handleAddExercise = (exerciseId: string) => {
    if (!selectedVolume || !selectedMethod) {
      return;
    }

    onAddExercise({
      exercise_id: exerciseId,
      volume_id: selectedVolume,
      method_id: selectedMethod,
      order_index: selectedExerciseIds.length,
    });

    // Reset selections
    setSearch("");
  };

  // Set defaults
  if (volumes && volumes.length > 0 && !selectedVolume) {
    setSelectedVolume(volumes[0].id);
  }
  if (methods && methods.length > 0 && !selectedMethod) {
    setSelectedMethod(methods[0].id);
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={filterGroup} onValueChange={setFilterGroup}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os grupos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os grupos</SelectItem>
            {muscleGroups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedVolume} onValueChange={setSelectedVolume}>
            <SelectTrigger>
              <SelectValue placeholder="Volume" />
            </SelectTrigger>
            <SelectContent>
              {volumes?.map((vol) => (
                <SelectItem key={vol.id} value={vol.id}>
                  {vol.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Método" />
            </SelectTrigger>
            <SelectContent>
              {methods?.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  {method.name || `${method.reps_min}-${method.reps_max} reps`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="max-h-64 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-4">
          {filteredExercises?.map((exercise) => {
            const contraindicated = hasContraindication(exercise);
            const hasWarning = exercise.contraindication && !contraindicated;

            return (
              <div
                key={exercise.id}
                className="flex items-center justify-between p-2 rounded border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{exercise.name}</p>
                    {contraindicated && (
                      <XCircle className="w-4 h-4 flex-shrink-0 text-destructive" />
                    )}
                    {hasWarning && (
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-warning" />
                    )}
                    {!contraindicated && !hasWarning && (
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-success" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {exercise.exercise_group}
                  </p>
                  {contraindicated && (
                    <p className="text-xs text-destructive mt-1">Contraindicado</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={contraindicated ? "ghost" : "default"}
                  onClick={() => handleAddExercise(exercise.id)}
                  disabled={contraindicated || !selectedVolume || !selectedMethod}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            );
          })}

          {filteredExercises?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum exercício encontrado
            </p>
          )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
