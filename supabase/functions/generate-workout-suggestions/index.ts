import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Montar prompt estruturado
    const prompt = `
Você é um personal trainer especializado. Analise a anamnese e sugira um plano de treino:

PERFIL DO CLIENTE:
- Objetivo Principal: ${anamnesis.primary_goal || 'Não especificado'}
- Objetivos Secundários: ${anamnesis.secondary_goals?.join(', ') || 'Nenhum'}
- Nível de Atividade: ${anamnesis.activity_level || 'Não especificado'}
- Tempo Disponível por Sessão: ${anamnesis.tempo_disponivel || 'Não especificado'}
- Frequência Atual: ${anamnesis.frequencia_atual || 'Não especificado'}

RESTRIÇÕES E CONDIÇÕES:
- Dores/Desconfortos: ${anamnesis.pain_locations?.join(', ') || 'Nenhuma'}
- Detalhes das Dores: ${anamnesis.pain_details || 'Nenhum'}
- Problemas Articulares: ${anamnesis.has_joint_pain ? 'Sim' : 'Não'}
- Lesões ou Cirurgias: ${anamnesis.injury_details || 'Nenhuma'}
- Restrições Médicas: ${anamnesis.medical_restrictions?.join(', ') || 'Nenhuma'}
- Detalhes Restrições: ${anamnesis.medical_restrictions_details || 'Nenhum'}

ESTILO DE VIDA:
- Horas de Sono: ${anamnesis.sono_horas || 'Não especificado'}
- Nível de Estresse: ${anamnesis.estresse || 'Não especificado'}
- Regiões Prioritárias: ${anamnesis.regioes_que_deseja_melhorar?.join(', ') || 'Não especificado'}
- Tipo de Trabalho: ${anamnesis.work_type || 'Não especificado'}
- Horas Sentado/Dia: ${anamnesis.daily_sitting_hours || 'Não especificado'}

TAREFA:
Forneça sugestões para montar o treino ideal:

1. FREQUÊNCIA E DURAÇÃO: Indique quantas sessões por semana e duração de cada uma
2. RECOMENDAÇÕES (máximo 5 itens priorizados):
   - Use 🔥 para exercícios ou grupos musculares obrigatórios
   - Use ⚡ para ajustes de intensidade/volume
   - Use ⚠️ para cuidados com restrições/dores
   - Use 💡 para sugestões gerais de montagem

Seja direto e prático. Priorize o mais importante.
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
          required: ["sessions", "recommendations"],
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
        max_completion_tokens: 1000,
        messages: [
          { 
            role: 'system', 
            content: 'Você é um personal trainer certificado com 10 anos de experiência em prescrição de exercícios personalizados.' 
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

    // Extrair JSON do tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('Tool call não encontrado. Estrutura da resposta:', JSON.stringify(data.choices?.[0]?.message || {}).substring(0, 300));
      
      // Fallback: tentar extrair do content se disponível
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          // Tentar parsear JSON do content
          const parsed = JSON.parse(content);
          if (parsed.sessions && parsed.recommendations) {
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
        JSON.stringify({ error: 'Formato de resposta inválido da IA' }),
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
