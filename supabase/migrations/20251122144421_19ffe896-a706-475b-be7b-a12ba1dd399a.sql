-- Parte 1: Corrigir trigger SQL para sincronizar goals + medical_conditions
CREATE OR REPLACE FUNCTION sync_medical_conditions_from_anamnesis()
RETURNS TRIGGER AS $$
DECLARE
  conditions_text TEXT := '';
  conditions_array TEXT[] := ARRAY[]::TEXT[];
  goals_text TEXT := '';
  goals_array TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- ========== MEDICAL CONDITIONS (já existente) ==========
  -- Extrair dores articulares
  IF NEW.has_joint_pain = true AND NEW.pain_locations IS NOT NULL AND array_length(NEW.pain_locations, 1) > 0 THEN
    conditions_array := array_cat(conditions_array, ARRAY['Dor articular em: ' || array_to_string(NEW.pain_locations, ', ')]);
    
    IF NEW.pain_details IS NOT NULL AND NEW.pain_details != '' THEN
      conditions_array := array_append(conditions_array, 'Detalhes da dor: ' || NEW.pain_details);
    END IF;
  END IF;

  -- Extrair lesões ou cirurgias
  IF NEW.has_injury_or_surgery = true THEN
    IF NEW.injury_type IS NOT NULL AND NEW.injury_type != '' THEN
      conditions_array := array_append(conditions_array, 'Lesão/Cirurgia: ' || NEW.injury_type);
    END IF;
    
    IF NEW.injury_details IS NOT NULL AND NEW.injury_details != '' THEN
      conditions_array := array_append(conditions_array, 'Detalhes da lesão: ' || NEW.injury_details);
    END IF;
  END IF;

  -- Extrair restrições médicas
  IF NEW.medical_restrictions IS NOT NULL AND array_length(NEW.medical_restrictions, 1) > 0 THEN
    conditions_array := array_cat(conditions_array, ARRAY['Restrições médicas: ' || array_to_string(NEW.medical_restrictions, ', ')]);
    
    IF NEW.medical_restrictions_details IS NOT NULL AND NEW.medical_restrictions_details != '' THEN
      conditions_array := array_append(conditions_array, 'Detalhes: ' || NEW.medical_restrictions_details);
    END IF;
  END IF;

  -- Construir texto de medical_conditions
  IF array_length(conditions_array, 1) > 0 THEN
    conditions_text := array_to_string(conditions_array, '; ');
  ELSE
    conditions_text := NULL;
  END IF;

  -- ========== GOALS (NOVO!) ==========
  -- Extrair objetivo principal
  IF NEW.primary_goal IS NOT NULL AND NEW.primary_goal != '' THEN
    goals_array := array_append(goals_array, 'Principal: ' || NEW.primary_goal);
  END IF;

  -- Extrair objetivos secundários
  IF NEW.secondary_goals IS NOT NULL AND array_length(NEW.secondary_goals, 1) > 0 THEN
    goals_array := array_append(goals_array, 'Secundários: ' || array_to_string(NEW.secondary_goals, ', '));
  END IF;

  -- Extrair biotipo desejado
  IF NEW.desired_body_type IS NOT NULL THEN
    goals_array := array_append(goals_array, 'Biotipo desejado: ' || NEW.desired_body_type::TEXT);
  END IF;

  -- Extrair prazo
  IF NEW.prazo IS NOT NULL AND NEW.prazo != '' THEN
    goals_array := array_append(goals_array, 'Prazo: ' || NEW.prazo);
  END IF;

  -- Extrair regiões que deseja melhorar
  IF NEW.regioes_que_deseja_melhorar IS NOT NULL AND array_length(NEW.regioes_que_deseja_melhorar, 1) > 0 THEN
    goals_array := array_append(goals_array, 'Focar em: ' || array_to_string(NEW.regioes_que_deseja_melhorar, ', '));
  END IF;

  -- Construir texto de goals
  IF array_length(goals_array, 1) > 0 THEN
    goals_text := array_to_string(goals_array, E'\n');
  ELSE
    goals_text := NULL;
  END IF;

  -- ========== ATUALIZAR PROFILE (MODIFICADO) ==========
  UPDATE profiles
  SET 
    medical_conditions = conditions_text,
    goals = goals_text,  -- ✅ NOVO: sincronizar goals
    anamnesis_completed = true,
    anamnesis_last_update = NEW.completed_at,
    updated_at = now()
  WHERE id = NEW.client_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Parte 2: Re-processar clientes existentes automaticamente
-- Criar função temporária para re-processar
CREATE OR REPLACE FUNCTION reprocess_existing_anamnesis()
RETURNS void AS $$
DECLARE
  anamnesis_record RECORD;
BEGIN
  -- Para cada anamnese completa, forçar UPDATE para trigger executar
  FOR anamnesis_record IN 
    SELECT * FROM anamnesis WHERE completed_at IS NOT NULL
  LOOP
    -- Force trigger re-execution by updating updated_at
    UPDATE anamnesis 
    SET updated_at = now() 
    WHERE id = anamnesis_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar re-processamento
SELECT reprocess_existing_anamnesis();

-- Limpar função temporária
DROP FUNCTION reprocess_existing_anamnesis();