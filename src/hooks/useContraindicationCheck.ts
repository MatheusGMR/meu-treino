import { useMemo } from "react";
import type { Database } from "@/integrations/supabase/types";

type Exercise = Database["public"]["Tables"]["exercises"]["Row"];

interface ContraindicationResult {
  hasRisk: boolean;
  severity: 'warning' | 'error' | 'info';
  message: string;
  matchedKeywords: string[];
}

const RISK_KEYWORDS = [
  { keyword: 'articular', severity: 'warning' as const, context: 'dor nas articulações' },
  { keyword: 'lesão', severity: 'error' as const, context: 'histórico de lesões' },
  { keyword: 'lesao', severity: 'error' as const, context: 'histórico de lesões' },
  { keyword: 'cirurgia', severity: 'error' as const, context: 'cirurgia prévia' },
  { keyword: 'dor', severity: 'warning' as const, context: 'dor' },
  { keyword: 'lombar', severity: 'warning' as const, context: 'problemas lombares' },
  { keyword: 'coluna', severity: 'warning' as const, context: 'problemas na coluna' },
  { keyword: 'joelho', severity: 'warning' as const, context: 'problemas no joelho' },
  { keyword: 'ombro', severity: 'warning' as const, context: 'problemas no ombro' },
  { keyword: 'cardíaco', severity: 'error' as const, context: 'problemas cardíacos' },
  { keyword: 'cardiaco', severity: 'error' as const, context: 'problemas cardíacos' },
  { keyword: 'hipertensão', severity: 'warning' as const, context: 'hipertensão' },
  { keyword: 'hipertensao', severity: 'warning' as const, context: 'hipertensão' },
  { keyword: 'diabetes', severity: 'warning' as const, context: 'diabetes' },
  { keyword: 'hérnia', severity: 'error' as const, context: 'hérnia' },
  { keyword: 'hernia', severity: 'error' as const, context: 'hérnia' },
  { keyword: 'tendinite', severity: 'warning' as const, context: 'tendinite' },
  { keyword: 'bursite', severity: 'warning' as const, context: 'bursite' },
];

export const useContraindicationCheck = (
  exercise: Exercise | null,
  medicalConditions: string | null | undefined
) => {
  return useMemo((): ContraindicationResult => {
    if (!exercise?.contraindication || !medicalConditions) {
      return {
        hasRisk: false,
        severity: 'info',
        message: '',
        matchedKeywords: [],
      };
    }

    const contraLower = exercise.contraindication.toLowerCase();
    const conditionsLower = medicalConditions.toLowerCase();

    const matched: Array<{ keyword: string; severity: 'warning' | 'error' | 'info'; context: string }> = [];

    for (const risk of RISK_KEYWORDS) {
      if (contraLower.includes(risk.keyword) && conditionsLower.includes(risk.keyword)) {
        matched.push(risk);
      }
    }

    if (matched.length === 0) {
      return {
        hasRisk: false,
        severity: 'info',
        message: '',
        matchedKeywords: [],
      };
    }

    // Determinar severidade mais alta
    const highestSeverity = matched.some(m => m.severity === 'error') 
      ? 'error' 
      : 'warning';

    const contexts = matched.map(m => m.context);
    const uniqueContexts = [...new Set(contexts)];

    return {
      hasRisk: true,
      severity: highestSeverity,
      message: exercise.contraindication,
      matchedKeywords: uniqueContexts,
    };
  }, [exercise, medicalConditions]);
};

export const checkContraindicationBatch = (
  exercises: Exercise[],
  medicalConditions: string | null | undefined
): Map<string, ContraindicationResult> => {
  const results = new Map<string, ContraindicationResult>();

  if (!medicalConditions) {
    return results;
  }

  const conditionsLower = medicalConditions.toLowerCase();

  exercises.forEach((exercise) => {
    if (!exercise.contraindication) {
      results.set(exercise.id, {
        hasRisk: false,
        severity: 'info',
        message: '',
        matchedKeywords: [],
      });
      return;
    }

    const contraLower = exercise.contraindication.toLowerCase();
    const matched: Array<{ keyword: string; severity: 'warning' | 'error' | 'info'; context: string }> = [];

    for (const risk of RISK_KEYWORDS) {
      if (contraLower.includes(risk.keyword) && conditionsLower.includes(risk.keyword)) {
        matched.push(risk);
      }
    }

    if (matched.length === 0) {
      results.set(exercise.id, {
        hasRisk: false,
        severity: 'info',
        message: '',
        matchedKeywords: [],
      });
      return;
    }

    const highestSeverity = matched.some(m => m.severity === 'error') 
      ? 'error' 
      : 'warning';

    const contexts = matched.map(m => m.context);
    const uniqueContexts = [...new Set(contexts)];

    results.set(exercise.id, {
      hasRisk: true,
      severity: highestSeverity,
      message: exercise.contraindication,
      matchedKeywords: uniqueContexts,
    });
  });

  return results;
};
