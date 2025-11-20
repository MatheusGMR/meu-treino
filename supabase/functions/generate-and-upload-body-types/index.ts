import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results: any[] = [];
    const genders = ['Masculino', 'Feminino'];

    // Generate and upload all images (5 types per gender = 10 total)
    for (const gender of genders) {
      const genderFolder = gender === 'Masculino' ? 'male' : 'female';

      for (let bodyType = 1; bodyType <= 5; bodyType++) {
        try {
          const genderLabel = gender === "Masculino" ? "male" : "female";
          const bodyTypeDescriptions: Record<number, string> = {
            1: "lean athletic build with minimal body fat",
            2: "athletic balanced build with defined muscles",
            3: "strong muscular build with significant muscle mass",
            4: "overweight build with excess body fat",
            5: "obese build with substantial excess weight"
          };
          const description = bodyTypeDescriptions[bodyType];
          const prompt = `Simple minimalist illustration of a ${genderLabel} person with ${description}, frontal view, fitness reference chart style, clean white background, anatomically accurate proportions. Professional health assessment style, neutral standing pose.`;

          console.log(`Generating ${gender} type ${bodyType}...`);

          const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-image-1",
              prompt: prompt,
              n: 1,
              size: "1024x1024",
              response_format: "b64_json"
            })
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 401) {
              throw new Error(`Invalid OpenAI API key: ${response.status}`);
            }
            if (response.status === 429) {
              throw new Error(`OpenAI rate limit exceeded: ${response.status}`);
            }
            throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          const base64Image = data.data?.[0]?.b64_json;

          if (!base64Image) {
            throw new Error('No image data returned from OpenAI');
          }

          const imageUrl = `data:image/png;base64,${base64Image}`;

          // Convert base64 to binary
          const base64Data = imageUrl.split(',')[1];
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

          // Upload to storage
          const filePath = `${genderFolder}/type-${bodyType}.png`;
          const { error: uploadError } = await supabase.storage
            .from('body-type-images')
            .upload(filePath, binaryData, {
              contentType: 'image/png',
              upsert: true
            });

          if (uploadError) throw uploadError;

          results.push({
            gender,
            bodyType,
            status: 'success',
            path: filePath
          });

          console.log(`✓ Uploaded ${filePath}`);

        } catch (err) {
          results.push({
            gender,
            bodyType,
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
          console.error(`✗ Failed ${gender} type ${bodyType}:`, err);
        }
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'error').length;

    return new Response(
      JSON.stringify({
        message: `Generation complete: ${successCount} successful, ${failCount} failed`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-and-upload-body-types:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
