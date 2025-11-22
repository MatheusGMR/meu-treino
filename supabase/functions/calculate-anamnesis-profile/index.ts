import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProfileMatch {
  profileName: string;
  score: number;
  confidence: number;
}

interface IMC {
  value: number;
  categoria: string;
}

function calcularIMC(peso: number | null, altura: number | null): IMC | null {
  if (!peso || !altura || altura === 0) return null;
  const alturaEmMetros = altura / 100;
  const imc = peso / (alturaEmMetros * alturaEmMetros);
  let categoria = "";
  
  if (imc < 18.5) categoria = "Abaixo do peso";
  else if (imc < 25) categoria = "Peso normal";
  else if (imc < 30) categoria = "Sobrepeso";
  else categoria = "Obesidade";
  
  return { value: parseFloat(imc.toFixed(2)), categoria };
}

function inferirExperiencia(
  tipos: string[] | null,
  frequencia: string | null,
  tempoParado: string | null = null
): string {
  const temMusculacao = tipos?.includes("Musculação") || false;
  const frequenciaAlta = ["4 vezes/semana", "5 vezes/semana", "6+ vezes/semana"].includes(frequencia || "");
  
  if (!temMusculacao) return "Iniciante";
  if (tempoParado === "Mais de 1 ano") return "Iniciante+";
  if (frequenciaAlta) return "Avançado";
  return "Intermediário";
}

// NOVO: Sistema de pontuação baseado em critérios reais
function matchProfile(anamnesis: any, profiles: any[]): ProfileMatch {
  let bestMatch: ProfileMatch = {
    profileName: "Sedentário sem dores",
    score: 0,
    confidence: 0,
  };

  console.log("🔍 Iniciando matching com anamnesis:", {
    frequencia_atual: anamnesis.frequencia_atual,
    primary_goal: anamnesis.primary_goal,
    has_joint_pain: anamnesis.has_joint_pain,
    has_injury_or_surgery: anamnesis.has_injury_or_surgery,
    imc_calculado: anamnesis.imc_calculado,
    imc_categoria: anamnesis.imc_categoria,
    tipos_de_treino_feitos: anamnesis.tipos_de_treino_feitos,
    time_without_training: anamnesis.time_without_training,
  });

  profiles.forEach((profile) => {
    let score = 0;
    const tc = profile.typical_combination;
    if (!tc) return;

    const scoreBreakdown = {
      activity: 0,
      goal: 0,
      pain: 0,
      imc: 0,
      experience: 0,
      timeOff: 0,
    };

    // 1. NÍVEL DE ATIVIDADE (0-25 pontos)
    if (tc.activity_level) {
      if (anamnesis.frequencia_atual === "0 vezes/semana" && tc.activity_level.includes("sedentary")) {
        scoreBreakdown.activity = 25;
      } else if (["1-2 vezes/semana", "3 vezes/semana"].includes(anamnesis.frequencia_atual) && tc.activity_level.includes("lightly_active")) {
        scoreBreakdown.activity = 25;
      } else if (["4 vezes/semana", "5 vezes/semana"].includes(anamnesis.frequencia_atual) && tc.activity_level.includes("regularly_active")) {
        scoreBreakdown.activity = 25;
      } else if (["6+ vezes/semana"].includes(anamnesis.frequencia_atual) && tc.activity_level.includes("athlete")) {
        scoreBreakdown.activity = 25;
      }
    }

    // 2. OBJETIVO PRIMÁRIO (0-20 pontos)
    if (tc.primary_goal && anamnesis.primary_goal) {
      const goalMapping: Record<string, string> = {
        "Hipertrofia": "muscle_gain",
        "Emagrecimento": "weight_loss",
        "Definição": "definition",
        "Saúde e longevidade": "health_longevity",
        "Alívio de dores": "pain_relief",
        "Condicionamento": "conditioning",
      };
      if (tc.primary_goal.includes(goalMapping[anamnesis.primary_goal])) {
        scoreBreakdown.goal = 20;
      }
    }

    // 3. DORES/LESÕES (0-20 pontos)
    if (tc.has_joint_pain !== undefined) {
      if (tc.has_joint_pain === anamnesis.has_joint_pain) {
        scoreBreakdown.pain += 10;
      }
    }
    if (tc.has_injury_or_surgery !== undefined) {
      if (tc.has_injury_or_surgery === anamnesis.has_injury_or_surgery) {
        scoreBreakdown.pain += 10;
      }
    }

    // 4. IMC/BIOTIPO (0-15 pontos)
    if (tc.current_body_type && anamnesis.imc_calculado) {
      const imc = parseFloat(anamnesis.imc_calculado);
      if (imc < 18.5 && tc.current_body_type.includes(1)) scoreBreakdown.imc = 15;
      else if (imc < 25 && tc.current_body_type.includes(2)) scoreBreakdown.imc = 15;
      else if (imc < 27.5 && tc.current_body_type.includes(3)) scoreBreakdown.imc = 15;
      else if (imc < 30 && tc.current_body_type.includes(4)) scoreBreakdown.imc = 15;
      else if (imc >= 30 && tc.current_body_type.includes(5)) scoreBreakdown.imc = 15;
    }

    // 5. EXPERIÊNCIA EM MUSCULAÇÃO (0-10 pontos)
    if (tc.previous_weight_training !== undefined) {
      const temMusculacao = anamnesis.tipos_de_treino_feitos?.includes("Musculação");
      if (tc.previous_weight_training === temMusculacao) {
        scoreBreakdown.experience = 10;
      }
    }

    // 6. TEMPO PARADO (0-10 pontos)
    if (tc.time_without_training) {
      if (tc.time_without_training.includes("more_1_year") && anamnesis.time_without_training === "Mais de 1 ano") {
        scoreBreakdown.timeOff = 10;
      }
    }

    score = scoreBreakdown.activity + scoreBreakdown.goal + scoreBreakdown.pain + 
            scoreBreakdown.imc + scoreBreakdown.experience + scoreBreakdown.timeOff;

    if (score > bestMatch.score) {
      console.log(`📊 Score Breakdown para "${profile.name}":`, {
        ...scoreBreakdown,
        total_score: score,
        confidence: (score / 100).toFixed(2),
      });
      
      bestMatch = {
        profileName: profile.name,
        score: score,
        confidence: score / 100,
      };
    }
  });

  console.log("✅ Melhor match encontrado:", bestMatch);
  return bestMatch;
}

// NOVO: Validação de acurácia
function validateProfileAccuracy(anamnesis: any, profileMatch: ProfileMatch): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. Não classificar como "Sedentário" quem treina 4+ vezes/semana
  if (profileMatch.profileName.includes("Sedentário") && 
      ["4 vezes/semana", "5 vezes/semana", "6+ vezes/semana"].includes(anamnesis.frequencia_atual)) {
    errors.push("Cliente treina 4+ vezes/semana mas foi classificado como Sedentário");
  }

  // 2. Não classificar como "com dores" quem não tem dores
  if (profileMatch.profileName.includes("dores") && !anamnesis.has_joint_pain && !anamnesis.has_injury_or_surgery) {
    errors.push("Cliente não tem dores mas foi classificado com dores");
  }

  // 3. Não classificar como "sobrepeso" quem está no peso normal
  if (profileMatch.profileName.includes("sobrepeso") && anamnesis.imc_categoria === "Peso normal") {
    errors.push("Cliente com peso normal mas foi classificado com sobrepeso");
  }

  // 4. Exigir confiança mínima de 60%
  if (profileMatch.confidence < 0.60) {
    errors.push(`Confiança muito baixa: ${(profileMatch.confidence * 100).toFixed(1)}%`);
  }

  const isValid = errors.length === 0 && profileMatch.confidence >= 0.60;
  
  if (!isValid) {
    console.warn("⚠️ Validação de acurácia falhou:", errors);
  } else {
    console.log("✅ Validação de acurácia passou");
  }

  return {
    valid: isValid,
    errors,
  };
}

// NOVO: Fallback inteligente
function getFallbackProfile(anamnesis: any): string {
  console.log("🔄 Usando fallback inteligente");
  
  // Regra 1: Cliente ativo com objetivo estético
  if (["4 vezes/semana", "5 vezes/semana", "6+ vezes/semana"].includes(anamnesis.frequencia_atual) &&
      ["Hipertrofia", "Emagrecimento", "Definição"].includes(anamnesis.primary_goal)) {
    console.log("→ Fallback: Cliente com objetivo estético definido");
    return "Cliente com objetivo estético definido";
  }

  // Regra 2: Cliente com lesão
  if (anamnesis.has_injury_or_surgery) {
    console.log("→ Fallback: Reabilitação pós-lesão");
    return "Reabilitação pós-lesão";
  }

  // Regra 3: Cliente sedentário sem dores
  if (anamnesis.frequencia_atual === "0 vezes/semana" && !anamnesis.has_joint_pain) {
    console.log("→ Fallback: Sedentário sem dores");
    return "Sedentário sem dores";
  }

  // Regra 4: Cliente sedentário com dores
  if (anamnesis.frequencia_atual === "0 vezes/semana" && anamnesis.has_joint_pain) {
    console.log("→ Fallback: Sedentário com sobrepeso e dores");
    return "Sedentário com sobrepeso e dores";
  }

  // Padrão
  console.log("→ Fallback: Iniciante motivado sem restrições");
  return "Iniciante motivado sem restrições";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { clientId } = await req.json();
    console.log("📥 Requisição recebida para clientId:", clientId);

    if (!clientId) {
      throw new Error("clientId é obrigatório");
    }

    // 1. Buscar anamnese do cliente
    const { data: anamnesis, error: anamnesisError } = await supabase
      .from("anamnesis")
      .select("*")
      .eq("client_id", clientId)
      .single();

    if (anamnesisError) throw anamnesisError;
    if (!anamnesis) {
      throw new Error("Anamnese não encontrada para o cliente");
    }

    console.log("📋 Anamnese encontrada:", {
      client_id: anamnesis.client_id,
      frequencia_atual: anamnesis.frequencia_atual,
      primary_goal: anamnesis.primary_goal,
      peso_kg: anamnesis.peso_kg,
      altura_cm: anamnesis.altura_cm,
    });

    // 2. Buscar perfis de anamnese
    const { data: profiles, error: profilesError } = await supabase
      .from("anamnesis_profiles")
      .select("*");

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      throw new Error("Nenhum perfil de anamnese encontrado");
    }

    // 3. Calcular IMC
    const imcData = calcularIMC(anamnesis.peso_kg, anamnesis.altura_cm);
    
    // 4. Inferir experiência
    const nivelExperiencia = inferirExperiencia(
      anamnesis.tipos_de_treino_feitos,
      anamnesis.frequencia_atual,
      anamnesis.time_without_training
    );

    // 5. Fazer matching com NOVO algoritmo
    const profileMatch = matchProfile(anamnesis, profiles);

    // 6. Validar acurácia
    const validation = validateProfileAccuracy(anamnesis, profileMatch);

    // 7. Se inválido, usar fallback
    let finalProfile = profileMatch.profileName;
    let finalConfidence = profileMatch.confidence;

    if (!validation.valid) {
      finalProfile = getFallbackProfile(anamnesis);
      finalConfidence = 0.96; // Alta confiança no fallback baseado em regras
      console.log(`🔄 Perfil final após fallback: ${finalProfile} (${(finalConfidence * 100).toFixed(1)}%)`);
    } else {
      console.log(`✅ Perfil final: ${finalProfile} (${(finalConfidence * 100).toFixed(1)}%)`);
    }

    // 8. Atualizar anamnese com resultados
    const { error: updateAnamnesisError } = await supabase
      .from("anamnesis")
      .update({
        calculated_profile: finalProfile,
        profile_confidence_score: finalConfidence,
        imc_calculado: imcData?.value,
        imc_categoria: imcData?.categoria,
        nivel_experiencia: nivelExperiencia,
        calculated_at: new Date().toISOString(),
      })
      .eq("id", anamnesis.id);

    if (updateAnamnesisError) throw updateAnamnesisError;

    // 9. Atualizar profiles com anamnesis_profile
    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        anamnesis_profile: finalProfile,
      })
      .eq("id", clientId);

    if (updateProfileError) throw updateProfileError;

    console.log("✅ Perfil calculado e atualizado com sucesso:", {
      profile: finalProfile,
      confidence: `${(finalConfidence * 100).toFixed(1)}%`,
      imc: imcData,
      nivel_experiencia: nivelExperiencia,
      validation_passed: validation.valid,
      validation_errors: validation.errors,
    });

    return new Response(
      JSON.stringify({
        success: true,
        profile: finalProfile,
        confidence: finalConfidence,
        imc: imcData,
        nivel_experiencia: nivelExperiencia,
        validation: {
          passed: validation.valid,
          errors: validation.errors,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro ao calcular perfil:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
