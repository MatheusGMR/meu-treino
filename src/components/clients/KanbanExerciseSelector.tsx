import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectionCard } from "./SelectionCard";
import { useExercises } from "@/hooks/useExercises";
import { useVolumes } from "@/hooks/useVolumes";
import { useMethods } from "@/hooks/useMethods";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";
import type { Enums } from "@/integrations/supabase/types";

interface KanbanExerciseSelectorProps {
  onSave: (exercise: SessionExerciseData) => void;
  onComplete?: () => void;
  orderIndex: number;
}

const EXERCISE_TYPES: { value: Enums<"exercise_type_enum">; label: string }[] = [
  { value: "Musculação", label: "Musculação" },
  { value: "Mobilidade", label: "Mobilidade" },
  { value: "Cardio", label: "Cardio" },
  { value: "Alongamento", label: "Alongamento" },
];

const EXERCISE_GROUPS: { value: Enums<"exercise_group">; label: string }[] = [
  { value: "Peito", label: "Peito" },
  { value: "Costas", label: "Costas" },
  { value: "Ombros", label: "Ombros" },
  { value: "Bíceps", label: "Bíceps" },
  { value: "Tríceps", label: "Tríceps" },
  { value: "Abdômen", label: "Abdômen" },
  { value: "Quadríceps", label: "Quadríceps" },
  { value: "Posterior", label: "Posterior" },
  { value: "Glúteos", label: "Glúteos" },
  { value: "Panturrilha", label: "Panturrilha" },
  { value: "Lombar", label: "Lombar" },
  { value: "Pernas", label: "Pernas" },
  { value: "Outro", label: "Outro" },
];

export function KanbanExerciseSelector({ 
  onSave, 
  onComplete, 
  orderIndex 
}: KanbanExerciseSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedVolume, setSelectedVolume] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const { data: allExercises } = useExercises();
  const { data: volumes } = useVolumes();
  const { data: methods } = useMethods();

  const availableGroups = useMemo(() => {
    if (!selectedType || !allExercises) return [];
    const groups = new Set(
      allExercises
        .filter(ex => ex.exercise_type === selectedType)
        .map(ex => ex.exercise_group)
    );
    return EXERCISE_GROUPS.filter(g => groups.has(g.value));
  }, [selectedType, allExercises]);

  const availableExercises = useMemo(() => {
    if (!selectedType || !selectedGroup || !allExercises) return [];
    return allExercises.filter(ex => 
      ex.exercise_type === selectedType && 
      ex.exercise_group === selectedGroup
    );
  }, [selectedType, selectedGroup, allExercises]);

  const isComplete = !!(
    selectedType && 
    selectedGroup && 
    selectedExercise && 
    selectedVolume && 
    selectedMethod
  );

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    setSelectedGroup(null);
    setSelectedExercise(null);
    setSelectedVolume(null);
    setSelectedMethod(null);
  };

  const handleGroupSelect = (group: string) => {
    setSelectedGroup(group);
    setSelectedExercise(null);
    setSelectedVolume(null);
    setSelectedMethod(null);
  };

  const handleExerciseSelect = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setSelectedVolume(null);
    setSelectedMethod(null);
  };

  const handleVolumeSelect = (volumeId: string) => {
    setSelectedVolume(volumeId);
    setSelectedMethod(null);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleAddAnother = () => {
    if (!isComplete) return;
    
    onSave({
      exercise_id: selectedExercise!,
      volume_id: selectedVolume!,
      method_id: selectedMethod!,
      order_index: orderIndex,
    });

    setSelectedType(null);
    setSelectedGroup(null);
    setSelectedExercise(null);
    setSelectedVolume(null);
    setSelectedMethod(null);
  };

  const handleComplete = () => {
    if (!isComplete) return;
    
    onSave({
      exercise_id: selectedExercise!,
      volume_id: selectedVolume!,
      method_id: selectedMethod!,
      order_index: orderIndex,
    });

    onComplete?.();
  };

  return (
    <div className="space-y-4">
      {/* Grid de 5 colunas */}
      <div className="grid grid-cols-5 gap-3">
        {/* Coluna 1: Tipo */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Tipo
          </h4>
          <ScrollArea className="h-[400px] pr-3">
            <div className="space-y-2">
              {EXERCISE_TYPES.map(type => (
                <SelectionCard
                  key={type.value}
                  title={type.label}
                  isSelected={selectedType === type.value}
                  onClick={() => handleTypeSelect(type.value)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Coluna 2: Grupo */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Grupo Muscular
          </h4>
          <ScrollArea className="h-[400px] pr-3">
            {!selectedType ? (
              <p className="text-xs text-muted-foreground p-3">
                Selecione um tipo primeiro
              </p>
            ) : availableGroups.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                Nenhum grupo disponível
              </p>
            ) : (
              <div className="space-y-2">
                {availableGroups.map(group => (
                  <SelectionCard
                    key={group.value}
                    title={group.label}
                    isSelected={selectedGroup === group.value}
                    onClick={() => handleGroupSelect(group.value)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Coluna 3: Exercício */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Exercício
          </h4>
          <ScrollArea className="h-[400px] pr-3">
            {!selectedGroup ? (
              <p className="text-xs text-muted-foreground p-3">
                Selecione um grupo primeiro
              </p>
            ) : availableExercises.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                Nenhum exercício encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {availableExercises.map(ex => (
                  <SelectionCard
                    key={ex.id}
                    title={ex.name}
                    subtitle={ex.level || undefined}
                    isSelected={selectedExercise === ex.id}
                    onClick={() => handleExerciseSelect(ex.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Coluna 4: Volume */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Volume
          </h4>
          <ScrollArea className="h-[400px] pr-3">
            {!selectedExercise ? (
              <p className="text-xs text-muted-foreground p-3">
                Selecione um exercício primeiro
              </p>
            ) : !volumes || volumes.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                Nenhum volume cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {volumes.map(vol => (
                  <SelectionCard
                    key={vol.id}
                    title={vol.name}
                    subtitle={`${vol.num_series}x${vol.num_exercises}`}
                    isSelected={selectedVolume === vol.id}
                    onClick={() => handleVolumeSelect(vol.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Coluna 5: Método */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Método
          </h4>
          <ScrollArea className="h-[400px] pr-3">
            {!selectedVolume ? (
              <p className="text-xs text-muted-foreground p-3">
                Selecione um volume primeiro
              </p>
            ) : !methods || methods.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                Nenhum método cadastrado
              </p>
            ) : (
              <div className="space-y-2">
                {methods.map(method => (
                  <SelectionCard
                    key={method.id}
                    title={method.name || `${method.reps_min}-${method.reps_max} reps`}
                    subtitle={method.objective || undefined}
                    isSelected={selectedMethod === method.id}
                    onClick={() => handleMethodSelect(method.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Indicador de progresso */}
      <div className="flex gap-2">
        {[
          { label: 'Tipo', selected: !!selectedType },
          { label: 'Grupo', selected: !!selectedGroup },
          { label: 'Exercício', selected: !!selectedExercise },
          { label: 'Volume', selected: !!selectedVolume },
          { label: 'Método', selected: !!selectedMethod },
        ].map((step, idx) => (
          <div
            key={idx}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              step.selected ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Botões de Ação */}
      {isComplete && (
        <div className="flex gap-3 justify-center pt-2 border-t animate-in fade-in duration-300">
          <Button
            onClick={handleAddAnother}
            variant="outline"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Outro Exercício
          </Button>
          <Button
            onClick={handleComplete}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Concluir Sessão
          </Button>
        </div>
      )}
    </div>
  );
}
