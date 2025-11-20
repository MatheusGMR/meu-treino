-- Criar política de INSERT para admins fazerem upload de imagens
CREATE POLICY "Admins podem fazer upload de imagens de tipos corporais"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'body-type-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Criar política de DELETE para admins removerem imagens existentes
CREATE POLICY "Admins podem deletar imagens de tipos corporais"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'body-type-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Criar política de UPDATE para admins atualizarem metadados
CREATE POLICY "Admins podem atualizar imagens de tipos corporais"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'body-type-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'body-type-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);