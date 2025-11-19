import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Check, X, GripVertical } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import { useVolumes } from "@/hooks/useVolumes";
import { useMethods } from "@/hooks/useMethods";

interface InlineExerciseAdderProps {
  onSave: (exercise: {
    exercise_id: string;
    volume_id: string;
    method_id: string;
    order_index: number;
  }) => void;
  onCancel: () => void;
  orderIndex: number;
}

const EXERCISE_TYPES = [
  { value: "Musculação", label: "Musculação" },
  { value: "Mobilidade", label: "Mobilidade" },
  { value: "Cardio", label: "Cardio" },
  { value: "Alongamento", label: "Alongamento" },
];

const MUSCLE_GROUPS = [
  "Abdômen", "Peito", "Costas", "Pernas", "Ombros", 
  "Bíceps", "Tríceps", "Glúteos", "Panturrilha", "Outro"
];

const MOBILITY_GROUPS = ["Superior", "Inferior", "Tronco", "Completo"];
const CARDIO_GROUPS = ["Baixo Impacto", "Alto Impacto", "HIIT", "Contínuo"];
const STRETCH_GROUPS = ["Superior", "Inferior", "Tronco", "Completo"];

export function InlineExerciseAdder({ onSave, onCancel, orderIndex }: InlineExerciseAdderProps) {
  const [exerciseType, setExerciseType] = useState<string>("");
  const [subcategory, setSubcategory] = useState<string>("");
  const [exerciseId, setExerciseId] = useState<string>("");
  const [volumeId, setVolumeId] = useState<string>("");
  const [methodId, setMethodId] = useState<string>("");

  const { data: allExercises } = useExercises();
  const { data: volumes } = useVolumes();
  const { data: methods } = useMethods();

  const filteredExercises = allExercises?.filter(ex => {
    if (!exerciseType || !subcategory) return false;
    return ex.exercise_type === exerciseType && ex.exercise_group === subcategory;
  });

  const canSelectSubcategory = !!exerciseType;
  const canSelectExercise = !!subcategory && !!filteredExercises && filteredExercises.length > 0;
  const canSelectVolume = !!exerciseId;
  const canSelectMethod = !!volumeId;
  const isComplete = !!methodId;

  const getSubcategoryOptions = () => {
    switch (exerciseType) {
      case "Musculação":
        return MUSCLE_GROUPS;
      case "Mobilidade":
        return MOBILITY_GROUPS;
      case "Cardio":
        return CARDIO_GROUPS;
      case "Alongamento":
        return STRETCH_GROUPS;
      default:
        return [];
    }
  };

  const handleTypeChange = (value: string) => {
    setExerciseType(value);
    setSubcategory("");
    setExerciseId("");
    setVolumeId("");
    setMethodId("");
  };

  const handleSubcategoryChange = (value: string) => {
    setSubcategory(value);
    setExerciseId("");
    setVolumeId("");
    setMethodId("");
  };

  const handleExerciseChange = (value: string) => {
    setExerciseId(value);
    setVolumeId("");
    setMethodId("");
  };

  const handleVolumeChange = (value: string) => {
    setVolumeId(value);
    setMethodId("");
  };

  const handleSave = () => {
    if (isComplete) {
      onSave({
        exercise_id: exerciseId,
        volume_id: volumeId,
        method_id: methodId,
        order_index: orderIndex,
      });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center p-2 border border-dashed border-primary/30 rounded-md bg-muted/20 animate-fade-in">
      {/* Drag handle placeholder */}
      <div className="col-span-1 flex justify-center opacity-30">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Tipo */}
      <div className="col-span-2">
        <Select value={exerciseType} onValueChange={handleTypeChange}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            {EXERCISE_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subcategoria */}
      <div className="col-span-2">
        <Select 
          value={subcategory} 
          onValueChange={handleSubcategoryChange}
          disabled={!canSelectSubcategory}
        >
          <SelectTrigger className="h-8 text-xs" disabled={!canSelectSubcategory}>
            <SelectValue placeholder="Grupo" />
          </SelectTrigger>
          <SelectContent>
            {getSubcategoryOptions().map(group => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Exercício */}
      <div className="col-span-2">
        <Select 
          value={exerciseId} 
          onValueChange={handleExerciseChange}
          disabled={!canSelectExercise}
        >
          <SelectTrigger className="h-8 text-xs" disabled={!canSelectExercise}>
            <SelectValue placeholder="Exercício" />
          </SelectTrigger>
          <SelectContent>
            {filteredExercises?.map(ex => (
              <SelectItem key={ex.id} value={ex.id}>
                {ex.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Volume */}
      <div className="col-span-2">
        <Select 
          value={volumeId} 
          onValueChange={handleVolumeChange}
          disabled={!canSelectVolume}
        >
          <SelectTrigger className="h-8 text-xs" disabled={!canSelectVolume}>
            <SelectValue placeholder="Volume" />
          </SelectTrigger>
          <SelectContent>
            {volumes?.map(v => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Método */}
      <div className="col-span-2">
        <Select 
          value={methodId} 
          onValueChange={setMethodId}
          disabled={!canSelectMethod}
        >
          <SelectTrigger className="h-8 text-xs" disabled={!canSelectMethod}>
            <SelectValue placeholder="Método" />
          </SelectTrigger>
          <SelectContent>
            {methods?.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.name || `${m.reps_min}-${m.reps_max} reps`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ações */}
      <div className="col-span-1 flex gap-1 justify-center">
        {isComplete ? (
          <Button onClick={handleSave} size="icon" variant="ghost" className="h-7 w-7">
            <Check className="w-4 h-4 text-green-600" />
          </Button>
        ) : (
          <Button onClick={onCancel} size="icon" variant="ghost" className="h-7 w-7">
            <X className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
}
