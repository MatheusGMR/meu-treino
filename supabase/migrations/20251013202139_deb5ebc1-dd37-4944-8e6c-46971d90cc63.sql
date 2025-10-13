-- Criar tabela de histórico de atribuições
CREATE TABLE IF NOT EXISTS public.assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  old_personal_id UUID,
  new_personal_id UUID,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela assignment_history
ALTER TABLE public.assignment_history ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas admins podem ver histórico
CREATE POLICY "Admins podem ver histórico de atribuições"
ON public.assignment_history
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Apenas admins podem inserir no histórico
CREATE POLICY "Admins podem inserir histórico"
ON public.assignment_history
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Função para registrar mudanças de atribuição
CREATE OR REPLACE FUNCTION public.log_assignment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Registra mudança apenas quando personal_id for alterado
  IF (TG_OP = 'UPDATE' AND OLD.personal_id IS DISTINCT FROM NEW.personal_id) THEN
    INSERT INTO public.assignment_history (
      client_id,
      old_personal_id,
      new_personal_id,
      changed_by
    ) VALUES (
      NEW.client_id,
      OLD.personal_id,
      NEW.personal_id,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para registrar automaticamente mudanças em client_assignments
DROP TRIGGER IF EXISTS assignment_change_log ON public.client_assignments;
CREATE TRIGGER assignment_change_log
AFTER UPDATE ON public.client_assignments
FOR EACH ROW
EXECUTE FUNCTION public.log_assignment_change();

-- Criar view para facilitar consultas administrativas de clientes
CREATE OR REPLACE VIEW public.admin_clients_overview AS
SELECT 
  p.id,
  p.full_name,
  p.phone,
  p.birth_date,
  p.gender,
  p.goals,
  p.medical_conditions,
  p.avatar_url,
  ca.status,
  ca.start_date,
  ca.end_date,
  ca.personal_id,
  ca.notes as assignment_notes,
  pp.full_name as personal_name,
  (SELECT COUNT(*) FROM client_workouts WHERE client_id = p.id) as total_workouts,
  (SELECT COUNT(*) FROM physical_assessments WHERE client_id = p.id) as total_assessments,
  (SELECT COUNT(*) FROM daily_workout_schedule WHERE client_id = p.id AND completed = true) as completed_sessions
FROM profiles p
LEFT JOIN client_assignments ca ON p.id = ca.client_id
LEFT JOIN profiles pp ON ca.personal_id = pp.id
WHERE EXISTS (SELECT 1 FROM user_roles WHERE user_id = p.id AND role = 'client'::app_role);

-- Configurar a view para usar security invoker (usa permissões do usuário que chama)
ALTER VIEW public.admin_clients_overview SET (security_invoker = true);