-- Fix 1: personal_subscriptions UPDATE policy - restrict from USING (true) to admin-only
-- Stripe webhooks use service_role_key which bypasses RLS, so no need for open UPDATE
DROP POLICY IF EXISTS "Sistema atualiza assinaturas" ON public.personal_subscriptions;
CREATE POLICY "Sistema atualiza assinaturas"
ON public.personal_subscriptions
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: profiles SELECT - tighten to require active assignment status
DROP POLICY IF EXISTS "Personals veem clientes atribuídos" ON public.profiles;
CREATE POLICY "Personals veem clientes atribuídos"
ON public.profiles
FOR SELECT
TO public
USING (
  (id = auth.uid())
  OR (id IN (
    SELECT client_assignments.client_id
    FROM client_assignments
    WHERE client_assignments.personal_id = auth.uid()
      AND client_assignments.status = 'Ativo'::client_status
  ))
  OR (id IN (
    SELECT client_assignments.personal_id
    FROM client_assignments
    WHERE client_assignments.client_id = auth.uid()
      AND client_assignments.status = 'Ativo'::client_status
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);