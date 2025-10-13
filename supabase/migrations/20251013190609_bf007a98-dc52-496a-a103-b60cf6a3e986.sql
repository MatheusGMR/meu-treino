-- Fase 1: Correção da estrutura do banco de dados

-- 1.1 Adicionar campos faltantes em profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS emergency_phone text,
ADD COLUMN IF NOT EXISTS medical_conditions text,
ADD COLUMN IF NOT EXISTS goals text,
ADD COLUMN IF NOT EXISTS notes text;

-- 1.2 Atualizar foreign keys para referenciar profiles ao invés de auth.users
-- Primeiro, remover constraints antigas e adicionar novas

-- client_assignments
ALTER TABLE public.client_assignments
DROP CONSTRAINT IF EXISTS client_assignments_personal_id_fkey,
DROP CONSTRAINT IF EXISTS client_assignments_client_id_fkey;

ALTER TABLE public.client_assignments
ADD CONSTRAINT client_assignments_personal_id_fkey 
  FOREIGN KEY (personal_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT client_assignments_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- client_workouts
ALTER TABLE public.client_workouts
DROP CONSTRAINT IF EXISTS client_workouts_client_id_fkey,
DROP CONSTRAINT IF EXISTS client_workouts_assigned_by_fkey;

ALTER TABLE public.client_workouts
ADD CONSTRAINT client_workouts_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT client_workouts_assigned_by_fkey 
  FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- physical_assessments
ALTER TABLE public.physical_assessments
DROP CONSTRAINT IF EXISTS physical_assessments_client_id_fkey,
DROP CONSTRAINT IF EXISTS physical_assessments_assessed_by_fkey;

ALTER TABLE public.physical_assessments
ADD CONSTRAINT physical_assessments_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT physical_assessments_assessed_by_fkey 
  FOREIGN KEY (assessed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 1.3 Atualizar RLS policies em profiles

-- Remover policies antigas
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;

-- Criar novas policies
CREATE POLICY "Personals veem clientes atribuídos"
ON public.profiles FOR SELECT
USING (
  id = auth.uid() 
  OR id IN (
    SELECT client_id FROM public.client_assignments
    WHERE personal_id = auth.uid()
  )
  OR id IN (
    SELECT personal_id FROM public.client_assignments
    WHERE client_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Usuários atualizam próprio perfil"
ON public.profiles FOR UPDATE
USING (id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Personals atualizam perfis de clientes"
ON public.profiles FOR UPDATE
USING (
  id IN (
    SELECT client_id FROM public.client_assignments
    WHERE personal_id = auth.uid() AND status = 'Ativo'::client_status
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);