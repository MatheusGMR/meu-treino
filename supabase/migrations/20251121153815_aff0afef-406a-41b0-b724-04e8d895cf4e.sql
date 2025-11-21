-- Corrigir search_path da função remove_new_badge_after_30_days
CREATE OR REPLACE FUNCTION remove_new_badge_after_30_days()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE exercises 
  SET is_new = false 
  WHERE is_new = true AND added_at < now() - interval '30 days';
  
  UPDATE methods 
  SET is_new = false 
  WHERE is_new = true AND added_at < now() - interval '30 days';
  
  UPDATE volumes 
  SET is_new = false 
  WHERE is_new = true AND added_at < now() - interval '30 days';
END;
$$;