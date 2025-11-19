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

      // 1. Buscar condições médicas do cliente (perfil + anamnese)
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("medical_conditions")
        .eq("id", clientId)
        .single();

      const { data: anamnesisData } = await supabase
        .from("anamnesis")
        .select("has_joint_pain, pain_locations, pain_details, has_injury_or_surgery, injury_type, injury_details, medical_restrictions, medical_restrictions_details")
        .eq("client_id", clientId)
        .maybeSingle();

      // Mapear condições da anamnese para keywords reconhecidas
      const conditionMapping: Record<string, string> = {
        // Localizações de dor
        "Joelhos": "dor no joelho",
        "Costas": "dor nas costas",
        "Ombros": "dor no ombro",
        "Quadril": "dor no quadril",
        "Tornozelos": "dor no tornozelo",
        "Cervical": "dor cervical",
        "Lombar": "dor lombar",
        "Punhos": "dor no punho",
        "Cotovelos": "dor no cotovelo",
        // Restrições médicas comuns
        "Hipertensão": "hipertensão",
        "Diabetes": "diabetes",
        "Hérnia": "hérnia",
        "Hérnia de disco": "hérnia de disco",
        "Cardiopatia": "problema cardíaco",
        "Asma": "asma",
        "Artrose": "artrose",
        "Tendinite": "tendinite",
      };

      // Extrair condições da anamnese
      const extractedConditions: Array<{ keyword: string; source: string; details?: string }> = [];
      
      if (anamnesisData) {
        // Dores articulares
        if (anamnesisData.has_joint_pain && anamnesisData.pain_locations) {
          anamnesisData.pain_locations.forEach((location: string) => {
            const keyword = conditionMapping[location] || location.toLowerCase();
            extractedConditions.push({
              keyword,
              source: "anamnese",
              details: anamnesisData.pain_details || undefined,
            });
          });
        }

        // Lesões ou cirurgias
        if (anamnesisData.has_injury_or_surgery && anamnesisData.injury_type) {
          extractedConditions.push({
            keyword: anamnesisData.injury_type.toLowerCase(),
            source: "anamnese",
            details: anamnesisData.injury_details || undefined,
          });
        }

        // Restrições médicas
        if (anamnesisData.medical_restrictions && anamnesisData.medical_restrictions.length > 0) {
          anamnesisData.medical_restrictions.forEach((restriction: string) => {
            const keyword = conditionMapping[restriction] || restriction.toLowerCase();
            extractedConditions.push({
              keyword,
              source: "anamnese",
              details: anamnesisData.medical_restrictions_details || undefined,
            });
          });
        }
      }

      // Combinar com condições do perfil (texto livre)
      const profileConditions = clientProfile?.medical_conditions?.toLowerCase() || "";
      
      // Se não há condições em nenhuma fonte
      if (!profileConditions.trim() && extractedConditions.length === 0) {
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
        
        // Verificar se a keyword está nas condições do perfil
        const inProfile = profileConditions.includes(keyword);
        
        // Verificar se a keyword está nas condições extraídas da anamnese
        const inAnamnesis = extractedConditions.find((c) => 
          c.keyword.includes(keyword) || keyword.includes(c.keyword)
        );

        if (inProfile || inAnamnesis) {
          // Encontrar exercícios afetados
          const affectedExercises = allExercises.filter((ex) =>
            restriction.restricted_exercise_groups.includes(ex.group)
          );

          if (affectedExercises.length > 0) {
            const source = inAnamnesis ? "(Relatado na anamnese)" : "(Informado no perfil)";
            const details = inAnamnesis?.details;
            
            let message = `Cliente possui ${restriction.condition_keyword} ${source} - ${affectedExercises.length} exercício(s) podem ser inadequados`;
            if (details) {
              message += `\nDetalhes: "${details}"`;
            }

            const warning: HealthWarning = {
              severity: restriction.severity_level,
              condition: restriction.condition_keyword,
              message,
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
          
          // Verificar contra condições do perfil
          const matchesProfile = profileConditions.split(",").some((cond) => 
            contraLower.includes(cond.trim())
          );
          
          // Verificar contra condições da anamnese
          const matchesAnamnesis = extractedConditions.some((c) => 
            contraLower.includes(c.keyword)
          );

          if (matchesProfile || matchesAnamnesis) {
            const source = matchesAnamnesis ? "(Identificado na anamnese)" : "(Informado no perfil)";
            
            warnings.push({
              severity: "danger",
              condition: "Contraindicação direta",
              message: `Exercício "${ex.name}" possui contraindicação relacionada às condições do cliente ${source}`,
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
