import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  LIBRARY,
  blockFromExternalId,
  equipmentCodeFromExternalId,
  safetyFromExternalId,
  difficultyFromExternalId,
  inferExerciseGroup,
  inferExerciseType,
} from "./library-data.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: roleCheck } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load all current exercises (name + id + external_id)
    const { data: existing, error: exErr } = await admin
      .from("exercises")
      .select("id, name, external_id");
    if (exErr) throw exErr;

    const byNameLower = new Map<string, { id: string; external_id: string | null }>();
    for (const e of existing ?? []) {
      byNameLower.set(e.name.trim().toLowerCase(), {
        id: e.id,
        external_id: e.external_id,
      });
    }

    let matched = 0;
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const lib of LIBRARY.exercises) {
      const block = blockFromExternalId(lib.external_id);
      const equip = equipmentCodeFromExternalId(lib.external_id);
      const safety = safetyFromExternalId(lib.external_id);
      const dif = difficultyFromExternalId(lib.external_id);

      const update = {
        external_id: lib.external_id,
        safety_level: safety,
        difficulty_code: dif,
        block,
        equipment_code: equip,
        movement: lib.movement,
        variation: lib.variation,
      };

      const found = byNameLower.get(lib.name.trim().toLowerCase());
      if (found) {
        const { error } = await admin
          .from("exercises")
          .update(update)
          .eq("id", found.id);
        if (error) {
          errors.push(`Update ${lib.external_id}: ${error.message}`);
          skipped++;
        } else {
          matched++;
        }
      } else {
        // Insert as new
        const exercise_group = inferExerciseGroup(lib.muscle_group, block);
        const exercise_type = inferExerciseType(block);
        const { error } = await admin.from("exercises").insert({
          name: lib.name,
          exercise_group,
          exercise_type,
          primary_muscle: lib.muscle_group,
          level:
            dif.startsWith("B")
              ? "Iniciante"
              : dif.startsWith("IN")
              ? "Intermediário"
              : "Avançado",
          ...update,
        } as any);
        if (error) {
          errors.push(`Insert ${lib.external_id}: ${error.message}`);
          skipped++;
        } else {
          inserted++;
        }
      }
    }

    // Restrictions: insert into medical_condition_exercise_restrictions
    // Map limitation name -> condition_keyword
    let restrictionsAdded = 0;
    for (const r of LIBRARY.restrictions) {
      const condition_keyword = r.limitation.toLowerCase();
      // Use external_id as the "restricted group" payload entry
      const recommendation = `${r.restriction}${
        r.substitution_id ? ` | Substituir por: ${r.substitution_full}` : ""
      }`;
      const { error } = await admin
        .from("medical_condition_exercise_restrictions")
        .insert({
          condition_keyword,
          severity_level: "moderate",
          restricted_exercise_groups: [r.external_id],
          recommendation,
        } as any);
      if (error) {
        errors.push(`Restriction ${r.external_id}: ${error.message}`);
      } else {
        restrictionsAdded++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        stats: {
          total_exercises: LIBRARY.exercises.length,
          matched,
          inserted,
          skipped,
          restrictions_added: restrictionsAdded,
          errors_sample: errors.slice(0, 10),
          errors_count: errors.length,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("migrate-exercise-library error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
