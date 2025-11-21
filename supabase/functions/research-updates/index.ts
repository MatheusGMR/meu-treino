import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔬 Iniciando pesquisa semanal de atualizações...');

    // Pesquisar literatura científica recente (últimos 7 dias)
    const searchQueries = [
      {
        type: 'exercise',
        query: 'new exercise variations biomechanics 2025 strength training',
        category: 'exercise_research'
      },
      {
        type: 'method',
        query: 'training methods hypertrophy rest intervals 2025',
        category: 'method_research'
      },
      {
        type: 'volume',
        query: 'training volume muscle growth weekly sets 2025',
        category: 'volume_research'
      }
    ];

    const allUpdates: any[] = [];

    for (const searchQuery of searchQueries) {
      console.log(`🔍 Pesquisando: ${searchQuery.query}`);

      // Usar Lovable AI para analisar e extrair dados estruturados
      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            {
              role: 'system',
              content: `Você é um especialista em ciência do exercício e treinamento físico.
Analise publicações científicas recentes e extraia informações relevantes sobre ${searchQuery.type === 'exercise' ? 'exercícios' : searchQuery.type === 'method' ? 'métodos de treinamento' : 'volumes de treino'}.

Para cada item encontrado, retorne em formato JSON com:
- name: nome em português
- description: descrição breve (máx 200 caracteres)
- details: informações detalhadas
- confidence: score de confiança (0.0 - 1.0)
- source: link da publicação

Retorne apenas itens com confiança >= 0.7 e que sejam realmente novos ou atualizações relevantes.`
            },
            {
              role: 'user',
              content: `Pesquise publicações científicas recentes (últimos 7 dias) sobre: "${searchQuery.query}".
Extraia até 3 itens mais relevantes e retorne no formato JSON especificado.`
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'extract_updates',
                description: 'Extrair atualizações estruturadas da literatura científica',
                parameters: {
                  type: 'object',
                  properties: {
                    updates: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          description: { type: 'string' },
                          details: { type: 'string' },
                          confidence: { type: 'number', minimum: 0, maximum: 1 },
                          source: { type: 'string' }
                        },
                        required: ['name', 'description', 'confidence']
                      }
                    }
                  },
                  required: ['updates']
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'extract_updates' } }
        }),
      });

      if (!aiResponse.ok) {
        console.error(`❌ Erro na API Lovable AI: ${aiResponse.status}`);
        continue;
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        const extractedData = JSON.parse(toolCall.function.arguments);
        const updates = extractedData.updates || [];

        console.log(`✅ Encontrados ${updates.length} itens para ${searchQuery.type}`);

        // Preparar dados para inserção
        for (const update of updates) {
          if (update.confidence >= 0.7) {
            allUpdates.push({
              entity_type: searchQuery.type,
              entity_data: {
                name: update.name,
                short_description: update.description,
                long_description: update.details || update.description,
                ...getTypeSpecificFields(searchQuery.type)
              },
              source_reference: update.source || 'Literatura científica',
              confidence_score: update.confidence,
              review_status: 'pending'
            });
          }
        }
      }
    }

    // Inserir atualizações pendentes no banco
    if (allUpdates.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('pending_updates')
        .insert(allUpdates)
        .select();

      if (insertError) {
        console.error('❌ Erro ao inserir atualizações:', insertError);
        throw insertError;
      }

      console.log(`📥 ${inserted?.length || 0} atualizações inseridas com sucesso`);

      // Notificar admins
      console.log('📧 Notificando administradores...');
      // Aqui você pode adicionar notificação por email/push no futuro
    } else {
      console.log('ℹ️ Nenhuma atualização relevante encontrada nesta semana');
    }

    return new Response(
      JSON.stringify({
        success: true,
        updates_found: allUpdates.length,
        message: `Pesquisa concluída. ${allUpdates.length} atualizações aguardando revisão.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na função research-updates:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function getTypeSpecificFields(type: string) {
  switch (type) {
    case 'exercise':
      return {
        exercise_group: 'Outro',
        exercise_type: 'Musculação',
        level: 'Intermediário'
      };
    case 'method':
      return {
        reps_min: 8,
        reps_max: 12,
        rest_seconds: 60,
        cadence_contraction: 2,
        cadence_pause: 0,
        cadence_stretch: 2,
        load_level: 'Moderado'
      };
    case 'volume':
      return {
        num_series: 3,
        num_exercises: 3
      };
    default:
      return {};
  }
}
