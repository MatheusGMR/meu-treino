import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkoutMuscleAnalysis, useSessionMuscleAnalysis } from "./useWorkoutMuscleAnalysis";
import { useHealthCompatibilityCheck } from "./useHealthCompatibilityCheck";
import { useRealtimeHealthCheck } from "./useRealtimeHealthCheck";
import { useAssignWorkout } from "./useClientWorkouts";
import { useClientDetails } from "./useClients";
import { useClientAnamnesis } from "./useAnamnesis";
import { useClientAnamnesisProfile } from "./useClientAnamnesisProfile";
import { useExercises } from "./useExercises";
import { useSessions } from "./useSessions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { SessionExerciseData } from "@/lib/schemas/sessionSchema";

interface TempSession {
  id?: string;
  name: string;
  description: string;
  session_type?: string;
  exercises: SessionExerciseData[];
  isNew?: boolean;
  isEdited?: boolean;
}

interface TempWorkout {
  name: string;
  training_type?: string;
  level?: string;
  gender?: string;
  sessions: TempSession[];
}

export const useClientWorkoutBuilder = (clientId: string) => {
  const [tempWorkout, setTempWorkout] = useState<TempWorkout>({
    name: "",
    sessions: [],
  });
  const [acknowledgeRisks, setAcknowledgeRisks] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para IA Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<{
    overview: string;
    sessions: string;
    recommendations: string[];
  } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const assignWorkoutMutation = useAssignWorkout();
  
  // Buscar dados do cliente
  const { data: clientDetails } = useClientDetails(clientId);
  const { data: anamnesisData } = useClientAnamnesis(clientId);
  const { data: anamnesisProfile } = useClientAnamnesisProfile(clientId);
  
  // Buscar dados dos exercícios para análise correta
  const { data: exercisesData } = useExercises();

  // Extrair IDs de exercícios do treino temporário para análise em tempo real
  const exerciseIds = useMemo(() => {
    const ids: string[] = [];
    tempWorkout.sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (!ids.includes(ex.exercise_id)) {
          ids.push(ex.exercise_id);
        }
      });
    });
    return ids;
  }, [tempWorkout]);

  // Análise de saúde em tempo real usando novo hook
  const realtimeHealthCheck = useRealtimeHealthCheck(clientId, exerciseIds);

  // Análise muscular para treino temporário
  const muscleAnalysis = useMemo(() => {
    // DEBUG: Log para troubleshooting
    console.log('🔍 [Muscle Analysis] tempWorkout:', tempWorkout);
    console.log('🔍 [Muscle Analysis] exercisesData:', exercisesData);
    
    if (tempWorkout.sessions.length === 0 || !exercisesData || exercisesData.length === 0) {
      console.log('⚠️ [Muscle Analysis] Returning empty - no sessions or exercises data');
      return {
        muscleGroups: [],
        totalExercises: 0,
        warnings: [],
        isBalanced: true,
      };
    }

    // Criar mapa de exerciseId -> dados do exercício
    const exerciseMap = new Map(
      exercisesData.map(ex => [ex.id, ex])
    );

    // Mapear todos os exercícios das sessões temporárias com dados reais
    const allExercises: Array<{ name: string; group: string }> = [];
    tempWorkout.sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        const exerciseData = exerciseMap.get(ex.exercise_id);
        if (exerciseData) {
          allExercises.push({
            name: exerciseData.name,
            group: exerciseData.exercise_group,
          });
        }
      });
    });

    const groupCounts: Record<string, { count: number; exercises: string[] }> = {};
    allExercises.forEach((ex) => {
      if (!groupCounts[ex.group]) {
        groupCounts[ex.group] = { count: 0, exercises: [] };
      }
      groupCounts[ex.group].count++;
      groupCounts[ex.group].exercises.push(ex.name);
    });

    const totalExercises = allExercises.length;
    const muscleGroups = Object.entries(groupCounts).map(([group, data]) => ({
      group,
      count: data.count,
      percentage: totalExercises > 0 ? (data.count / totalExercises) * 100 : 0,
      exercises: data.exercises,
    }));

    // DEBUG: Log final result
    console.log('✅ [Muscle Analysis] Result:', { totalExercises, muscleGroupsCount: muscleGroups.length });

    const warnings: string[] = [];
    
    // Verificar sobrecarga de grupos
    muscleGroups.forEach((mg) => {
      if (mg.percentage > 40) {
        warnings.push(
          `${mg.group} está com ${mg.percentage.toFixed(0)}% do treino - pode estar sobrecarregado`
        );
      }
    });

    // Verificar grupos antagonistas
    const hasChest = muscleGroups.find((mg) => mg.group === "Peito");
    const hasBack = muscleGroups.find((mg) => mg.group === "Costas");
    
    if (hasChest && !hasBack) {
      warnings.push("Treino trabalha Peito mas não trabalha Costas - risco de desequilíbrio muscular");
    }
    if (hasBack && !hasChest) {
      warnings.push("Treino trabalha Costas mas não trabalha Peito - considere balancear");
    }

    const hasQuadriceps = muscleGroups.find((mg) => mg.group === "Quadríceps" || mg.group === "Pernas");
    const hasHamstrings = muscleGroups.find((mg) => mg.group === "Posterior");
    
    if (hasQuadriceps && !hasHamstrings) {
      warnings.push("Treino trabalha frente das pernas mas não posterior - risco de desequilíbrio");
    }

    return {
      muscleGroups: muscleGroups.sort((a, b) => b.percentage - a.percentage),
      totalExercises,
      warnings,
      isBalanced: warnings.length === 0,
    };
  }, [tempWorkout, exercisesData]);

  // Análise de impacto dos exercícios
  const impactAnalysis = useMemo(() => {
    if (tempWorkout.sessions.length === 0 || !exercisesData) {
      return {
        distribution: { Baixo: 0, Médio: 0, Alto: 0 },
        totalExercises: 0,
        overallIntensity: 'balanced' as 'light' | 'balanced' | 'intense',
        warnings: [] as string[],
        score: 0,
      };
    }

    const exerciseMap = new Map(exercisesData.map(ex => [ex.id, ex]));
    
    const impactCounts = { Baixo: 0, Médio: 0, Alto: 0 };
    let totalExercises = 0;

    tempWorkout.sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        const exerciseData = exerciseMap.get(ex.exercise_id);
        if (exerciseData?.impact_level) {
          impactCounts[exerciseData.impact_level as keyof typeof impactCounts]++;
          totalExercises++;
        }
      });
    });

    // Calcular percentuais
    const distribution = {
      Baixo: totalExercises > 0 ? (impactCounts.Baixo / totalExercises) * 100 : 0,
      Médio: totalExercises > 0 ? (impactCounts.Médio / totalExercises) * 100 : 0,
      Alto: totalExercises > 0 ? (impactCounts.Alto / totalExercises) * 100 : 0,
    };

    // Calcular score (1 = leve, 2 = médio, 3 = intenso)
    const score = totalExercises > 0
      ? ((impactCounts.Baixo * 1) + (impactCounts.Médio * 2) + (impactCounts.Alto * 3)) / totalExercises
      : 0;

    // Determinar intensidade geral
    let overallIntensity: 'light' | 'balanced' | 'intense';
    if (score < 1.7) {
      overallIntensity = 'light';
    } else if (score > 2.3) {
      overallIntensity = 'intense';
    } else {
      overallIntensity = 'balanced';
    }

    // Gerar warnings
    const warnings: string[] = [];
    
    if (distribution.Alto > 50) {
      warnings.push('⚡ Treino com alta intensidade - verifique a recuperação do cliente');
    }
    
    if (distribution.Alto > 70) {
      warnings.push('🔥 Treino muito intenso - risco de sobrecarga');
    }
    
    if (distribution.Baixo > 70) {
      warnings.push('💤 Treino com baixa intensidade - pode não gerar estímulo suficiente');
    }
    
    // Considerar nível de atividade do cliente
    const activityLevel = anamnesisData?.anamnesis?.activity_level;
    if (activityLevel === 'Sedentário' && distribution.Alto > 30) {
      warnings.push('⚠️ Cliente sedentário com muitos exercícios de alto impacto');
    }
    
    if (activityLevel === 'Muito Ativo' && distribution.Baixo > 50) {
      warnings.push('💡 Cliente muito ativo - considere aumentar a intensidade');
    }

    return {
      distribution,
      totalExercises,
      overallIntensity,
      warnings,
      score: Math.round(score * 10) / 10,
    };
  }, [tempWorkout, exercisesData, anamnesisData]);

  // Usar resultado do realtime health check
  const compatibility = {
    compatible: !realtimeHealthCheck.hasIssues,
    warnings: realtimeHealthCheck.warnings,
    criticalIssues: realtimeHealthCheck.criticalIssues,
    recommendations: realtimeHealthCheck.recommendations,
    riskLevel: realtimeHealthCheck.riskLevel,
  };


  const addNewSession = useCallback((session: TempSession) => {
    setTempWorkout((prev) => ({
      ...prev,
      sessions: [...prev.sessions, { ...session, isNew: true }],
    }));
  }, []);

  const removeSession = useCallback((index: number) => {
    setTempWorkout((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((_, i) => i !== index),
    }));
  }, []);

  const updateSession = useCallback((index: number, updatedSession: TempSession) => {
    setTempWorkout((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s, i) =>
        i === index ? { ...updatedSession, isEdited: true } : s
      ),
    }));
  }, []);

  const reorderSessions = useCallback((startIndex: number, endIndex: number) => {
    setTempWorkout((prev) => {
      const sessions = [...prev.sessions];
      const [removed] = sessions.splice(startIndex, 1);
      sessions.splice(endIndex, 0, removed);
      return { ...prev, sessions };
    });
  }, []);

  const reorderExercisesInSession = useCallback((sessionIndex: number, startIndex: number, endIndex: number) => {
    setTempWorkout((prev) => {
      const session = prev.sessions[sessionIndex];
      if (!session) return prev;

      const exercises = [...session.exercises];
      const [removed] = exercises.splice(startIndex, 1);
      exercises.splice(endIndex, 0, removed);

      // Reordenar order_index
      const reorderedExercises = exercises.map((ex, idx) => ({
        ...ex,
        order_index: idx,
      }));

      const updatedSessions = prev.sessions.map((s, i) =>
        i === sessionIndex ? { ...s, exercises: reorderedExercises, isEdited: true } : s
      );

      return { ...prev, sessions: updatedSessions };
    });
  }, []);

  // Adicionar sessão existente
  const addExistingSession = useCallback(async (sessionId: string) => {
    try {
      // Buscar detalhes completos da sessão
      const { data: fullSession, error } = await supabase
        .from("sessions")
        .select(`
          *,
          session_exercises (
            *,
            exercises (*),
            volumes (*),
            methods (*)
          )
        `)
        .eq("id", sessionId)
        .single();

      if (error || !fullSession) {
        console.error("Erro ao buscar sessão:", error);
        toast({
          title: "Erro ao adicionar sessão",
          description: "Não foi possível carregar os detalhes da sessão",
          variant: "destructive",
        });
        return;
      }

      // Adicionar ao tempWorkout
      setTempWorkout((prev) => ({
        ...prev,
        sessions: [
          ...prev.sessions,
          {
            id: fullSession.id,
            name: fullSession.name,
            description: fullSession.description,
            exercises: fullSession.session_exercises.map((se: any) => ({
              exercise_id: se.exercise_id,
              volume_id: se.volume_id,
              method_id: se.method_id,
              order_index: se.order_index,
            })),
            isNew: false,
          },
        ],
      }));

      toast({
        title: "Sessão adicionada",
        description: `${fullSession.name} foi adicionada ao treino`,
      });
    } catch (error) {
      console.error("Erro ao adicionar sessão:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a sessão",
        variant: "destructive",
      });
    }
  }, []);

  // Helper para obter IDs de sessões existentes
  const getExistingSessionIds = useCallback(() => {
    return tempWorkout.sessions
      .filter((s) => !s.isNew && s.id)
      .map((s) => s.id!)
      .filter(Boolean);
  }, [tempWorkout]);

  // Razão do bloqueio para feedback no UI
  // Nota: o nome do treino é solicitado no diálogo de confirmação, não bloqueamos por isso
  const submitBlockReason = useMemo(() => {
    if (tempWorkout.sessions.length === 0) return "Adicione pelo menos uma sessão";
    
    // Verificar se todas as sessões têm exercícios
    const emptySessionIndex = tempWorkout.sessions.findIndex(s => s.exercises.length === 0);
    if (emptySessionIndex !== -1) {
      return `Adicione exercícios à sessão "${tempWorkout.sessions[emptySessionIndex].name}"`;
    }
    
    if (compatibility.riskLevel === "critical" && !acknowledgeRisks) {
      return "Reconheça os riscos de saúde para continuar";
    }
    return null;
  }, [tempWorkout, compatibility, acknowledgeRisks]);

  // Validação para submit
  const canSubmit = useMemo(() => {
    return submitBlockReason === null;
  }, [submitBlockReason]);

  // Submit - cria treino novo sempre
  // Aceita workoutName como parâmetro para evitar race condition com setState assíncrono
  const submit = useCallback(async (workoutName?: string) => {
    if (!canSubmit) return;
    
    // Usar o parâmetro se fornecido, senão usar o estado
    const finalWorkoutName = workoutName || tempWorkout.name;
    
    // Validar nome do treino
    if (!finalWorkoutName.trim()) {
      toast({
        title: "Erro",
        description: "O nome do treino é obrigatório",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Separar sessões novas das existentes
      const newSessions = tempWorkout.sessions.filter((s) => s.isNew);
      const existingSessionIds = tempWorkout.sessions
        .filter((s) => !s.isNew && s.id)
        .map((s) => s.id!);

      const { data, error } = await supabase.functions.invoke('create-workout-and-assign', {
        body: {
          clientId,
          workoutName: finalWorkoutName,
          newSessions,
          existingSessionIds,
          trainingType: tempWorkout.training_type,
          level: tempWorkout.level,
          gender: tempWorkout.gender,
          startDate: new Date().toISOString().split('T')[0],
        },
      });

      if (error) {
        console.error("Erro ao criar treino:", error);
        toast({
          title: "Erro ao criar treino",
          description: error.message || "Não foi possível criar o treino",
          variant: "destructive",
        });
        throw error;
      }

      console.log("Treino criado com sucesso:", data);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["client-workouts", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-details", clientId] });
      queryClient.invalidateQueries({ queryKey: ["today-workout", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client-active-workouts", clientId] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      
      toast({
        title: "Treino criado e atribuído!",
        description: "O treino foi criado e atribuído ao cliente com sucesso.",
      });
      
      return data;
    } catch (error) {
      console.error("Erro ao criar treino:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, tempWorkout, clientId, queryClient]);

  // Calcular tempo estimado
  const estimatedTime = useMemo(() => {
    const totalExercises = muscleAnalysis.totalExercises;
    // Estimativa: 3-5 min por exercício
    return `${totalExercises * 3}-${totalExercises * 5} min`;
  }, [muscleAnalysis]);

  // Calcular volume semanal estimado com benchmark do perfil
  const weeklyVolume = useMemo(() => {
    const totalSets = tempWorkout.sessions.reduce((sum, session) => {
      return sum + session.exercises.length * 3; // Estimativa de 3 séries por exercício
    }, 0);
    
    const benchmark = anamnesisProfile ? {
      min: (anamnesisProfile.typical_combination as any)?.min_weekly_volume || 15,
      optimal: (anamnesisProfile.typical_combination as any)?.optimal_weekly_volume || 25,
      max: (anamnesisProfile.typical_combination as any)?.max_weekly_volume || 35,
    } : null;

    let status: 'below' | 'optimal' | 'above' | 'excessive' | null = null;
    let percentage: number | null = null;
    let message = '';

    if (benchmark) {
      percentage = (totalSets / benchmark.optimal) * 100;
      
      if (totalSets < benchmark.min) {
        status = 'below';
        message = `Volume abaixo do mínimo recomendado para ${anamnesisProfile?.name}`;
      } else if (totalSets <= benchmark.optimal) {
        status = 'optimal';
        message = `Volume adequado para ${anamnesisProfile?.name}`;
      } else if (totalSets <= benchmark.max) {
        status = 'above';
        message = `Volume acima do ideal, mas dentro do limite para ${anamnesisProfile?.name}`;
      } else {
        status = 'excessive';
        message = `⚠️ Volume excessivo para ${anamnesisProfile?.name}`;
      }
    }
    
    return {
      totalSets,
      setsPerMuscle: muscleAnalysis.muscleGroups.map(mg => ({
        group: mg.group,
        sets: Math.round((mg.percentage / 100) * totalSets),
      })),
      benchmark,
      status,
      percentage,
      message,
    };
  }, [tempWorkout, muscleAnalysis, anamnesisProfile]);

  // Análise de intensidade contextualizada
  const intensityCheck = useMemo(() => {
    if (!anamnesisProfile) return null;

    const currentIntensity = impactAnalysis.overallIntensity;
    const recommendedIntensity = anamnesisProfile.recommended_intensity?.toLowerCase();
    
    let aligned = false;
    let message = '';

    if (recommendedIntensity) {
      if (
        (recommendedIntensity.includes('low') && currentIntensity === 'light') ||
        (recommendedIntensity.includes('moderate') && currentIntensity === 'balanced') ||
        (recommendedIntensity.includes('high') && currentIntensity === 'intense')
      ) {
        aligned = true;
        message = 'Intensidade alinhada com o perfil';
      } else {
        message = `⚠️ Perfil recomenda intensidade ${recommendedIntensity}, treino está ${
          currentIntensity === 'light' ? 'leve' : 
          currentIntensity === 'balanced' ? 'balanceado' : 
          'intenso'
        }`;
      }
    }

    return {
      current: currentIntensity,
      recommended: recommendedIntensity || null,
      aligned,
      message,
    };
  }, [impactAnalysis, anamnesisProfile]);

  // Alinhamento com objetivos primários
  const goalAlignment = useMemo(() => {
    if (!exercisesData || !anamnesisData?.anamnesis?.primary_goal) return null;

    const primaryGoal = anamnesisData.anamnesis.primary_goal;
    const exerciseMap = new Map(exercisesData.map(ex => [ex.id, ex]));
    
    let alignedCount = 0;
    let totalCount = 0;

    tempWorkout.sessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        const exercise = exerciseMap.get(ex.exercise_id);
        if (exercise) {
          totalCount++;
          // Verificar se o tipo de exercício se alinha com o objetivo
          if (primaryGoal === 'Emagrecimento' && exercise.exercise_type === 'Cardio') {
            alignedCount++;
          } else if (primaryGoal === 'Hipertrofia' && exercise.exercise_type === 'Musculação') {
            alignedCount++;
          } else if (primaryGoal === 'Condicionamento' && exercise.exercise_type === 'Funcional') {
            alignedCount++;
          }
        }
      });
    });

    const percentage = totalCount > 0 ? (alignedCount / totalCount) * 100 : 0;
    const aligned = percentage >= 50;

    return {
      primaryGoal,
      alignedCount,
      totalCount,
      percentage,
      aligned,
      message: aligned 
        ? `✓ ${percentage.toFixed(0)}% dos exercícios focam em ${primaryGoal}`
        : `⚠️ Apenas ${percentage.toFixed(0)}% dos exercícios focam em ${primaryGoal}`,
    };
  }, [tempWorkout, exercisesData, anamnesisData]);

  // Risk factors do perfil
  const profileRisks = useMemo(() => {
    if (!anamnesisProfile?.risk_factors) return { factors: [], recommendations: [] };

    return {
      factors: anamnesisProfile.risk_factors || [],
      recommendations: anamnesisProfile.strategy ? [anamnesisProfile.strategy] : [],
    };
  }, [anamnesisProfile]);

  // ==================== NOVOS CÁLCULOS PARA COCKPIT ====================

  // Helper para limpar dados de dores/lesões
  const cleanPainData = useCallback((anamnesis: any) => {
    const pains: string[] = [];
    
    // Pain locations
    if (anamnesis.pain_locations && Array.isArray(anamnesis.pain_locations)) {
      const validPains = anamnesis.pain_locations.filter(
        (p: string) => p && p !== 'Nenhum' && p !== 'Não' && p !== 'Nenhuma'
      );
      pains.push(...validPains);
    }
    
    // Pain details
    if (anamnesis.pain_details && anamnesis.pain_details !== 'Não' && anamnesis.pain_details.trim() !== '') {
      pains.push(`Detalhe: ${anamnesis.pain_details}`);
    }
    
    // Lesões
    if (anamnesis.lesoes && anamnesis.lesoes !== 'Não' && anamnesis.lesoes !== 'Não tenho' && anamnesis.lesoes.trim() !== '') {
      pains.push(`Lesão: ${anamnesis.lesoes}`);
    }
    
    // Cirurgias
    if (anamnesis.cirurgias && anamnesis.cirurgias !== 'Não' && anamnesis.cirurgias !== 'Não fiz' && anamnesis.cirurgias.trim() !== '') {
      pains.push(`Cirurgia: ${anamnesis.cirurgias}`);
    }
    
    return pains;
  }, []);

  // 1. Alerta de Fadiga
  const fatigueAlert = useMemo(() => {
    if (!anamnesisData?.anamnesis) return null;
    
    const sono = anamnesisData.anamnesis.sono_horas;
    const estresse = anamnesisData.anamnesis.estresse;
    const volume = weeklyVolume.totalSets;
    const cleanedPains = cleanPainData(anamnesisData.anamnesis);
    
    let score = 0;
    
    // Pontuação de sono (0-3)
    if (sono === 'Menos de 5 horas') score += 3;
    else if (sono === '5 a 6 horas') score += 2;
    else if (sono === '6 a 7 horas') score += 1;
    
    // Pontuação de estresse (0-2)
    if (estresse === 'Alto') score += 2;
    else if (estresse === 'Moderado') score += 1;
    
    // Pontuação de volume (0-2)
    if (volume > 70) score += 2;
    else if (volume > 50) score += 1;
    
    // Determinar nível de risco
    if (score >= 5) {
      return {
        level: 'high' as const,
        message: '⚠️ Risco de fadiga elevado. Ajuste intensidade e volume.',
        recommendations: [
          'Reduzir volume de treino em 20-30%',
          'Priorizar exercícios de baixo impacto',
          'Incluir mais dias de descanso'
        ],
        pains: cleanedPains,
        stress: estresse || 'Não informado',
        sleep: sono || 'Não informado',
      };
    } else if (score >= 3) {
      return {
        level: 'moderate' as const,
        message: '⚡ Atenção à recuperação. Monitore sinais de fadiga.',
        recommendations: [
          'Manter volume controlado',
          'Garantir aquecimento adequado',
          'Incluir alongamentos ao final'
        ],
        pains: cleanedPains,
        stress: estresse || 'Não informado',
        sleep: sono || 'Não informado',
      };
    }
    
    return {
      level: null,
      message: null,
      recommendations: [],
      pains: cleanedPains,
      stress: estresse || 'Não informado',
      sleep: sono || 'Não informado',
    };
  }, [anamnesisData, weeklyVolume, cleanPainData]);

  // 2. Progresso da Sessão
  const sessionProgress = useMemo(() => {
    const totalSessions = tempWorkout.sessions.length;
    const sessionsWithExercises = tempWorkout.sessions.filter(s => s.exercises.length > 0).length;
    const completionPercentage = totalSessions > 0 ? (sessionsWithExercises / totalSessions) * 100 : 0;
    
    return {
      totalSessions,
      sessionsWithExercises,
      completionPercentage,
      isEmpty: totalSessions === 0,
      isComplete: sessionsWithExercises === totalSessions && totalSessions > 0
    };
  }, [tempWorkout]);

  // 3. Tempo Semanal Estimado
  const weeklyTimeEstimate = useMemo(() => {
    const tempoDisponivel = anamnesisData?.anamnesis?.tempo_disponivel;
    const totalMinutes = muscleAnalysis.totalExercises * 4; // 4 min por exercício
    
    // Buscar frequência recomendada do perfil
    let suggestedFrequency = '3-4x/semana'; // Padrão
    
    if (anamnesisProfile?.recommended_frequency) {
      suggestedFrequency = anamnesisProfile.recommended_frequency;
    } else {
      // Fallback baseado no objetivo
      const goal = anamnesisData?.anamnesis?.primary_goal;
      if (goal === 'Emagrecimento') suggestedFrequency = '4-5x/semana';
      else if (goal === 'Hipertrofia') suggestedFrequency = '5-6x/semana';
      else if (goal === 'Condicionamento') suggestedFrequency = '3-4x/semana';
    }
    
    // Extrair número de sessões atuais
    const currentFreq = anamnesisData?.anamnesis?.frequencia_atual || '0 vezes/semana';
    const currentSessions = parseInt(currentFreq.match(/\d+/)?.[0] || '0');
    
    let recommended = { min: 90, max: 150 }; // Padrão
    
    if (tempoDisponivel === '30 minutos') {
      recommended = { min: 60, max: 90 };
    } else if (tempoDisponivel === '45 minutos') {
      recommended = { min: 90, max: 135 };
    } else if (tempoDisponivel === '60 minutos') {
      recommended = { min: 120, max: 180 };
    } else if (tempoDisponivel === 'Mais de 60 minutos') {
      recommended = { min: 150, max: 240 };
    }
    
    const status = totalMinutes < recommended.min ? 'below' :
                   totalMinutes > recommended.max ? 'above' : 'optimal';
    
    return {
      totalMinutes,
      recommended,
      status,
      currentSessions,
      suggestedSessions: suggestedFrequency,
    };
  }, [muscleAnalysis, anamnesisData, anamnesisProfile]);

  // 4. Distribuição Muscular com Metas
  const muscleDistributionGoals = useMemo(() => {
    const primaryGoal = anamnesisData?.anamnesis?.primary_goal;
    const regioesDesejadas = anamnesisData?.anamnesis?.regioes_que_deseja_melhorar || [];
    const painLocations = anamnesisData?.anamnesis?.pain_locations || [];
    
    // Mapeamento de objetivos para distribuição ideal
    const goalMuscleMap: Record<string, Record<string, { min: number; max: number }>> = {
      'Emagrecimento': {
        'Pernas': { min: 12, max: 18 },
        'Glúteos': { min: 10, max: 15 },
        'Core': { min: 6, max: 10 },
        'Costas': { min: 8, max: 12 },
        'Peito': { min: 6, max: 10 }
      },
      'Hipertrofia': {
        'Pernas': { min: 15, max: 20 },
        'Costas': { min: 12, max: 16 },
        'Peito': { min: 10, max: 14 },
        'Ombros': { min: 8, max: 12 },
        'Bíceps': { min: 8, max: 12 },
        'Tríceps': { min: 8, max: 12 }
      },
      'Condicionamento': {
        'Pernas': { min: 10, max: 15 },
        'Core': { min: 8, max: 12 },
        'Superior': { min: 8, max: 12 }
      }
    };
    
    const idealDistribution = goalMuscleMap[primaryGoal || 'Hipertrofia'] || {};
    
    return muscleAnalysis.muscleGroups.map(mg => {
      const ideal = idealDistribution[mg.group];
      const current = Math.round((mg.percentage / 100) * weeklyVolume.totalSets);
      
      let status: 'optimal' | 'below' | 'above' | 'restricted' = 'optimal';
      
      // Verificar restrições por dor
      const isRestricted = painLocations.some(p => 
        (p === 'Ombro' && mg.group === 'Ombros') ||
        (p === 'Lombar' && mg.group === 'Costas') ||
        (p === 'Joelho' && (mg.group === 'Pernas' || mg.group === 'Quadríceps'))
      );
      
      if (isRestricted) {
        status = 'restricted';
      } else if (ideal) {
        if (current < ideal.min) status = 'below';
        else if (current > ideal.max) status = 'above';
      }
      
      return {
        group: mg.group,
        current,
        ideal,
        status,
        isPriority: regioesDesejadas.includes(mg.group),
        isRestricted
      };
    });
  }, [muscleAnalysis, anamnesisData, weeklyVolume]);

  // 5. Exercícios Bloqueados/Permitidos
  const exerciseRecommendations = useMemo(() => {
    if (!exercisesData) return { blocked: [], recommended: [], warnings: [] };
    
    const painLocations = anamnesisData?.anamnesis?.pain_locations || [];
    const medicalRestrictions = anamnesisData?.anamnesis?.medical_restrictions || [];
    
    const blocked: string[] = [];
    const recommended: string[] = [];
    const warnings: string[] = [];
    
    // Lógica de bloqueio baseada em condições
    if (painLocations.includes('Ombro') || medicalRestrictions.some(r => r.toLowerCase().includes('ombro'))) {
      blocked.push('Desenvolvimento militar', 'Press militar', 'Elevação frontal');
      warnings.push('⚠️ Ombro: Evitar pressão overhead e elevações frontais');
      recommended.push('✔ Elevações laterais leves', '✔ Rotação externa com elástico');
    }
    
    if (painLocations.includes('Lombar') || medicalRestrictions.some(r => r.toLowerCase().includes('lombar'))) {
      blocked.push('Remada curvada', 'Levantamento terra', 'Good morning');
      warnings.push('⚠️ Lombar: Evitar flexão de tronco com carga');
      recommended.push('✔ Remada apoiada', '✔ Puxada alta', '✔ Remada baixa sentado');
    }
    
    if (painLocations.includes('Joelho') || medicalRestrictions.some(r => r.toLowerCase().includes('joelho'))) {
      blocked.push('Agachamento profundo', 'Leg press 45°', 'Saltos');
      warnings.push('⚠️ Joelho: Limitar amplitude e carga em exercícios de pernas');
      recommended.push('✔ Agachamento parcial', '✔ Cadeira extensora', '✔ Mesa flexora');
    }
    
    return { blocked, recommended, warnings };
  }, [exercisesData, anamnesisData]);

  // 6. Indicadores de Qualidade em Escala 0-100
  const qualityScores = useMemo(() => {
    // Volume Score (0-100) - escala gradual
    const volumeScore = (() => {
      if (!weeklyVolume.benchmark) return 50;
      
      const current = weeklyVolume.totalSets;
      const { min, optimal, max } = weeklyVolume.benchmark;
      
      if (current < min) {
        // Abaixo do mínimo: 0-70
        return Math.max((current / min) * 70, 0);
      } else if (current <= optimal) {
        // Zona ideal: 70-100
        return 70 + ((current - min) / (optimal - min)) * 30;
      } else if (current <= max) {
        // Acima do ideal mas ok: 85-100
        return Math.max(100 - ((current - optimal) / (max - optimal)) * 15, 85);
      } else {
        // Excessivo: 50-85
        return Math.max(85 - ((current - max) / max) * 35, 50);
      }
    })();
    
    // Variety Score (0-100) - 5-6 grupos já é bom
    const varietyScore = Math.min((muscleAnalysis.muscleGroups.length / 6) * 100, 100);
    
    // Balance Score (0-100) - penalidade reduzida
    const balanceScore = muscleAnalysis.isBalanced ? 100 : 
                         Math.max(100 - (muscleAnalysis.warnings.length * 10), 50);
    
    // Intensity Score (0-100) - gradual
    const intensityScore = (() => {
      if (!intensityCheck?.aligned) {
        const current = intensityCheck?.current;
        const recommended = intensityCheck?.recommended;
        
        // Desalinhamento moderado mas razoável: 70-85
        if (
          (current === 'balanced' && recommended?.includes('moderate')) ||
          (current === 'light' && recommended?.includes('low'))
        ) return 85;
        
        // Desalinhamento maior: 60-70
        return 70;
      }
      
      return 100;
    })();
    
    // Goal Alignment Score (0-100) - mínimo 40 se tem exercícios
    const goalScore = goalAlignment 
      ? Math.max(goalAlignment.percentage, muscleAnalysis.totalExercises > 0 ? 40 : 0)
      : (muscleAnalysis.totalExercises > 0 ? 40 : 0);
    
    // Overall Score
    const overallScore = Math.round(
      (volumeScore + varietyScore + balanceScore + intensityScore + goalScore) / 5
    );
    
    console.log('Quality Scores:', {
      volumeScore: Math.round(volumeScore),
      varietyScore: Math.round(varietyScore),
      balanceScore: Math.round(balanceScore),
      intensityScore: Math.round(intensityScore),
      goalScore: Math.round(goalScore),
      overallScore
    });
    
    return {
      volume: Math.round(volumeScore),
      variety: Math.round(varietyScore),
      balance: Math.round(balanceScore),
      intensity: Math.round(intensityScore),
      goalAlignment: Math.round(goalScore),
      overall: overallScore
    };
  }, [weeklyVolume, muscleAnalysis, intensityCheck, goalAlignment]);

  // 7. Progresso do Treino Atual
  const workoutProgress = useMemo(() => {
    const targetSessions = parseInt(anamnesisData?.anamnesis?.frequencia_atual?.match(/\d+/)?.[0] || '3');
    const currentSessions = tempWorkout.sessions.length;
    
    const targetSets = weeklyVolume.benchmark?.optimal || 50;
    const currentSets = weeklyVolume.totalSets;
    
    const targetTime = weeklyTimeEstimate.recommended.min;
    const currentTime = weeklyTimeEstimate.totalMinutes;
    
    const completionPercentage = Math.round(
      ((currentSessions / targetSessions) * 0.3 +
       (currentSets / targetSets) * 0.5 +
       (currentTime / targetTime) * 0.2) * 100
    );
    
    return {
      sessions: { current: currentSessions, target: targetSessions },
      sets: { current: currentSets, target: targetSets },
      time: { current: currentTime, target: targetTime },
      daysScheduled: currentSessions,
      completionPercentage: Math.min(completionPercentage, 100)
    };
  }, [tempWorkout, anamnesisData, weeklyVolume, weeklyTimeEstimate]);

  // Função para buscar sugestões da IA
  const fetchAISuggestions = useCallback(async () => {
    if (!clientId || !anamnesisData?.anamnesis) return;
    
    setLoadingAI(true);
    setAiError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-workout-suggestions', {
        body: { clientId }
      });
      
      if (error) {
        console.error('Erro ao buscar sugestões IA:', error);
        setAiError('Não foi possível gerar sugestões. Tente novamente.');
      } else if (data) {
        setAiSuggestions(data);
      }
    } catch (error) {
      console.error('Erro ao buscar sugestões IA:', error);
      setAiError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoadingAI(false);
    }
  }, [clientId, anamnesisData]);

  // Auto-fetch ao montar (somente se ainda não temos sugestões)
  useEffect(() => {
    if (clientId && anamnesisData?.anamnesis && !aiSuggestions && !loadingAI) {
      fetchAISuggestions();
    }
  }, [clientId, anamnesisData]); // Removido aiSuggestions e loadingAI para evitar loop

  return {
    tempWorkout,
    setTempWorkout,
    acknowledgeRisks,
    setAcknowledgeRisks,
    muscleAnalysis,
    impactAnalysis,
    compatibility,
    estimatedTime,
    weeklyVolume,
    intensityCheck,
    goalAlignment,
    profileRisks,
    addNewSession,
    removeSession,
    updateSession,
    reorderSessions,
    reorderExercisesInSession,
    addExistingSession,
    getExistingSessionIds,
    canSubmit,
    submitBlockReason,
    submit,
    isSubmitting,
    clientProfile: clientDetails?.profile,
    clientAnamnesis: anamnesisData?.anamnesis,
    anamnesisProfile,
    // Novos exports do cockpit
    fatigueAlert,
    sessionProgress,
    weeklyTimeEstimate,
    muscleDistributionGoals,
    exerciseRecommendations,
    qualityScores,
    workoutProgress,
    // IA Suggestions
    aiSuggestions,
    loadingAI,
    aiError,
    refreshAISuggestions: fetchAISuggestions,
  };
};
