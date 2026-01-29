-- Criar policy DELETE para client_workouts
-- Permite que personals deletem treinos que eles mesmos atribuíram
-- E permite que admins deletem qualquer treino

CREATE POLICY "Personals podem deletar treinos de clientes"
ON public.client_workouts FOR DELETE
USING (
  (assigned_by = auth.uid()) OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);