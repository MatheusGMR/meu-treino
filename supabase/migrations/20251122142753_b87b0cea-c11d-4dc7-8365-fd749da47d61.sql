-- Corrigir usuários que foram criados com role 'client' mas deveriam ser 'personal'
-- Essa migration corrige profissionais que foram cadastrados incorretamente

-- 1. Atualizar Junio Melo (criado recentemente como client)
UPDATE user_roles 
SET role = 'personal'
WHERE user_id = '332fa79c-a7e7-4b6f-8d7b-dc904b88c57e'
  AND role = 'client';

-- 2. Adicionar role 'personal' para usuários que não têm role definida
-- Estes usuários foram criados mas o trigger não inseriu role corretamente
INSERT INTO user_roles (user_id, role)
SELECT id, 'personal'::app_role
FROM profiles
WHERE id IN (
  '91b23148-510a-4f61-b53b-193d789bb5ff', -- Juana Bela
  '850dcffd-96f9-49c3-a3b1-4e36ca801ba3', -- Maria das Glórias
  '0f06d00f-985d-48d4-8103-7440985c7188'  -- João Pedro
)
  AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = profiles.id
  )
ON CONFLICT (user_id, role) DO NOTHING;