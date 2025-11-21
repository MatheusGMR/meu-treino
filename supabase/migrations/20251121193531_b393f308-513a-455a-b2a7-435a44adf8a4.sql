-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Profissionais podem fazer upload de mídia" ON storage.objects;
DROP POLICY IF EXISTS "Mídias de exercícios são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Profissionais podem atualizar mídia" ON storage.objects;
DROP POLICY IF EXISTS "Profissionais podem deletar mídia" ON storage.objects;

-- Política para upload de mídia (apenas profissionais)
CREATE POLICY "Profissionais podem fazer upload de mídia"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exercise-media' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('personal', 'admin')
  )
);

-- Política para leitura pública
CREATE POLICY "Mídias de exercícios são públicas"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'exercise-media');

-- Política para atualizar mídia (apenas profissionais)
CREATE POLICY "Profissionais podem atualizar mídia"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'exercise-media' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('personal', 'admin')
  )
);

-- Política para deletar mídia (apenas profissionais)
CREATE POLICY "Profissionais podem deletar mídia"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exercise-media' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('personal', 'admin')
  )
);