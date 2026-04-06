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
  ))
  OR (id IN (
    SELECT client_assignments.personal_id
    FROM client_assignments
    WHERE client_assignments.client_id = auth.uid()
    AND client_assignments.status = 'Ativo'::client_status
  ))
  OR has_role(auth.uid(), 'admin'::app_role)
);