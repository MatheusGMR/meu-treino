-- Fix security issues: Add search_path to increment_completed_sessions and enable RLS on subscription_plans

-- 1. Update increment_completed_sessions function to include search_path
CREATE OR REPLACE FUNCTION public.increment_completed_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
    UPDATE client_workouts
    SET completed_sessions = completed_sessions + 1
    WHERE id = NEW.client_workout_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Enable RLS on subscription_plans table
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS policies for subscription_plans
-- Everyone can view active subscription plans
CREATE POLICY "Everyone can view active subscription plans"
ON public.subscription_plans
FOR SELECT
USING (active = true);

-- Only admins can manage subscription plans
CREATE POLICY "Admins can manage subscription plans"
ON public.subscription_plans
FOR ALL
USING (has_role(auth.uid(), 'admin'));
