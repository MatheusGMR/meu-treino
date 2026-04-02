
-- Table for daily client check-ins (mood, transcription, AI suggestions)
CREATE TABLE public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transcription TEXT,
  mood_summary TEXT,
  ai_suggestions JSONB,
  suggestion_accepted BOOLEAN DEFAULT NULL,
  adapted_session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, checkin_date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own check-ins
CREATE POLICY "Clients manage own checkins"
ON public.daily_checkins
FOR ALL
TO authenticated
USING (client_id = auth.uid())
WITH CHECK (client_id = auth.uid());

-- Personals and admins can view their clients' check-ins
CREATE POLICY "Personals view client checkins"
ON public.daily_checkins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM client_assignments
    WHERE client_assignments.client_id = daily_checkins.client_id
    AND client_assignments.personal_id = auth.uid()
    AND client_assignments.status = 'Ativo'::client_status
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);
