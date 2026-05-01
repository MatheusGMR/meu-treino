CREATE OR REPLACE FUNCTION public.select_session_exercises(
  _client_id uuid,
  _sessao_num integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anamnesis record;
  v_progress record;
  v_checkin record;
  v_output record;
  v_pain_region public.pain_region_enum;
  v_pain_first text;
  v_dor_locals text[];
  v_treino public.treino_letra_enum;
  v_bloco integer;
  v_sessao integer;
  v_nivel public.nivel_experiencia_enum;
  v_safety_max public.safety_level_enum;
  v_decisions text[] := ARRAY[]::text[];
  v_mob_ids uuid[] := ARRAY[]::uuid[];
  v_fort_ids uuid[] := ARRAY[]::uuid[];
  v_resist jsonb := '[]'::jsonb;
  v_along_ids uuid[] := ARRAY[]::uuid[];
  v_temp_ids uuid[];
  v_n_ex integer;
  v_n_series integer;
  v_strategy text;
  v_remove_pai_local boolean;
  v_remove_sub_local boolean;
  v_local_qty integer;
  v_base_fixos integer;
  v_iniciante_fixos integer;
  v_dor_qty integer;
  v_musc_qty integer;
  v_single_local text;
  v_single_region public.pain_region_enum;
BEGIN
  SELECT * INTO v_anamnesis
  FROM anamnesis WHERE client_id = _client_id
  ORDER BY completed_at DESC NULLS LAST LIMIT 1;
  IF v_anamnesis IS NULL THEN
    RETURN jsonb_build_object('error','sem_anamnesis','client_id',_client_id);
  END IF;

  v_dor_locals := COALESCE(v_anamnesis.dor_local, ARRAY[]::text[]);
  v_pain_first := CASE
    WHEN v_dor_locals IS NULL OR array_length(v_dor_locals,1) IS NULL THEN 'L0'
    WHEN array_length(v_dor_locals,1) > 1 THEN 'L_MULTI'
    ELSE upper(v_dor_locals[1])
  END;
  IF v_pain_first NOT IN ('L0','L1','L2','L3','L_MULTI') THEN
    v_pain_first := 'L0';
  END IF;
  v_pain_region := v_pain_first::pain_region_enum;
  v_nivel := COALESCE(v_anamnesis.nivel_experiencia_norm, 'iniciante'::nivel_experiencia_enum);

  SELECT * INTO v_progress
  FROM client_protocol_progress WHERE client_id = _client_id;
  v_sessao := COALESCE(_sessao_num, COALESCE(v_progress.sessao_atual, 0) + 1);
  v_bloco := COALESCE(v_progress.bloco_atual, 1);
  v_treino := CASE WHEN v_sessao % 2 = 1 THEN 'A'::treino_letra_enum ELSE 'B'::treino_letra_enum END;

  SELECT * INTO v_checkin
  FROM daily_checkin_sessions
  WHERE client_id = _client_id
  ORDER BY checkin_date DESC, created_at DESC LIMIT 1;
  IF v_checkin IS NULL THEN
    v_checkin.tempo_cat := 'T2';
    v_checkin.dor_cat_dia := 'D0';
    v_checkin.disposicao := 'OK';
  END IF;

  IF v_checkin.dor_cat_dia = 'D3' THEN
    SELECT * INTO v_output FROM volume_outputs
    WHERE tempo_cat = v_checkin.tempo_cat AND dor_cat = 'D3' AND active = true LIMIT 1;
  ELSE
    SELECT * INTO v_output FROM volume_outputs
    WHERE tempo_cat = v_checkin.tempo_cat
      AND dor_cat = v_checkin.dor_cat_dia
      AND disposicao = COALESCE(v_checkin.disposicao,'OK'::disposicao_categoria)
      AND active = true LIMIT 1;
  END IF;
  IF v_output IS NULL THEN
    RETURN jsonb_build_object('error','output_nao_encontrado',
      'tempo',v_checkin.tempo_cat,'dor',v_checkin.dor_cat_dia,'disposicao',v_checkin.disposicao);
  END IF;

  v_decisions := array_append(v_decisions,
    format('Output %s · T=%s D=%s Disp=%s · Bloco %s · Treino %s · Sessão %s · Local=%s · Nível=%s',
      v_output.output_id, v_checkin.tempo_cat, v_checkin.dor_cat_dia, v_checkin.disposicao,
      v_bloco, v_treino, v_sessao, v_pain_region, v_nivel));

  v_safety_max := CASE COALESCE(v_anamnesis.ins_cat::text,'I3')
    WHEN 'I1' THEN 'S2'
    WHEN 'I2' THEN 'S2'
    ELSE 'S1'
  END::safety_level_enum;

  v_decisions := array_append(v_decisions,
    format('Safety: ins_cat=%s → max=%s (diretriz JMP: I1=S2, I2=S2, I3=S1)',
      v_anamnesis.ins_cat, v_safety_max));

  -- MOBILIDADE
  v_base_fixos := COALESCE((v_output.mob_rule->>'base_fixos')::int, 3);
  v_local_qty  := COALESCE((v_output.mob_rule->>'local_qty')::int, 0);

  SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
    SELECT id FROM exercises
    WHERE block = 'MOB' AND is_fixed_base = true
      AND (treino_letra IS NULL OR treino_letra = v_treino)
    ORDER BY created_at LIMIT v_base_fixos
  ) s;
  v_mob_ids := COALESCE(v_temp_ids, ARRAY[]::uuid[]);

  IF v_local_qty > 0 THEN
    IF v_pain_region = 'L_MULTI' THEN
      FOREACH v_single_local IN ARRAY v_dor_locals LOOP
        v_single_local := upper(v_single_local);
        IF v_single_local IN ('L1','L2','L3') THEN
          v_single_region := v_single_local::pain_region_enum;
          SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
            SELECT id FROM exercises
            WHERE block = 'MOB' AND is_fixed_base = false
              AND pain_region = v_single_region
              AND id != ALL(v_mob_ids)
            ORDER BY created_at LIMIT v_local_qty
          ) s;
          v_mob_ids := v_mob_ids || COALESCE(v_temp_ids, ARRAY[]::uuid[]);
        END IF;
      END LOOP;
      v_decisions := array_append(v_decisions,
        format('MOB: %s base + %s por dor × %s locais (L_MULTI=%s)',
          v_base_fixos, v_local_qty, array_length(v_dor_locals,1), array_to_string(v_dor_locals,',')));
    ELSIF v_pain_region NOT IN ('L0') THEN
      SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
        SELECT id FROM exercises
        WHERE block = 'MOB' AND is_fixed_base = false
          AND pain_region = v_pain_region
        ORDER BY created_at LIMIT v_local_qty
      ) s;
      v_mob_ids := v_mob_ids || COALESCE(v_temp_ids, ARRAY[]::uuid[]);
      v_decisions := array_append(v_decisions, format('MOB: %s base + %s por dor (%s)', v_base_fixos, v_local_qty, v_pain_region));
    ELSE
      v_decisions := array_append(v_decisions, format('MOB: %s base (sem dor)', v_base_fixos));
    END IF;
  ELSE
    v_decisions := array_append(v_decisions, format('MOB: %s base (local_qty=0 no output)', v_base_fixos));
  END IF;

  -- FORTALECIMENTO
  v_iniciante_fixos := COALESCE((v_output.fort_rule->>'iniciante_fixos')::int, 3);
  v_local_qty  := COALESCE((v_output.fort_rule->>'local_qty')::int, 0);

  IF v_nivel = 'iniciante' THEN
    SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
      SELECT id FROM exercises
      WHERE block = 'FORT' AND is_fixed_base = true
        AND (treino_letra IS NULL OR treino_letra = v_treino)
      ORDER BY created_at LIMIT v_iniciante_fixos
    ) s;
    v_fort_ids := COALESCE(v_temp_ids, ARRAY[]::uuid[]);

    IF v_local_qty > 0 AND v_checkin.dor_cat_dia <> 'D0' THEN
      IF v_pain_region = 'L_MULTI' THEN
        FOREACH v_single_local IN ARRAY v_dor_locals LOOP
          v_single_local := upper(v_single_local);
          IF v_single_local IN ('L1','L2','L3') THEN
            v_single_region := v_single_local::pain_region_enum;
            SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
              SELECT id FROM exercises
              WHERE block = 'FORT' AND is_fixed_base = false
                AND pain_region = v_single_region
                AND id != ALL(v_fort_ids)
              ORDER BY created_at LIMIT v_local_qty
            ) s;
            v_fort_ids := v_fort_ids || COALESCE(v_temp_ids, ARRAY[]::uuid[]);
          END IF;
        END LOOP;
      ELSIF v_pain_region NOT IN ('L0') THEN
        SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
          SELECT id FROM exercises
          WHERE block = 'FORT' AND is_fixed_base = false AND pain_region = v_pain_region
          ORDER BY created_at LIMIT v_local_qty
        ) s;
        v_fort_ids := v_fort_ids || COALESCE(v_temp_ids, ARRAY[]::uuid[]);
      END IF;
    END IF;
    v_decisions := array_append(v_decisions, format('FORT iniciante: %s base + %s dor', v_iniciante_fixos, v_local_qty));
  ELSE
    IF v_checkin.dor_cat_dia <> 'D0' AND v_local_qty > 0 THEN
      IF v_pain_region = 'L_MULTI' THEN
        FOREACH v_single_local IN ARRAY v_dor_locals LOOP
          v_single_local := upper(v_single_local);
          IF v_single_local IN ('L1','L2','L3') THEN
            v_single_region := v_single_local::pain_region_enum;
            SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
              SELECT id FROM exercises
              WHERE block = 'FORT' AND pain_region = v_single_region
                AND id != ALL(v_fort_ids)
              ORDER BY created_at LIMIT v_local_qty
            ) s;
            v_fort_ids := v_fort_ids || COALESCE(v_temp_ids, ARRAY[]::uuid[]);
          END IF;
        END LOOP;
        v_decisions := array_append(v_decisions, format('FORT %s: dor L_MULTI (%s locais)', v_nivel, array_length(v_dor_locals,1)));
      ELSIF v_pain_region NOT IN ('L0') THEN
        SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
          SELECT id FROM exercises
          WHERE block = 'FORT' AND pain_region = v_pain_region
          ORDER BY created_at LIMIT v_local_qty
        ) s;
        v_fort_ids := COALESCE(v_temp_ids, ARRAY[]::uuid[]);
        v_decisions := array_append(v_decisions, format('FORT %s: só dor (%s)', v_nivel, v_local_qty));
      END IF;
    ELSE
      v_decisions := array_append(v_decisions, format('FORT %s: vazio (D0 ou sem local)', v_nivel));
    END IF;
  END IF;

  -- RESISTIDO
  v_strategy := COALESCE(v_output.resist_rule->>'strategy','PAI');
  v_remove_pai_local := COALESCE((v_output.resist_rule->>'remove_pai_local')::bool, false);
  v_remove_sub_local := COALESCE((v_output.resist_rule->>'remove_sub_local')::bool, false);
  v_n_ex := v_output.n_ex_max;
  v_n_series := v_output.series_max;

  WITH base AS (
    SELECT id, name, kind, pain_region AS ex_pain_region, parent_exercise_id, is_primary
    FROM exercises
    WHERE protocol_only = true
      AND bloco_protocolo = v_bloco
      AND treino_letra = v_treino
      AND (safety_level IS NULL OR safety_level <= v_safety_max)
  ),
  filtered AS (
    SELECT * FROM base
    WHERE
      CASE
        WHEN v_strategy = 'REMOVE_LOCAL' AND v_pain_region = 'L_MULTI' THEN
          NOT (ex_pain_region IS NOT NULL AND ex_pain_region::text = ANY(
            (SELECT array_agg(upper(x)) FROM unnest(v_dor_locals) x)
          ))
        WHEN v_strategy = 'REMOVE_LOCAL' THEN
          ex_pain_region IS NULL OR ex_pain_region <> v_pain_region
        ELSE true
      END
      AND NOT (v_remove_pai_local AND kind = 'PAI' AND (
        CASE WHEN v_pain_region = 'L_MULTI' THEN
          ex_pain_region::text = ANY((SELECT array_agg(upper(x)) FROM unnest(v_dor_locals) x))
        ELSE ex_pain_region = v_pain_region END
      ))
      AND NOT (v_remove_sub_local AND kind = 'SUB' AND (
        CASE WHEN v_pain_region = 'L_MULTI' THEN
          ex_pain_region::text = ANY((SELECT array_agg(upper(x)) FROM unnest(v_dor_locals) x))
        ELSE ex_pain_region = v_pain_region END
      ))
  ),
  ranked AS (
    SELECT id, name,
      CASE
        WHEN v_strategy IN ('SUB_PRIORITY','SUB_MANDATORY')
             AND kind = 'SUB' AND (
               CASE WHEN v_pain_region = 'L_MULTI' THEN
                 ex_pain_region::text = ANY((SELECT array_agg(upper(x)) FROM unnest(v_dor_locals) x))
               ELSE ex_pain_region = v_pain_region END
             ) THEN 1
        WHEN v_strategy = 'PAI' AND kind = 'PAI' THEN 1
        WHEN is_primary = true THEN 2
        WHEN kind = 'PAI' THEN 3
        ELSE 4
      END AS rank_order
    FROM filtered
  )
  SELECT jsonb_agg(jsonb_build_object(
    'exercise_id', id, 'name', name,
    'series_min', v_output.series_min,
    'series_max', v_output.series_max,
    'reps', v_output.reps
  ) ORDER BY rank_order, name)
  INTO v_resist
  FROM (SELECT * FROM ranked ORDER BY rank_order, name LIMIT v_n_ex) sel;

  v_resist := COALESCE(v_resist, '[]'::jsonb);
  v_decisions := array_append(v_decisions,
    format('RESIST: estratégia=%s · n_ex=%s · séries=%s-%s · D3=cirúrgico (remove só local de dor)',
      v_strategy, v_n_ex, v_output.series_min, v_output.series_max));

  -- ALONGAMENTO
  v_dor_qty := COALESCE((v_output.along_rule->>'dor_qty')::int, 0);
  v_musc_qty := COALESCE((v_output.along_rule->>'musculatura_treinada')::int, 0);

  IF v_dor_qty > 0 THEN
    IF v_pain_region = 'L_MULTI' THEN
      FOREACH v_single_local IN ARRAY v_dor_locals LOOP
        v_single_local := upper(v_single_local);
        IF v_single_local IN ('L1','L2','L3') THEN
          v_single_region := v_single_local::pain_region_enum;
          SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
            SELECT id FROM exercises
            WHERE block = 'ALONG' AND pain_region = v_single_region
              AND id != ALL(v_along_ids)
            ORDER BY created_at LIMIT v_dor_qty
          ) s;
          v_along_ids := v_along_ids || COALESCE(v_temp_ids, ARRAY[]::uuid[]);
        END IF;
      END LOOP;
      v_decisions := array_append(v_decisions,
        format('ALONG: dor L_MULTI (%s locais × %s qty)', array_length(v_dor_locals,1), v_dor_qty));
    ELSIF v_pain_region NOT IN ('L0') THEN
      SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
        SELECT id FROM exercises
        WHERE block = 'ALONG' AND pain_region = v_pain_region
        ORDER BY created_at LIMIT v_dor_qty
      ) s;
      v_along_ids := COALESCE(v_temp_ids, ARRAY[]::uuid[]);
    END IF;
  END IF;

  IF v_musc_qty > 0 THEN
    SELECT ARRAY_AGG(id) INTO v_temp_ids FROM (
      SELECT id FROM exercises
      WHERE block = 'ALONG'
        AND (treino_letra IS NULL OR treino_letra = v_treino)
        AND (pain_region IS NULL OR pain_region NOT IN ('L1','L2','L3'))
        AND id != ALL(v_along_ids)
      ORDER BY created_at LIMIT v_musc_qty
    ) s;
    v_along_ids := v_along_ids || COALESCE(v_temp_ids, ARRAY[]::uuid[]);
  END IF;
  v_decisions := array_append(v_decisions, format('ALONG: %s dor + %s musc', v_dor_qty, v_musc_qty));

  RETURN jsonb_build_object(
    'output_id', v_output.output_id,
    'sessao_num', v_sessao,
    'bloco', v_bloco,
    'treino_letra', v_treino,
    'tempo_cat', v_checkin.tempo_cat,
    'dor_cat', v_checkin.dor_cat_dia,
    'disposicao', v_checkin.disposicao,
    'pain_region', v_pain_region,
    'dor_locals', to_jsonb(v_dor_locals),
    'ins_cat', v_anamnesis.ins_cat,
    'nivel_experiencia', v_nivel,
    'safety_max', v_safety_max,
    'reps', v_output.reps,
    'series', jsonb_build_object('min', v_output.series_min, 'max', v_output.series_max),
    'n_exercicios', jsonb_build_object('min', v_output.n_ex_min, 'max', v_output.n_ex_max),
    'mobilidade', (SELECT jsonb_agg(jsonb_build_object('exercise_id',e.id,'name',e.name)) FROM exercises e WHERE e.id = ANY(v_mob_ids)),
    'fortalecimento', (SELECT jsonb_agg(jsonb_build_object('exercise_id',e.id,'name',e.name)) FROM exercises e WHERE e.id = ANY(v_fort_ids)),
    'resistido', v_resist,
    'alongamento', (SELECT jsonb_agg(jsonb_build_object('exercise_id',e.id,'name',e.name)) FROM exercises e WHERE e.id = ANY(v_along_ids)),
    'decisions', to_jsonb(v_decisions),
    'modo_d3', v_output.modo_d3
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.select_session_exercises(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.select_session_exercises(uuid, integer) TO authenticated;