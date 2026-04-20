import { useMemo } from "react";
import { useExercises } from "./useExercises";
import type { Database } from "@/integrations/supabase/types";

type ExerciseBlock = "MOB" | "FORT" | "MS" | "MI" | "CARD" | "ALONG";

export type WorkoutType = "standard" | "protocolo_destravamento";

interface SessionLike {
  exercises: Array<{ exercise_id: string }>;
}

const REQUIRED_BLOCKS: { code: ExerciseBlock | "RESIST"; label: string; codes: ExerciseBlock[] }[] = [
  { code: "MOB", label: "Aquecimento (Mobilidade)", codes: ["MOB"] },
  { code: "FORT", label: "Fortalecimento", codes: ["FORT"] },
  { code: "RESIST", label: "Exercício Resistido (Musculação)", codes: ["MS", "MI"] },
  { code: "CARD", label: "Cardio", codes: ["CARD"] },
  { code: "ALONG", label: "Alongamento", codes: ["ALONG"] },
];

/**
 * Validates whether the temp workout includes all 5 mandatory blocks.
 * For Protocolo Destravamento, "Cardio" is dispensed.
 * Returns the list of present and missing blocks.
 */
export const useWorkoutBlockValidation = (
  sessions: SessionLike[],
  workoutType: WorkoutType = "standard"
) => {
  const { data: allExercises } = useExercises();

  return useMemo(() => {
    const exerciseById = new Map<string, any>(
      (allExercises || []).map((e: any) => [e.id, e])
    );

    const presentBlocks = new Set<string>();
    sessions.forEach((s) =>
      s.exercises.forEach((ex) => {
        const exercise = exerciseById.get(ex.exercise_id);
        if (exercise?.block) presentBlocks.add(exercise.block);
      })
    );

    const requiredBlocks = REQUIRED_BLOCKS.filter((b) => {
      if (workoutType === "protocolo_destravamento" && b.code === "CARD") return false;
      return true;
    });

    const checklist = requiredBlocks.map((b) => ({
      code: b.code,
      label: b.label,
      present: b.codes.some((c) => presentBlocks.has(c)),
    }));

    const missing = checklist.filter((c) => !c.present);
    const isValid = missing.length === 0;

    return {
      checklist,
      missing,
      isValid,
      missingLabels: missing.map((m) => m.label),
    };
  }, [allExercises, sessions, workoutType]);
};
