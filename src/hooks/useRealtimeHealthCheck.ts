import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { checkContraindicationBatch } from "./useContraindicationCheck";

interface HealthWarning {
  severity: "warning" | "danger" | "critical";
  condition: string;
  message: string;
  affectedExercises: Array<{ id: string; name: string; group: string }>;
  recommendation: string;
}

interface RealtimeHealthCheckResult {
  hasIssues: boolean;
  warnings: HealthWarning[];
  criticalIssues: HealthWarning[];
  recommendations: string[];
  riskLevel: "safe" | "caution" | "high-risk" | "critical";
}

/**
 * Hook para verificação de saúde em tempo real durante construção de treino
 * Analisa exercícios temporários sem precisar de workoutId
 */
export const useRealtimeHealthCheck = (
  clientId: string | undefined,
  exerciseIds: string[]
): RealtimeHealthCheckResult => {
  // Buscar condições médicas do cliente
  const { data: clientProfile } = useQuery({
    queryKey: ["client-profile-health", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("medical_conditions")
        .eq("id", clientId)
        .single();
      
      return data;
    },
    enabled: !!clientId,
  });

  const { data: anamnesisData } = useQuery({
    queryKey: ["client-anamnesis-health", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data } = await supabase
        .from("anamnesis")
        .select("has_joint_pain, pain_locations, pain_details, has_injury_or_surgery, injury_type, injury_details, medical_restrictions, medical_restrictions_details")
        .eq("client_id", clientId)
        .maybeSingle();
      
      return data;
    },
    enabled: !!clientId,
  });

  // Buscar restrições do banco
  const { data: restrictions } = useQuery({
    queryKey: ["medical-restrictions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("medical_condition_exercise_restrictions")
        .select("*");
      
      return data || [];
    },
  });

  // Buscar exercícios
  const { data: exercises } = useQuery({
    queryKey: ["exercises-health-check", exerciseIds],
    queryFn: async () => {
      if (exerciseIds.length === 0) return [];
      
      const { data } = await supabase
        .from("exercises")
        .select("id, name, exercise_group, contraindication")
        .in("id", exerciseIds);
      
      return data || [];
    },
    enabled: exerciseIds.length > 0,
  });

  // Análise em tempo real
  return useMemo((): RealtimeHealthCheckResult => {
    if (!clientId || !exercises || exercises.length === 0) {
      return {
        hasIssues: false,
        warnings: [],
        criticalIssues: [],
        recommendations: [],
        riskLevel: "safe",
      };
    }

    // Mapear condições da anamnese
    const conditionMapping: Record<string, string> = {
      "Joelhos": "dor no joelho",
      "Costas": "dor nas costas",
      "Ombros": "dor no ombro",
      "Quadril": "dor no quadril",
      "Tornozelos": "dor no tornozelo",
      "Cervical": "dor cervical",
      "Lombar": "dor lombar",
      "Punhos": "dor no punho",
      "Cotovelos": "dor no cotovelo",
      "Hipertensão": "hipertensão",
      "Diabetes": "diabetes",
      "Hérnia": "hérnia",
      "Hérnia de disco": "hérnia de disco",
      "Cardiopatia": "problema cardíaco",
      "Asma": "asma",
      "Artrose": "artrose",
      "Tendinite": "tendinite",
    };

    // Extrair condições
    const extractedConditions: Array<{ keyword: string; source: string; details?: string }> = [];
    
    if (anamnesisData) {
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

      if (anamnesisData.has_injury_or_surgery && anamnesisData.injury_type) {
        extractedConditions.push({
          keyword: anamnesisData.injury_type.toLowerCase(),
          source: "anamnese",
          details: anamnesisData.injury_details || undefined,
        });
      }

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

    const profileConditions = clientProfile?.medical_conditions?.toLowerCase() || "";

    // Se não há condições
    if (!profileConditions.trim() && extractedConditions.length === 0) {
      return {
        hasIssues: false,
        warnings: [],
        criticalIssues: [],
        recommendations: ["Nenhuma condição médica registrada."],
        riskLevel: "safe",
      };
    }

    const warnings: HealthWarning[] = [];
    const criticalIssues: HealthWarning[] = [];
    const recommendations: string[] = [];

    // Verificar restrições por grupo muscular
    restrictions?.forEach((restriction: any) => {
      const keyword = restriction.condition_keyword.toLowerCase();
      
      const inProfile = profileConditions.includes(keyword);
      const inAnamnesis = extractedConditions.find((c) => 
        c.keyword.includes(keyword) || keyword.includes(c.keyword)
      );

      if (inProfile || inAnamnesis) {
        const affectedExercises = exercises.filter((ex) =>
          restriction.restricted_exercise_groups.includes(ex.exercise_group)
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
            affectedExercises: affectedExercises.map(ex => ({
              id: ex.id,
              name: ex.name,
              group: ex.exercise_group,
            })),
            recommendation: restriction.recommendation || "Considere exercícios alternativos",
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

    // Verificar contraindicações diretas usando batch check
    const contraindicationResults = checkContraindicationBatch(
      exercises as any,
      (profileConditions || "") + " " + extractedConditions.map(c => c.keyword).join(" ")
    );

    contraindicationResults.forEach((result, exerciseId) => {
      if (result.hasRisk) {
        const exercise = exercises.find(ex => ex.id === exerciseId);
        if (exercise) {
          warnings.push({
            severity: result.severity === 'error' ? 'danger' : 'warning',
            condition: "Contraindicação direta",
            message: `"${exercise.name}" possui contraindicação: ${result.matchedKeywords.join(", ")}`,
            affectedExercises: [{
              id: exercise.id,
              name: exercise.name,
              group: exercise.exercise_group,
            }],
            recommendation: "Substituir por exercício alternativo ou consultar médico",
          });
        }
      }
    });

    // Determinar nível de risco
    let riskLevel: "safe" | "caution" | "high-risk" | "critical" = "safe";
    if (criticalIssues.length > 0) {
      riskLevel = "critical";
    } else if (warnings.filter((w) => w.severity === "danger").length > 0) {
      riskLevel = "high-risk";
    } else if (warnings.length > 0) {
      riskLevel = "caution";
    }

    return {
      hasIssues: warnings.length > 0 || criticalIssues.length > 0,
      warnings,
      criticalIssues,
      recommendations: [...new Set(recommendations)],
      riskLevel,
    };
  }, [clientId, exercises, restrictions, anamnesisData, clientProfile]);
};
