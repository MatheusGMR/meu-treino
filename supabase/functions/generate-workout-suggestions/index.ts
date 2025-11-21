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

    // Montar prompt estruturado e conciso
    const prompt = `
Analise a anamnese e forneça sugestões de treino:

CLIENTE:
• Objetivo: ${anamnesis.primary_goal || 'Não especificado'}
• Tempo/Sessão: ${anamnesis.tempo_disponivel || 'Não especificado'}
• Dores: ${anamnesis.pain_details || anamnesis.pain_locations?.join(', ') || 'Nenhuma'}
• Restrições: ${anamnesis.medical_restrictions?.join(', ') || 'Nenhuma'}
• Regiões prioritárias: ${anamnesis.regioes_que_deseja_melhorar?.join(', ') || 'Não especificado'}

FORNEÇA:
1. Overview: Resuma perfil e mencione que as recomendações serão usadas no treino
2. Frequência: Quantas sessões/semana e duração
3. Recomendações (max 5): Use 🔥⚡⚠️💡 como ícones
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
