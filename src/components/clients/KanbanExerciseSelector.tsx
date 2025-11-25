import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectionCard } from "./SelectionCard";
import { useExercises } from "@/hooks/useExercises";
import { useVolumes } from "@/hooks/useVolumes";
import { useMethods } from "@/hooks/useMethods";
import { ExercisePreview } from "@/components/exercises/ExercisePreview";
import { checkContraindicationBatch } from "@/hooks/useContraindicationCheck";
import { toast } from "@/hooks/use-toast";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";
import type { Enums, Database } from "@/integrations/supabase/types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface KanbanExerciseSelectorProps {
  onSave: (exercise: SessionExerciseData) => void;
  onComplete?: () => void;
  orderIndex: number;
  clientMedicalConditions?: string | null;
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
  orderIndex,
  clientMedicalConditions
}: KanbanExerciseSelectorProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedVolume, setSelectedVolume] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeColumnIndex, setActiveColumnIndex] = useState<number>(0);
  const [hoverColumnIndex, setHoverColumnIndex] = useState<number | null>(null);

  const { data: allExercises } = useExercises();
  const { data: volumes } = useVolumes();
  const { data: methods } = useMethods();

  // Verificar contraindicações em lote
  const contraindicationResults = useMemo(() => {
    if (!allExercises || !clientMedicalConditions) return new Map();
    return checkContraindicationBatch(allExercises, clientMedicalConditions);
  }, [allExercises, clientMedicalConditions]);

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
    setActiveColumnIndex(1);
  };

  const handleGroupSelect = (group: string) => {
    setSelectedGroup(group);
    setSelectedExercise(null);
    setSelectedVolume(null);
    setSelectedMethod(null);
    setActiveColumnIndex(2);
  };

  const handleExerciseSelect = (exerciseId: string) => {
    setSelectedExercise(exerciseId);
    setSelectedVolume(null);
    setSelectedMethod(null);
    setActiveColumnIndex(3);

    // Verificar contraindicação e mostrar toast
    const contraindicationCheck = contraindicationResults.get(exerciseId);
    if (contraindicationCheck?.hasRisk) {
      const exercise = allExercises?.find(ex => ex.id === exerciseId);
      toast({
        variant: contraindicationCheck.severity === 'error' ? 'destructive' : 'default',
        title: contraindicationCheck.severity === 'error' 
          ? "⚠️ Atenção: Contraindicação Crítica" 
          : "⚠️ Atenção: Contraindicação",
        description: `${exercise?.name}: ${contraindicationCheck.message}`,
        duration: 6000,
      });
    }
  };

  const handleVolumeSelect = (volumeId: string) => {
    setSelectedVolume(volumeId);
    setSelectedMethod(null);
    setActiveColumnIndex(4);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handleAddAnother = () => {
    if (!isComplete) return;
    
    const exerciseData: SessionExerciseData = {
      exercise_id: selectedExercise!,
      volume_id: selectedVolume!,
      method_id: selectedMethod!,
      order_index: orderIndex,
    };
    
    onSave(exerciseData);

    setSelectedType(null);
    setSelectedGroup(null);
    setSelectedExercise(null);
    setSelectedVolume(null);
    setSelectedMethod(null);
    setActiveColumnIndex(0);
  };

  const handleComplete = () => {
    if (!isComplete) return;
    
    const exerciseData: SessionExerciseData = {
      exercise_id: selectedExercise!,
      volume_id: selectedVolume!,
      method_id: selectedMethod!,
      order_index: orderIndex,
    };
    
    onSave(exerciseData);

    onComplete?.();
  };

  const getColumnFlexClass = (columnIndex: number) => {
    const effectiveActiveIndex = hoverColumnIndex ?? activeColumnIndex;
    if (columnIndex < effectiveActiveIndex) return "flex-[0.5]";
    if (columnIndex === effectiveActiveIndex) return "flex-[3]";
    return "flex-[1]";
  };

  const selectedValues = [selectedType, selectedGroup, selectedExercise, selectedVolume, selectedMethod];

  return (
    <div className="space-y-4">
      {/* Grid de 5 colunas com efeito carta de baralho */}
      <div className="flex gap-4 lg:gap-6 transition-all duration-300">
        {/* Coluna 1: Tipo */}
        <div 
          className={cn("space-y-2 min-w-[140px] transition-all duration-300", getColumnFlexClass(0))}
          onMouseEnter={() => setHoverColumnIndex(0)}
          onMouseLeave={() => setHoverColumnIndex(null)}
        >
          <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 leading-tight">
            Tipo
          </h4>
          <div className="h-[300px] md:h-[350px] lg:h-[400px] xl:h-[450px] overflow-y-auto scrollarea-hidden">
            {selectedType && activeColumnIndex > 0 ? (
              <SelectionCard
                title={EXERCISE_TYPES.find(t => t.value === selectedType)?.label || selectedType}
                isSelected={true}
                onClick={() => handleTypeSelect(selectedType)}
                compact={true}
                onExpand={() => setActiveColumnIndex(0)}
              />
            ) : (
              <div className="space-y-2 pr-1">
                {EXERCISE_TYPES.map(type => (
                  <SelectionCard
                    key={type.value}
                    title={type.label}
                    isSelected={selectedType === type.value}
                    onClick={() => handleTypeSelect(type.value)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna 2: Grupo */}
        <div 
          className={cn("space-y-2 min-w-[140px] transition-all duration-300", getColumnFlexClass(1))}
          onMouseEnter={() => setHoverColumnIndex(1)}
          onMouseLeave={() => setHoverColumnIndex(null)}
        >
          <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 leading-tight">
            Grupo Muscular
          </h4>
          <div className="h-[300px] md:h-[350px] lg:h-[400px] xl:h-[450px] overflow-y-auto scrollarea-hidden">
            {!selectedType ? (
              <p className="text-xs text-muted-foreground p-3">
                Selecione um tipo primeiro
              </p>
            ) : selectedGroup && activeColumnIndex > 1 ? (
              <SelectionCard
                title={EXERCISE_GROUPS.find(g => g.value === selectedGroup)?.label || selectedGroup}
                isSelected={true}
                onClick={() => handleGroupSelect(selectedGroup)}
                compact={true}
                onExpand={() => setActiveColumnIndex(1)}
              />
            ) : availableGroups.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                Nenhum grupo disponível
              </p>
            ) : (
              <div className="space-y-2 pr-1">
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
          </div>
        </div>

        {/* Coluna 3: Exercício */}
        <div 
          className={cn("space-y-2 min-w-[140px] transition-all duration-300", getColumnFlexClass(2))}
          onMouseEnter={() => setHoverColumnIndex(2)}
          onMouseLeave={() => setHoverColumnIndex(null)}
        >
          <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 leading-tight">
            Exercício
          </h4>
          <div className="h-[300px] md:h-[350px] lg:h-[400px] xl:h-[450px] overflow-y-auto scrollarea-hidden">
            {!selectedGroup ? (
              <p className="text-xs text-muted-foreground p-3">
                Selecione um grupo primeiro
              </p>
            ) : selectedExercise && activeColumnIndex > 2 ? (
              <SelectionCard
                title={availableExercises.find(ex => ex.id === selectedExercise)?.name || selectedExercise}
                isSelected={true}
                onClick={() => handleExerciseSelect(selectedExercise)}
                compact={true}
                onExpand={() => setActiveColumnIndex(2)}
              />
            ) : availableExercises.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                Nenhum exercício encontrado
              </p>
            ) : (
              <div className="space-y-2 pr-1">
                {availableExercises.map(ex => {
                  const contraindicationCheck = contraindicationResults.get(ex.id);
                  return (
                    <SelectionCard
                      key={ex.id}
                      title={ex.name}
                      subtitle={ex.level || undefined}
                      isSelected={selectedExercise === ex.id}
                      onClick={() => handleExerciseSelect(ex.id)}
                      onPreview={() => {
                        setPreviewExercise(ex);
                        setShowPreview(true);
                      }}
                      hasWarning={contraindicationCheck?.hasRisk}
                      warningMessage={contraindicationCheck?.message}
                      warningSeverity={contraindicationCheck?.severity}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna 4: Volume */}
        <div 
          className={cn("space-y-2 min-w-[140px] transition-all duration-300", getColumnFlexClass(3))}
          onMouseEnter={() => setHoverColumnIndex(3)}
          onMouseLeave={() => setHoverColumnIndex(null)}
        >
          <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 leading-tight">
            Volume
          </h4>
          <div className="h-[300px] md:h-[350px] lg:h-[400px] xl:h-[450px] overflow-y-auto scrollarea-hidden">
            {!selectedExercise ? (
              <p className="text-xs text-muted-foreground p-3">
                Selecione um exercício primeiro
              </p>
            ) : selectedVolume && activeColumnIndex > 3 ? (
              <SelectionCard
                title={volumes?.find(v => v.id === selectedVolume)?.name || selectedVolume}
                isSelected={true}
                onClick={() => handleVolumeSelect(selectedVolume)}
                compact={true}
                onExpand={() => setActiveColumnIndex(3)}
              />
            ) : !volumes || volumes.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                Nenhum volume cadastrado
              </p>
            ) : (
              <div className="space-y-2 pr-1">
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
          </div>
        </div>

        {/* Coluna 5: Método */}
        <div 
          className={cn("space-y-2 min-w-[140px] transition-all duration-300", getColumnFlexClass(4))}
          onMouseEnter={() => setHoverColumnIndex(4)}
          onMouseLeave={() => setHoverColumnIndex(null)}
        >
          <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-3 leading-tight">
            Método
          </h4>
          <div className="h-[300px] md:h-[350px] lg:h-[400px] xl:h-[450px] overflow-y-auto scrollarea-hidden">
            {!selectedVolume ? (
              <p className="text-xs text-muted-foreground p-3">
                Selecione um volume primeiro
              </p>
            ) : selectedMethod && isComplete ? (
              <SelectionCard
                title={methods?.find(m => m.id === selectedMethod)?.name || selectedMethod}
                isSelected={true}
                onClick={() => handleMethodSelect(selectedMethod)}
                compact={true}
                onExpand={() => setActiveColumnIndex(4)}
              />
            ) : !methods || methods.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                Nenhum método cadastrado
              </p>
            ) : (
              <div className="space-y-2 pr-1">
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
          </div>
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

      {/* Botão de Ação - Aparece quando linha completa */}
      {isComplete && (
        <div className="flex justify-center pt-4 border-t animate-in fade-in duration-300">
          <Button
            onClick={handleAddAnother}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
          Adicionar Outro Exercício
          </Button>
        </div>
      )}

      <ExercisePreview
        exercise={previewExercise}
        open={showPreview}
        onOpenChange={setShowPreview}
      />
    </div>
  );
}
