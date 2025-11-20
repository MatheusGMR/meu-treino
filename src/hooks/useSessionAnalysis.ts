import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";

interface MuscleGroup {
  group: string;
  percentage: number;
  count: number;
}

interface Alert {
  type: 'info' | 'warning' | 'error';
  message: string;
  category: 'volume' | 'energy' | 'muscle' | 'risk';
}

interface SessionAnalysis {
  volume: {
    totalSeries: number;
    status: 'below' | 'optimal' | 'above' | 'excessive';
    percentage: number;
    recommended: {
      min: number;
      optimal: number;
      max: number;
    };
  };
  energy: {
    total: 'Baixo' | 'Médio' | 'Alto';
    breakdown: {
      high: number;
      medium: number;
      low: number;
    };
    score: number;
  };
  muscles: {
    distribution: MuscleGroup[];
    isBalanced: boolean;
    warnings: string[];
  };
  risks: {
    level: 'safe' | 'caution' | 'high';
    methods: {
      high: number;
      medium: number;
      low: number;
    };
    warnings: string[];
  };
  estimatedDuration: number;
  alerts: Alert[];
  suggestions: string[];
}

export const useSessionAnalysis = (exercises: SessionExerciseData[]): { data: SessionAnalysis | null; isLoading: boolean } => {
  const { data, isLoading } = useQuery({
    queryKey: ["session-analysis", exercises],
    queryFn: async (): Promise<SessionAnalysis | null> => {
      if (!exercises || exercises.length === 0) {
        return null;
      }

      // Fetch all data in parallel
      const [volumesData, methodsData, exercisesData] = await Promise.all([
        supabase.from("volumes").select("*").in("id", exercises.map(e => e.volume_id)),
        supabase.from("methods").select("*").in("id", exercises.map(e => e.method_id)),
        supabase.from("exercises").select("*").in("id", exercises.map(e => e.exercise_id)),
      ]);

      if (volumesData.error || methodsData.error || exercisesData.error) {
        throw new Error("Erro ao buscar dados da análise");
      }

      const volumes = volumesData.data || [];
      const methods = methodsData.data || [];
      const exercisesList = exercisesData.data || [];

      // Calculate volume
      const totalSeries = volumes.reduce((sum, v) => sum + v.num_series, 0);
      const avgMin = volumes.length > 0 
        ? Math.round(volumes.reduce((sum, v) => sum + (v.min_weekly_sets || v.num_series * 2), 0) / volumes.length)
        : 10;
      const avgOptimal = volumes.length > 0
        ? Math.round(volumes.reduce((sum, v) => sum + (v.optimal_weekly_sets || v.num_series * 3), 0) / volumes.length)
        : 14;
      const avgMax = volumes.length > 0
        ? Math.round(volumes.reduce((sum, v) => sum + (v.max_weekly_sets || v.num_series * 4), 0) / volumes.length)
        : 18;

      const percentage = avgOptimal > 0 ? Math.round((totalSeries / avgOptimal) * 100) : 0;
      
      let volumeStatus: 'below' | 'optimal' | 'above' | 'excessive';
      if (totalSeries < avgMin) volumeStatus = 'below';
      else if (totalSeries <= avgMax) volumeStatus = 'optimal';
      else if (totalSeries <= avgMax * 1.2) volumeStatus = 'above';
      else volumeStatus = 'excessive';

      // Calculate energy
      const energyBreakdown = {
        high: methods.filter(m => m.energy_cost === 'Alto').length,
        medium: methods.filter(m => m.energy_cost === 'Médio').length,
        low: methods.filter(m => m.energy_cost === 'Baixo').length,
      };

      const energyScore = (energyBreakdown.high * 100 + energyBreakdown.medium * 50 + energyBreakdown.low * 20) / methods.length || 0;
      const totalEnergy: 'Baixo' | 'Médio' | 'Alto' = 
        energyScore >= 70 ? 'Alto' : energyScore >= 40 ? 'Médio' : 'Baixo';

      // Calculate muscle distribution
      const muscleCount: Record<string, number> = {};
      exercisesList.forEach(ex => {
        muscleCount[ex.exercise_group] = (muscleCount[ex.exercise_group] || 0) + 1;
      });

      const muscleDistribution: MuscleGroup[] = Object.entries(muscleCount)
        .map(([group, count]) => ({
          group,
          count,
          percentage: Math.round((count / exercisesList.length) * 100),
        }))
        .sort((a, b) => b.percentage - a.percentage);

      const maxPercentage = muscleDistribution[0]?.percentage || 0;
      const isBalanced = maxPercentage <= 40;

      const muscleWarnings: string[] = [];
      if (maxPercentage > 50) {
        muscleWarnings.push(`Foco excessivo em ${muscleDistribution[0].group} (${maxPercentage}%)`);
      }

      // Calculate risks
      const riskBreakdown = {
        high: methods.filter(m => m.risk_level === 'Alto risco' || m.risk_level === 'Alto risco de fadiga').length,
        medium: methods.filter(m => m.risk_level === 'Médio risco').length,
        low: methods.filter(m => m.risk_level === 'Baixo risco').length,
      };

      const riskLevel: 'safe' | 'caution' | 'high' = 
        riskBreakdown.high >= 3 ? 'high' : riskBreakdown.high >= 1 ? 'caution' : 'safe';

      const riskWarnings: string[] = [];
      if (riskBreakdown.high > 0) {
        riskWarnings.push(`${riskBreakdown.high} método${riskBreakdown.high > 1 ? 's' : ''} de alto risco`);
      }

      // Estimated duration (base: 3min per exercise + rest times)
      const avgRestTime = methods.reduce((sum, m) => sum + m.rest_seconds, 0) / methods.length || 60;
      const estimatedDuration = Math.round(
        (exercisesList.length * 3) + // 3 min per exercise
        (totalSeries * (avgRestTime / 60)) // rest time in minutes
      );

      // Generate alerts
      const alerts: Alert[] = [];

      if (volumeStatus === 'below') {
        alerts.push({
          type: 'warning',
          message: `Volume abaixo do recomendado (${totalSeries}/${avgMin} séries)`,
          category: 'volume',
        });
      } else if (volumeStatus === 'excessive') {
        alerts.push({
          type: 'error',
          message: `Volume excessivo (${totalSeries} séries) - risco de overtraining`,
          category: 'volume',
        });
      } else if (volumeStatus === 'optimal') {
        alerts.push({
          type: 'info',
          message: `Volume ideal para hipertrofia (${totalSeries} séries)`,
          category: 'volume',
        });
      }

      if (energyBreakdown.high >= 3) {
        alerts.push({
          type: 'warning',
          message: `${energyBreakdown.high} métodos de alto custo energético`,
          category: 'energy',
        });
      }

      if (riskBreakdown.high >= 2) {
        alerts.push({
          type: 'error',
          message: `${riskBreakdown.high} métodos de alto risco sem contrabalanceamento`,
          category: 'risk',
        });
      } else if (riskBreakdown.high === 1) {
        alerts.push({
          type: 'warning',
          message: '1 método de alto risco - supervisão recomendada',
          category: 'risk',
        });
      }

      if (!isBalanced) {
        alerts.push({
          type: 'warning',
          message: `Distribuição muscular desbalanceada`,
          category: 'muscle',
        });
      }

      // Generate suggestions
      const suggestions: string[] = [];

      if (volumeStatus === 'below') {
        const needed = avgMin - totalSeries;
        suggestions.push(`Adicione ${needed} série${needed > 1 ? 's' : ''} para atingir o volume mínimo`);
      } else if (volumeStatus === 'optimal') {
        suggestions.push('Volume próximo do ideal - sessão bem estruturada');
      }

      if (totalEnergy === 'Alto') {
        suggestions.push('Recomendado: 48-72h de descanso após esta sessão');
      } else if (totalEnergy === 'Médio') {
        suggestions.push('Recomendado: 24-48h de descanso');
      }

      if (maxPercentage > 40 && muscleDistribution.length > 1) {
        const secondary = muscleDistribution[1];
        suggestions.push(`Considere adicionar mais exercícios de ${secondary.group} para balancear`);
      }

      if (riskBreakdown.high > 0) {
        suggestions.push('Certifique-se de orientar sobre a técnica correta dos métodos de alto risco');
      }

      return {
        volume: {
          totalSeries,
          status: volumeStatus,
          percentage,
          recommended: {
            min: avgMin,
            optimal: avgOptimal,
            max: avgMax,
          },
        },
        energy: {
          total: totalEnergy,
          breakdown: energyBreakdown,
          score: energyScore,
        },
        muscles: {
          distribution: muscleDistribution,
          isBalanced,
          warnings: muscleWarnings,
        },
        risks: {
          level: riskLevel,
          methods: riskBreakdown,
          warnings: riskWarnings,
        },
        estimatedDuration,
        alerts,
        suggestions,
      };
    },
    enabled: exercises && exercises.length > 0,
  });

  return { data: data || null, isLoading };
};
