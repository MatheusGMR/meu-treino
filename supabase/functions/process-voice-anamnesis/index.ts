import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchTranscriptFromElevenLabs(conversationId: string, apiKey: string): Promise<Array<{ role: string; content: string }>> {
  console.log("Fetching transcript from ElevenLabs API for conversation:", conversationId);
  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    { headers: { "xi-api-key": apiKey } }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("ElevenLabs conversation fetch error:", response.status, errText);
    return [];
  }

  const data = await response.json();
  const transcript = data.transcript || data.messages || [];

  return transcript.map((entry: any) => ({
    role: entry.role === "agent" ? "assistant" : "user",
    content: entry.message || entry.content || entry.text || "",
  })).filter((m: any) => m.content.trim().length > 0);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transcript, messages, conversationId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    // Determine best source of conversation data
    let clientMessages = messages || [];
    let finalMessages = clientMessages;

    // If client messages are empty/short and we have a conversationId, fetch from ElevenLabs API
    if (clientMessages.length < 2 && conversationId && ELEVENLABS_API_KEY) {
      console.log("Client messages insufficient, fetching from ElevenLabs API...");
      // Wait a bit for ElevenLabs to process the conversation
      await new Promise(r => setTimeout(r, 3000));
      const apiMessages = await fetchTranscriptFromElevenLabs(conversationId, ELEVENLABS_API_KEY);
      if (apiMessages.length > clientMessages.length) {
        finalMessages = apiMessages;
        console.log(`Using ElevenLabs API transcript (${apiMessages.length} messages) instead of client (${clientMessages.length})`);
      }
    }

    if (!transcript && finalMessages.length === 0) {
      return new Response(JSON.stringify({ error: "No transcript data available. Please try again." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the full conversation text
    const conversationText = finalMessages.length > 0
      ? finalMessages.map((m: any) => `${m.role}: ${m.content}`).join("\n")
      : transcript;

    // Use AI to extract structured anamnesis data from the conversation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um extrator de dados de anamnese. A partir de uma conversa entre um agente de voz (Júnior) e um cliente, extraia os dados estruturados da anamnese. Retorne APENAS o JSON, sem markdown.`
          },
          {
            role: "user",
            content: `Extraia os dados da anamnese desta conversa e retorne um JSON com os seguintes campos (use null para campos não mencionados):

{
  "age": number|null,
  "gender": string|null,
  "profession": string|null,
  "contato": string|null,
  "daily_sitting_hours": number|null,
  "peso_kg": number|null,
  "altura_cm": number|null,
  "autoimagem": string|null,
  "regioes_que_deseja_melhorar": string[]|null,
  "treina_atualmente": boolean|null,
  "frequencia_atual": string|null,
  "tipos_de_treino_feitos": string[]|null,
  "time_without_training": string|null,
  "pain_details": string|null,
  "escala_dor": number|null,
  "lesoes": string|null,
  "cirurgias": string|null,
  "restricao_medica": string|null,
  "liberacao_medica": string|null,
  "pain_locations": string[]|null,
  "has_joint_pain": boolean|null,
  "primary_goal": string|null,
  "objetivo_secundario": string|null,
  "prazo": string|null,
  "prioridade": number|null,
  "evento_especifico": string|null,
  "sono_horas": string|null,
  "alimentacao": string|null,
  "consumo_agua": string|null,
  "estresse": string|null,
  "alcool_cigarro": string|null,
  "motivacao": string|null,
  "preferencia_instrucao": string|null,
  "local_treino": string|null,
  "tempo_disponivel": string|null,
  "horario_preferido": string|null,
  "tipo_treino_preferido": string|null,
  "comentarios_finais": string|null
}

Conversa:
${conversationText}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_anamnesis",
              description: "Extract structured anamnesis data from conversation",
              parameters: {
                type: "object",
                properties: {
                  age: { type: ["number", "null"] },
                  gender: { type: ["string", "null"] },
                  profession: { type: ["string", "null"] },
                  contato: { type: ["string", "null"] },
                  daily_sitting_hours: { type: ["number", "null"] },
                  peso_kg: { type: ["number", "null"] },
                  altura_cm: { type: ["number", "null"] },
                  autoimagem: { type: ["string", "null"] },
                  regioes_que_deseja_melhorar: { type: ["array", "null"], items: { type: "string" } },
                  treina_atualmente: { type: ["boolean", "null"] },
                  frequencia_atual: { type: ["string", "null"] },
                  tipos_de_treino_feitos: { type: ["array", "null"], items: { type: "string" } },
                  time_without_training: { type: ["string", "null"] },
                  pain_details: { type: ["string", "null"] },
                  escala_dor: { type: ["number", "null"] },
                  lesoes: { type: ["string", "null"] },
                  cirurgias: { type: ["string", "null"] },
                  restricao_medica: { type: ["string", "null"] },
                  liberacao_medica: { type: ["string", "null"] },
                  pain_locations: { type: ["array", "null"], items: { type: "string" } },
                  has_joint_pain: { type: ["boolean", "null"] },
                  primary_goal: { type: ["string", "null"] },
                  objetivo_secundario: { type: ["string", "null"] },
                  prazo: { type: ["string", "null"] },
                  prioridade: { type: ["number", "null"] },
                  evento_especifico: { type: ["string", "null"] },
                  sono_horas: { type: ["string", "null"] },
                  alimentacao: { type: ["string", "null"] },
                  consumo_agua: { type: ["string", "null"] },
                  estresse: { type: ["string", "null"] },
                  alcool_cigarro: { type: ["string", "null"] },
                  motivacao: { type: ["string", "null"] },
                  preferencia_instrucao: { type: ["string", "null"] },
                  local_treino: { type: ["string", "null"] },
                  tempo_disponivel: { type: ["string", "null"] },
                  horario_preferido: { type: ["string", "null"] },
                  tipo_treino_preferido: { type: ["string", "null"] },
                  comentarios_finais: { type: ["string", "null"] },
                },
                required: [],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_anamnesis" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI extraction error:", aiResponse.status, errText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let extractedData: any;

    // Parse from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      extractedData = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract structured data from AI response");
      }
    }

    console.log("Extracted anamnesis data:", extractedData);

    // Upsert into anamnesis table (allows re-running without duplicates)
    const anamnesisData = {
      client_id: user.id,
      age: extractedData.age || null,
      gender: extractedData.gender || null,
      profession: extractedData.profession || null,
      contato: extractedData.contato || null,
      daily_sitting_hours: extractedData.daily_sitting_hours || null,
      peso_kg: extractedData.peso_kg || null,
      altura_cm: extractedData.altura_cm || null,
      autoimagem: extractedData.autoimagem || null,
      regioes_que_deseja_melhorar: extractedData.regioes_que_deseja_melhorar || null,
      treina_atualmente: extractedData.treina_atualmente ?? false,
      frequencia_atual: extractedData.frequencia_atual || null,
      tipos_de_treino_feitos: extractedData.tipos_de_treino_feitos || null,
      time_without_training: extractedData.time_without_training || null,
      pain_details: extractedData.pain_details || null,
      escala_dor: extractedData.escala_dor || null,
      lesoes: extractedData.lesoes || null,
      cirurgias: extractedData.cirurgias || null,
      restricao_medica: extractedData.restricao_medica || null,
      liberacao_medica: extractedData.liberacao_medica || null,
      pain_locations: extractedData.pain_locations || null,
      has_joint_pain: extractedData.has_joint_pain ?? false,
      primary_goal: extractedData.primary_goal || null,
      objetivo_secundario: extractedData.objetivo_secundario || null,
      prazo: extractedData.prazo || null,
      prioridade: extractedData.prioridade || 3,
      evento_especifico: extractedData.evento_especifico || null,
      sono_horas: extractedData.sono_horas || null,
      alimentacao: extractedData.alimentacao || null,
      consumo_agua: extractedData.consumo_agua || null,
      estresse: extractedData.estresse || null,
      alcool_cigarro: extractedData.alcool_cigarro || null,
      motivacao: extractedData.motivacao || null,
      preferencia_instrucao: extractedData.preferencia_instrucao || null,
      local_treino: extractedData.local_treino || null,
      tempo_disponivel: extractedData.tempo_disponivel || null,
      horario_preferido: extractedData.horario_preferido || null,
      tipo_treino_preferido: extractedData.tipo_treino_preferido || null,
      comentarios_finais: extractedData.comentarios_finais || null,
    };

    // Check if anamnesis already exists for this client
    const { data: existing } = await supabase
      .from("anamnesis")
      .select("id")
      .eq("client_id", user.id)
      .limit(1);

    let anamnesisError;
    if (existing && existing.length > 0) {
      // Update existing
      const { error } = await supabase
        .from("anamnesis")
        .update(anamnesisData)
        .eq("client_id", user.id);
      anamnesisError = error;
    } else {
      // Insert new
      const { error } = await supabase
        .from("anamnesis")
        .insert([anamnesisData]);
      anamnesisError = error;
    }

    if (anamnesisError) {
      console.error("Anamnesis upsert error:", anamnesisError);
      throw anamnesisError;
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        anamnesis_completed: true,
        anamnesis_last_update: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      throw profileError;
    }

    return new Response(
      JSON.stringify({ success: true, extractedData, source: finalMessages === clientMessages ? "client" : "elevenlabs_api" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("process-voice-anamnesis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
