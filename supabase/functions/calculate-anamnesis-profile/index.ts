import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DimensionScore {
  discipline: number;
  resilience: number;
  recovery: number;
  constraints: number;
  mobility: number;
}

interface ProfileMatch {
  profileName: string;
  score: number;
  confidence: number;
}

/**
 * Calcula scores baseado nas respostas da anamnese
 */
function calculateDimensionScores(anamnesis: any): DimensionScore {
  const scores: DimensionScore = {
    discipline: 0,
    resilience: 0,
    recovery: 0,
    constraints: 0,
    mobility: 0,
  };

  // Disciplina (0-10)
  if (anamnesis.discipline_level === 'Alta') scores.discipline += 8;
  else if (anamnesis.discipline_level === 'Média') scores.discipline += 5;
  else scores.discipline += 2;

  if (anamnesis.nutrition_quality === 'Boa') scores.discipline += 2;
  else if (anamnesis.nutrition_quality === 'Regular') scores.discipline += 1;

  // Resiliência (0-10)
  if (anamnesis.handles_challenges === 'Bem') scores.resilience += 8;
  else if (anamnesis.handles_challenges === 'Moderadamente') scores.resilience += 5;
  else scores.resilience += 2;

  if (anamnesis.activity_level === 'Muito Ativo') scores.resilience += 2;
  else if (anamnesis.activity_level === 'Ativo') scores.resilience += 1;

  // Recuperação (0-10)
  if (anamnesis.sleep_quality === 'Boa') scores.recovery += 5;
  else if (anamnesis.sleep_quality === 'Regular') scores.recovery += 3;
  else scores.recovery += 1;

  if (anamnesis.water_intake === 'Adequada') scores.recovery += 3;
  else if (anamnesis.water_intake === 'Regular') scores.recovery += 2;
  else scores.recovery += 1;

  if (anamnesis.work_type === 'Sedentário' || anamnesis.daily_sitting_hours >= 8) {
    scores.recovery -= 1;
  }

  scores.recovery = Math.max(0, Math.min(10, scores.recovery));

  // Restrições (0-10, invertido: mais restrições = score menor)
  let constraintsPenalty = 0;
  if (anamnesis.has_joint_pain) constraintsPenalty += 3;
  if (anamnesis.has_injury_or_surgery) constraintsPenalty += 4;
  if (anamnesis.medical_restrictions?.length > 0) {
    constraintsPenalty += anamnesis.medical_restrictions.length * 2;
  }

  scores.constraints = Math.max(0, 10 - constraintsPenalty);

  // Mobilidade (0-10)
  if (anamnesis.activity_level === 'Muito Ativo') scores.mobility += 8;
  else if (anamnesis.activity_level === 'Ativo') scores.mobility += 6;
  else if (anamnesis.activity_level === 'Moderadamente Ativo') scores.mobility += 4;
  else scores.mobility += 2;

  if (anamnesis.has_joint_pain) scores.mobility -= 2;
  if (anamnesis.time_without_training === 'Mais de 1 ano' || anamnesis.time_without_training === '6 meses a 1 ano') {
    scores.mobility -= 1;
  }

  scores.mobility = Math.max(0, Math.min(10, scores.mobility));

  return scores;
}

/**
 * Compara scores com perfis conhecidos e retorna o melhor match
 */
function matchProfile(scores: DimensionScore, profiles: any[]): ProfileMatch {
  let bestMatch: ProfileMatch = {
    profileName: 'Perfil 1',
    score: 0,
    confidence: 0,
  };

  profiles.forEach((profile) => {
    const typicalCombination = profile.typical_combination as any;
    
    if (!typicalCombination) return;

    // Calcular distância euclidiana entre scores
    const distance = Math.sqrt(
      Math.pow(scores.discipline - (typicalCombination.discipline || 5), 2) +
      Math.pow(scores.resilience - (typicalCombination.resilience || 5), 2) +
      Math.pow(scores.recovery - (typicalCombination.recovery || 5), 2) +
      Math.pow(scores.constraints - (typicalCombination.constraints || 5), 2) +
      Math.pow(scores.mobility - (typicalCombination.mobility || 5), 2)
    );

    // Converter distância em score de similaridade (0-100)
    // Distância máxima possível: sqrt(5 * 10^2) ≈ 22.36
    const similarity = Math.max(0, 100 - (distance / 22.36) * 100);

    if (similarity > bestMatch.score) {
      bestMatch = {
        profileName: profile.name,
        score: similarity,
        confidence: similarity / 100,
      };
    }
  });

  return bestMatch;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clientId } = await req.json();

    if (!clientId) {
      throw new Error('clientId é obrigatório');
    }

    console.log(`Calculando perfil para cliente: ${clientId}`);

    // 1. Buscar anamnese do cliente
    const { data: anamnesis, error: anamnesisError } = await supabase
      .from('anamnesis')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (anamnesisError || !anamnesis) {
      throw new Error('Anamnese não encontrada para este cliente');
    }

    // 2. Buscar perfis disponíveis
    const { data: profiles, error: profilesError } = await supabase
      .from('anamnesis_profiles')
      .select('*');

    if (profilesError || !profiles || profiles.length === 0) {
      throw new Error('Nenhum perfil disponível no sistema');
    }

    // 3. Calcular scores
    const dimensionScores = calculateDimensionScores(anamnesis);
    console.log('Dimension Scores:', dimensionScores);

    // 4. Encontrar melhor match
    const profileMatch = matchProfile(dimensionScores, profiles);
    console.log('Profile Match:', profileMatch);

    // 5. Atualizar anamnese com perfil calculado
    const { error: updateError } = await supabase
      .from('anamnesis')
      .update({
        calculated_profile: profileMatch.profileName,
        dimension_scores: dimensionScores,
        profile_confidence_score: profileMatch.confidence,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', clientId);

    if (updateError) {
      throw new Error(`Erro ao atualizar anamnese: ${updateError.message}`);
    }

    // 6. Atualizar profile com nome do perfil
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        anamnesis_profile: profileMatch.profileName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (profileUpdateError) {
      console.error('Erro ao atualizar profile:', profileUpdateError);
      // Não falhar a operação por isso
    }

    return new Response(
      JSON.stringify({
        success: true,
        profile: profileMatch.profileName,
        confidence: profileMatch.confidence,
        dimensionScores,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao calcular perfil:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
