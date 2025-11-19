-- Criar função para sincronizar condições médicas da anamnese para o perfil
CREATE OR REPLACE FUNCTION sync_medical_conditions_from_anamnesis()
RETURNS TRIGGER AS $$
DECLARE
  conditions_text TEXT := '';
  conditions_array TEXT[] := ARRAY[]::TEXT[];
BEGIN
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

  -- Construir texto final
  IF array_length(conditions_array, 1) > 0 THEN
    conditions_text := array_to_string(conditions_array, '; ');
  ELSE
    conditions_text := NULL;
  END IF;

  -- Atualizar o perfil do cliente
  UPDATE profiles
  SET 
    medical_conditions = conditions_text,
    anamnesis_completed = true,
    anamnesis_last_update = NEW.completed_at,
    updated_at = now()
  WHERE id = NEW.client_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS sync_medical_conditions_trigger ON anamnesis;

CREATE TRIGGER sync_medical_conditions_trigger
  AFTER INSERT OR UPDATE ON anamnesis
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION sync_medical_conditions_from_anamnesis();

COMMENT ON FUNCTION sync_medical_conditions_from_anamnesis() IS 'Sincroniza automaticamente condições médicas da anamnese para o campo medical_conditions do perfil';