import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HealthWarning {
  severity: "warning" | "danger" | "critical";
  condition: string;
  message: string;
  affectedExercises: Array<{ id: string; name: string; group: string }>;
  recommendation: string;
}

interface CompatibilityResult {
  compatible: boolean;
  warnings: HealthWarning[];
  criticalIssues: HealthWarning[];
  recommendations: string[];
  riskLevel: "safe" | "caution" | "high-risk" | "critical";
}

export const useHealthCompatibilityCheck = (clientId?: string, workoutId?: string) => {
  return useQuery({
    queryKey: ["health-compatibility", clientId, workoutId],
    queryFn: async (): Promise<CompatibilityResult> => {
      if (!clientId || !workoutId) {
        return {
          compatible: true,
          warnings: [],
          criticalIssues: [],
          recommendations: [],
          riskLevel: "safe",
        };
      }

      // 1. Buscar condições médicas do cliente
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("medical_conditions")
        .eq("id", clientId)
        .single();

      const medicalConditions = clientProfile?.medical_conditions?.toLowerCase() || "";
      
      if (!medicalConditions || medicalConditions.trim() === "") {
        return {
          compatible: true,
          warnings: [],
          criticalIssues: [],
          recommendations: ["Nenhuma condição médica registrada. Considere fazer uma avaliação física completa."],
          riskLevel: "safe",
        };
      }

      // 2. Buscar restrições do banco de dados
      const { data: restrictions } = await supabase
        .from("medical_condition_exercise_restrictions")
        .select("*");

      // 3. Buscar exercícios do treino
      const { data: workout } = await supabase
        .from("workouts")
        .select(`
          *,
          workout_sessions (
            *,
            sessions (
              *,
              session_exercises (
                *,
                exercises (
                  id,
                  name,
                  exercise_group,
                  contraindication
                )
              )
            )
          )
        `)
        .eq("id", workoutId)
        .single();

      if (!workout) {
        throw new Error("Treino não encontrado");
      }

      // 4. Mapear todos os exercícios do treino
      const allExercises: Array<{ id: string; name: string; group: string; contraindication?: string }> = [];
      workout.workout_sessions?.forEach((ws: any) => {
        ws.sessions?.session_exercises?.forEach((se: any) => {
          if (se.exercises) {
            allExercises.push({
              id: se.exercises.id,
              name: se.exercises.name,
              group: se.exercises.exercise_group,
              contraindication: se.exercises.contraindication,
            });
          }
        });
      });

      // 5. Cruzar condições com restrições
      const warnings: HealthWarning[] = [];
      const criticalIssues: HealthWarning[] = [];
      const recommendations: string[] = [];

      restrictions?.forEach((restriction: any) => {
        const keyword = restriction.condition_keyword.toLowerCase();
        
        if (medicalConditions.includes(keyword)) {
          // Encontrar exercícios afetados
          const affectedExercises = allExercises.filter((ex) =>
            restriction.restricted_exercise_groups.includes(ex.group)
          );

          if (affectedExercises.length > 0) {
            const warning: HealthWarning = {
              severity: restriction.severity_level,
              condition: restriction.condition_keyword,
              message: `Cliente possui ${restriction.condition_keyword} - ${affectedExercises.length} exercício(s) podem ser inadequados`,
              affectedExercises,
              recommendation: restriction.recommendation,
            };

            if (restriction.severity_level === "critical") {
              criticalIssues.push(warning);
            } else {
              warnings.push(warning);
            }

            if (restriction.recommendation) {
              recommendations.push(restriction.recommendation);
            }
          }
        }
      });

      // 6. Verificar contraindicações diretas nos exercícios
      allExercises.forEach((ex) => {
        if (ex.contraindication) {
          const contraLower = ex.contraindication.toLowerCase();
          if (medicalConditions.split(",").some((cond) => contraLower.includes(cond.trim()))) {
            warnings.push({
              severity: "danger",
              condition: "Contraindicação direta",
              message: `Exercício "${ex.name}" possui contraindicação relacionada às condições do cliente`,
              affectedExercises: [ex],
              recommendation: "Substituir por exercício alternativo ou consultar médico",
            });
          }
        }
      });

      // 7. Determinar nível de risco
      let riskLevel: "safe" | "caution" | "high-risk" | "critical" = "safe";
      if (criticalIssues.length > 0) {
        riskLevel = "critical";
      } else if (warnings.filter((w) => w.severity === "danger").length > 0) {
        riskLevel = "high-risk";
      } else if (warnings.length > 0) {
        riskLevel = "caution";
      }

      const compatible = criticalIssues.length === 0;

      return {
        compatible,
        warnings,
        criticalIssues,
        recommendations: [...new Set(recommendations)], // Remove duplicatas
        riskLevel,
      };
    },
    enabled: !!clientId && !!workoutId,
  });
};
