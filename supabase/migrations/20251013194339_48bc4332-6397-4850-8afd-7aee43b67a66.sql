-- Ajustar política RLS para permitir criação de client_assignments
-- Esta política permite que personals criem assignments E que o próprio cliente seja auto-atribuído
DROP POLICY IF EXISTS "Personals podem criar relacionamentos" ON client_assignments;

CREATE POLICY "Personals podem criar relacionamentos" 
ON client_assignments 
FOR INSERT 
WITH CHECK (
  personal_id = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (client_id = auth.uid() AND has_role(auth.uid(), 'client'::app_role))
);