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
    const startTime = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔬 Iniciando pesquisa semanal de atualizações...');

    // Timeout de 50 segundos para toda a operação
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);

    // Pesquisar literatura científica recente (ajustado para 2023-2024)
    const searchQueries = [
      {
        type: 'exercise',
        query: 'recent exercise variations biomechanics 2023 2024 strength training',
        category: 'exercise_research'
      },
      {
        type: 'method',
        query: 'latest training methods hypertrophy rest intervals research findings',
        category: 'method_research'
      },
      {
        type: 'volume',
        query: 'training volume muscle growth weekly sets recent studies',
        category: 'volume_research'
      }
    ];

    // Função para processar uma única query
    const processQuery = async (searchQuery: typeof searchQueries[0]) => {
      const queryStartTime = Date.now();
      console.log(`🔍 Pesquisando: ${searchQuery.query}`);

      try {
        // ETAPA 1: Usar GPT-4o para buscar artigos científicos
        console.log('🌐 Buscando artigos científicos com GPT-4o...');
        const searchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: 'You are a scientific research assistant. Search your knowledge base for recent developments in exercise science and training methods from 2023-2024. Cite specific studies, journals, and researchers when possible.'
              },
              {
                role: 'user',
                content: `Search for recent scientific findings about: "${searchQuery.query}". 
              
List 3-5 recent discoveries or studies with:
- Specific study names or titles
- Key findings with numbers/percentages
- Researcher names or institutions
- Journal names (e.g., Journal of Strength Research, Sports Medicine)
- Year of publication

Focus on peer-reviewed research and evidence-based findings.`
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          }),
          signal: controller.signal
        });

        let articlesContext = '';
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          articlesContext = searchData.choices?.[0]?.message?.content || '';
          console.log(`📚 Contexto científico obtido (${articlesContext.length} chars)`);
        } else {
          console.warn('⚠️ Erro ao obter contexto científico');
          articlesContext = `Analise com base em conhecimento científico geral sobre: ${searchQuery.query}`;
        }

        // ETAPA 2: Usar GPT-4o para analisar e extrair dados estruturados
        console.log('🤖 Extraindo atualizações estruturadas...');
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
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
                content: `Aqui estão artigos científicos recentes encontrados:

${articlesContext}

Com base nestes artigos, extraia 2-3 atualizações mais relevantes sobre ${searchQuery.type === 'exercise' ? 'exercícios' : searchQuery.type === 'method' ? 'métodos de treinamento' : 'volumes de treino'}.

Para cada item:
- Use o nome/título do exercício/método mencionado no artigo
- Inclua descobertas científicas específicas (números, percentuais, resultados)
- Cite a fonte original do artigo
- Atribua score de confiança baseado na qualidade da fonte (journals peer-reviewed = 0.8-1.0, preprints = 0.6-0.7)

Retorne no formato JSON especificado.`
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
            tool_choice: { type: 'function', function: { name: 'extract_updates' } },
            max_tokens: 1500,
            temperature: 0.5
          }),
          signal: controller.signal
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`❌ Erro na API OpenAI: ${aiResponse.status} - ${errorText}`);
          return [];
        }

        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        
        if (toolCall?.function?.arguments) {
          const extractedData = JSON.parse(toolCall.function.arguments);
          const updates = extractedData.updates || [];

          const queryDuration = Date.now() - queryStartTime;
          console.log(`✅ Encontrados ${updates.length} itens para ${searchQuery.type} (${queryDuration}ms)`);
          
          if (updates.length === 0) {
            console.warn(`⚠️ Nenhuma atualização extraída para ${searchQuery.type}`);
          }

          // Preparar dados para inserção
          return updates
            .filter((update: any) => update.confidence >= 0.7)
            .map((update: any) => ({
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
            }));
        }

        return [];
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(`⏱️ Timeout na pesquisa: ${searchQuery.type}`);
        } else {
          console.error(`❌ Erro ao processar ${searchQuery.type}:`, error);
        }
        return [];
      }
    };

    // Executar todas as pesquisas em paralelo
    console.log('🚀 Executando pesquisas em paralelo...');
    const results = await Promise.all(searchQueries.map(processQuery));
    clearTimeout(timeoutId);

    // Combinar todos os resultados
    const allUpdates = results.flat();
    const totalDuration = Date.now() - startTime;
    console.log(`⏱️ Pesquisa concluída em ${totalDuration}ms`)

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
