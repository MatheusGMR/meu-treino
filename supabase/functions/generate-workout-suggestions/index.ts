import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return new Response(
        JSON.stringify({ error: 'clientId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar anamnese do cliente
    const { data: anamnesis, error: anamnesisError } = await supabase
      .from('anamnesis')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (anamnesisError || !anamnesis) {
      console.error('Anamnese não encontrada:', anamnesisError);
      return new Response(
        JSON.stringify({ error: 'Anamnese não encontrada para este cliente' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Anamnese encontrada:', {
      hasProfile: !!anamnesis.calculated_profile,
      primaryGoal: anamnesis.primary_goal,
      hasIMC: !!anamnesis.imc_calculado,
      hasExperiencia: !!anamnesis.nivel_experiencia,
    });

    // Usar dados persistidos ou calcular
    const imc = anamnesis.imc_calculado && anamnesis.imc_categoria
      ? { valor: anamnesis.imc_calculado.toFixed(1), categoria: anamnesis.imc_categoria }
      : calcularIMC(anamnesis.peso_kg, anamnesis.altura_cm);

    const nivelExperiencia = anamnesis.nivel_experiencia || 
      inferirExperiencia(anamnesis.tipos_de_treino_feitos, anamnesis.frequencia_atual);

    // Montar prompt ENRIQUECIDO
    const prompt = `
Analise esta anamnese completa e forneça sugestões personalizadas:

COMPOSIÇÃO E SAÚDE:
• IMC: ${imc ? `${imc.valor} (${imc.categoria})` : 'Não calculado'}
• Peso: ${anamnesis.peso_kg ? `${anamnesis.peso_kg}kg` : 'Não informado'}
• Altura: ${anamnesis.altura_cm ? `${anamnesis.altura_cm}cm` : 'Não informado'}
• Autoimagem: ${anamnesis.autoimagem || 'Não informado'}
• Dores: ${anamnesis.pain_details || 'Nenhuma'} (escala ${anamnesis.escala_dor || 0}/10)
${anamnesis.pain_locations?.length ? `• Locais de dor: ${anamnesis.pain_locations.join(', ')}` : ''}
• Restrições médicas: ${anamnesis.restricao_medica === 'Sim' ? 'SIM' : 'Não'}
${anamnesis.lesoes ? `• Lesões: ${anamnesis.lesoes}` : ''}
${anamnesis.cirurgias ? `• Cirurgias: ${anamnesis.cirurgias}` : ''}

EXPERIÊNCIA E HISTÓRICO:
• Nível estimado: ${nivelExperiencia}
• Histórico de treinos: ${anamnesis.tipos_de_treino_feitos?.join(', ') || 'Sem histórico'}
• Frequência atual: ${anamnesis.frequencia_atual || '0x/semana'}
• Tempo sem treinar: ${anamnesis.time_without_training || 'Não informado'}
• Treina atualmente: ${anamnesis.treina_atualmente ? 'Sim' : 'Não'}

OBJETIVOS:
• Principal: ${anamnesis.primary_goal || 'Não especificado'}
• Secundário: ${anamnesis.objetivo_secundario || 'Nenhum'}
• Prazo: ${anamnesis.prazo || 'Não definido'}
• Prioridade (1-5): ${anamnesis.prioridade || 'Não definida'}
• Regiões prioritárias: ${anamnesis.regioes_que_deseja_melhorar?.join(', ') || 'Não especificado'}
${anamnesis.evento_especifico ? `• Evento específico: ${anamnesis.evento_especifico}` : ''}

ESTILO DE VIDA:
• Sono: ${anamnesis.sono_horas || 'Não informado'}
• Estresse: ${anamnesis.estresse || 'Não informado'}
• Alimentação: ${anamnesis.alimentacao || 'Não informado'}
• Hidratação: ${anamnesis.consumo_agua || 'Não informado'}
${anamnesis.alcool_cigarro ? `• Álcool/Cigarro: ${anamnesis.alcool_cigarro}` : ''}
• Horas sentado/dia: ${anamnesis.daily_sitting_hours || 'Não informado'}

LOGÍSTICA E PREFERÊNCIAS:
• Tempo disponível: ${anamnesis.tempo_disponivel || 'Não especificado'}
• Horário preferido: ${anamnesis.horario_preferido || 'Não especificado'}
• Local de treino: ${anamnesis.local_treino || 'Não especificado'}
• Tipo de treino preferido: ${anamnesis.tipo_treino_preferido || 'Não especificado'}
• Preferência de instrução: ${anamnesis.preferencia_instrucao || 'Não especificado'}

PERFIL CALCULADO:
• Perfil de anamnese: ${anamnesis.calculated_profile || 'Não calculado'}

FORNEÇA (seja direto e específico):

1. Overview (2-3 frases): 
   - Resuma o perfil considerando IMC, experiência, objetivos e restrições
   - Mencione que as recomendações abaixo serão aplicadas na montagem do treino personalizado

2. Frequência: 
   - Sessões/semana e duração estimada
   - Considere experiência, tempo disponível e objetivos

3. Recomendações (máx 5 itens práticos):
   🔥 Exercícios/grupos musculares OBRIGATÓRIOS (considere histórico + regiões prioritárias + objetivo)
   ⚡ Ajustes de intensidade/volume (considere IMC + experiência + tempo parado)
   ⚠️ Cuidados com dores/restrições (considere escala de dor + locais + lesões)
   💡 Sugestões gerais (considere estilo de vida + preferências + histórico de treinos)
   
   IMPORTANTE: Se o cliente já praticou algum tipo de treino (Pilates, Yoga, Musculação, etc.), 
   mencione isso nas recomendações e sugira como aproveitar essa experiência!
`;

    // Tool calling para JSON estruturado
    const tools = [{
      type: "function",
      function: {
        name: "suggest_workout",
        description: "Retorna sugestões estruturadas de treino baseadas na anamnese do cliente",
        parameters: {
          type: "object",
          properties: {
            overview: {
              type: "string",
              description: "Parecer geral sobre o perfil do cliente analisado (2-3 frases). Mencione o objetivo principal, nível atual e contextualize que as recomendações a seguir serão usadas na montagem do treino."
            },
            sessions: {
              type: "string",
              description: "Descrição de quantas sessões semanais e duração de cada uma (ex: '3 sessões de 50min por semana', '5x/semana com 45min cada')"
            },
            recommendations: {
              type: "array",
              items: { type: "string" },
              description: "Lista de até 5 recomendações priorizadas. Use ícones: 🔥 para obrigatórias (exercícios/grupos musculares essenciais), ⚡ para ajustes de intensidade/volume, ⚠️ para cuidados com restrições/dores, 💡 para sugestões gerais",
              maxItems: 5
            }
          },
          required: ["overview", "sessions", "recommendations"],
          additionalProperties: false
        }
      }
    }];

    // Buscar OpenAI API Key
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      console.error('OPENAI_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de IA não disponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Chamar OpenAI API
    console.log('Chamando OpenAI API para gerar sugestões...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        max_completion_tokens: 2500,
        messages: [
          { 
            role: 'system', 
            content: 'Você é personal trainer experiente. Seja direto e objetivo.' 
          },
          { role: 'user', content: prompt }
        ],
        tools: tools,
        tool_choice: { type: "function", function: { name: "suggest_workout" } }
      }),
    });

    // Tratamento de erros da OpenAI
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na OpenAI API:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Erro de autenticação com OpenAI' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar sugestões. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Resposta da OpenAI recebida:', JSON.stringify(data).substring(0, 500));

    // Verificar finish_reason
    const finishReason = data.choices?.[0]?.finish_reason;
    if (finishReason === 'length') {
      console.error('Modelo atingiu limite de tokens. Usage:', data.usage);
      return new Response(
        JSON.stringify({ error: 'IA precisou de mais tokens. Tente novamente ou simplifique a solicitação.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair JSON do tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('Tool call não encontrado. Finish reason:', finishReason);
      console.error('Estrutura da mensagem:', JSON.stringify(data.choices?.[0]?.message || {}).substring(0, 300));
      
      // Fallback: tentar extrair do content se disponível
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          // Tentar parsear JSON do content
          const parsed = JSON.parse(content);
          if (parsed.overview && parsed.sessions && parsed.recommendations) {
            console.log('Sugestões extraídas do content com sucesso');
            return new Response(
              JSON.stringify(parsed),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (e) {
          console.error('Erro ao parsear content:', e);
        }
      }
      
      return new Response(
        JSON.stringify({ error: 'IA não retornou formato esperado. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const suggestions = JSON.parse(toolCall.function.arguments);
    console.log('Sugestões geradas com sucesso via tool calling');

    return new Response(
      JSON.stringify(suggestions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar sugestões:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido ao gerar sugestões' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
