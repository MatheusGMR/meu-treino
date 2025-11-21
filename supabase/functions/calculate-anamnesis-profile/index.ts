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

interface IMC {
  valor: string;
  categoria: string;
}

/**
 * Calcula IMC e categoria
 */
function calcularIMC(peso: number | null, altura: number | null): IMC | null {
  if (!peso || !altura || altura <= 0) return null;
  const imc = peso / Math.pow(altura / 100, 2);
  const categoria = 
    imc < 18.5 ? 'Abaixo do peso' :
    imc < 25 ? 'Peso normal' :
    imc < 30 ? 'Sobrepeso' :
    'Obesidade';
  return { valor: imc.toFixed(1), categoria };
}

/**
 * Infere nível de experiência baseado no histórico
 */
function inferirExperiencia(tipos: string[] | null, frequencia: string | null): string {
  if (!tipos || tipos.length === 0) return 'Iniciante';
  if (tipos.includes('Musculação') || tipos.includes('Crossfit')) return 'Intermediário';
  if (tipos.includes('Pilates') || tipos.includes('Yoga')) return 'Iniciante+';
  return 'Iniciante';
}

/**
 * Calcula scores baseado nas respostas da anamnese (usando campos NOVOS)
 */
function calculateDimensionScores(anamnesis: any): DimensionScore {
  const scores: DimensionScore = {
    discipline: 0,
    resilience: 0,
    recovery: 0,
    constraints: 0,
    mobility: 0,
  };

  // DISCIPLINA (0-10): alimentação + hidratação + motivação
  let discipline = 0;
  if (anamnesis.alimentacao === 'Boa') discipline += 3;
  else if (anamnesis.alimentacao === 'Regular') discipline += 2;
  else discipline += 1;

  if (anamnesis.consumo_agua === '2 a 3 litros' || anamnesis.consumo_agua === 'Mais de 3 litros') {
    discipline += 2;
  } else if (anamnesis.consumo_agua === '1 a 2 litros') {
    discipline += 1;
  }

  if (anamnesis.motivacao) discipline += 2;

  scores.discipline = Math.min(10, discipline);

  // RESILIÊNCIA (0-10): prioridade + prazo + motivação
  let resilience = anamnesis.prioridade || 3; // 1-5
  if (anamnesis.prazo === '1 mês' || anamnesis.prazo === '3 meses') resilience += 2;
  else if (anamnesis.prazo === '6 meses') resilience += 1;
  
  if (anamnesis.motivacao === 'Saúde' || anamnesis.motivacao === 'Estética') resilience += 2;

  scores.resilience = Math.min(10, resilience);

  // RECUPERAÇÃO (0-10): sono + estresse + hidratação
  let recovery = 5;
  if (anamnesis.sono_horas === '7 a 8 horas' || anamnesis.sono_horas === 'Mais de 8 horas') {
    recovery += 3;
  } else if (anamnesis.sono_horas === '6 a 7 horas') {
    recovery += 2;
  } else {
    recovery += 1;
  }

  if (anamnesis.estresse === 'Baixo') recovery += 2;
  else if (anamnesis.estresse === 'Moderado') recovery += 0;
  else if (anamnesis.estresse === 'Alto' || anamnesis.estresse === 'Muito alto') recovery -= 2;

  if (anamnesis.consumo_agua === '2 a 3 litros' || anamnesis.consumo_agua === 'Mais de 3 litros') {
    recovery += 1;
  }

  if (anamnesis.daily_sitting_hours && anamnesis.daily_sitting_hours >= 8) {
    recovery -= 1;
  }

  scores.recovery = Math.max(0, Math.min(10, recovery));

  // RESTRIÇÕES (0-10, invertido: mais restrições = score menor)
  let constraints = 10;
  
  // IMC
  const imc = calcularIMC(anamnesis.peso_kg, anamnesis.altura_cm);
  if (imc && parseFloat(imc.valor) > 30) constraints -= 3; // Obesidade
  else if (imc && parseFloat(imc.valor) > 25) constraints -= 1; // Sobrepeso

  // Dor
  if (anamnesis.has_joint_pain && anamnesis.escala_dor) {
    if (anamnesis.escala_dor >= 7) constraints -= 3;
    else if (anamnesis.escala_dor >= 5) constraints -= 2;
    else constraints -= 1;
  }

  // Lesão/Cirurgia
  if (anamnesis.has_injury_or_surgery) constraints -= 3;

  // Restrições médicas
  if (anamnesis.restricao_medica === 'Sim') constraints -= 2;

  scores.constraints = Math.max(0, constraints);

  // MOBILIDADE (0-10): experiência + frequência + tempo parado
  let mobility = 5;
  const experiencia = inferirExperiencia(anamnesis.tipos_de_treino_feitos, anamnesis.frequencia_atual);
  
  if (experiencia === 'Intermediário') mobility += 3;
  else if (experiencia === 'Iniciante+') mobility += 2;
  else mobility += 1;

  if (anamnesis.frequencia_atual === '0 vezes/semana' || !anamnesis.frequencia_atual) mobility -= 1;

  if (anamnesis.time_without_training === 'Mais de 1 ano') mobility -= 2;
  else if (anamnesis.time_without_training === '6 meses a 1 ano') mobility -= 1;

  if (anamnesis.has_joint_pain) mobility -= 1;

  scores.mobility = Math.max(0, Math.min(10, mobility));

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

    // 5. Calcular IMC e nível de experiência
    const imc = calcularIMC(anamnesis.peso_kg, anamnesis.altura_cm);
    const nivelExperiencia = inferirExperiencia(anamnesis.tipos_de_treino_feitos, anamnesis.frequencia_atual);
    console.log('IMC:', imc);
    console.log('Nível Experiência:', nivelExperiencia);

    // 6. Atualizar anamnese com perfil calculado + dados persistidos
    const { error: updateError } = await supabase
      .from('anamnesis')
      .update({
        calculated_profile: profileMatch.profileName,
        dimension_scores: dimensionScores,
        profile_confidence_score: profileMatch.confidence,
        imc_calculado: imc ? parseFloat(imc.valor) : null,
        imc_categoria: imc?.categoria || null,
        nivel_experiencia: nivelExperiencia,
        calculated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', clientId);

    if (updateError) {
      throw new Error(`Erro ao atualizar anamnese: ${updateError.message}`);
    }

    // 7. Atualizar profile com nome do perfil
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
        imc,
        nivelExperiencia,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao calcular perfil:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
