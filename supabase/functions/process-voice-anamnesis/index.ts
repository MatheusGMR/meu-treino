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
      // Small delay for ElevenLabs to finalize transcript
      await new Promise(r => setTimeout(r, 1500));
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
            content: `Você é um extrator de dados de anamnese. A partir de uma conversa entre um agente de voz (Júnior) e um cliente, extraia os dados estruturados da anamnese. Retorne APENAS um objeto JSON válido, sem markdown, sem código, sem explicações.`
          },
          {
            role: "user",
            content: `Extraia os dados da anamnese desta conversa e retorne um JSON com os seguintes campos (use null para campos não mencionados):

{
  "age": number ou null,
  "gender": string ou null,
  "profession": string ou null,
  "contato": string ou null,
  "daily_sitting_hours": number ou null,
  "peso_kg": number ou null,
  "altura_cm": number ou null,
  "autoimagem": string ou null,
  "regioes_que_deseja_melhorar": array de strings ou null,
  "treina_atualmente": boolean ou null,
  "frequencia_atual": string ou null,
  "tipos_de_treino_feitos": array de strings ou null,
  "time_without_training": string ou null,
  "pain_details": string ou null,
  "escala_dor": number ou null,
  "lesoes": string ou null,
  "cirurgias": string ou null,
  "restricao_medica": string ou null,
  "liberacao_medica": string ou null,
  "pain_locations": array de strings ou null,
  "has_joint_pain": boolean ou null,
  "primary_goal": string ou null,
  "objetivo_secundario": string ou null,
  "prazo": string ou null,
  "prioridade": number ou null,
  "evento_especifico": string ou null,
  "sono_horas": string ou null,
  "alimentacao": string ou null,
  "consumo_agua": string ou null,
  "estresse": string ou null,
  "alcool_cigarro": string ou null,
  "motivacao": string ou null,
  "preferencia_instrucao": string ou null,
  "local_treino": string ou null,
  "tempo_disponivel": string ou null,
  "horario_preferido": string ou null,
  "tipo_treino_preferido": string ou null,
  "comentarios_finais": string ou null
}

Conversa:
${conversationText}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI extraction error:", aiResponse.status, errText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let extractedData: any;

    // Parse JSON from content
    const content = aiData.choices?.[0]?.message?.content || "";
    // Remove markdown code fences if present
    const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      extractedData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Could not extract structured data from AI response");
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
