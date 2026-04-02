
CREATE TABLE public.post_workout_feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  schedule_id UUID REFERENCES public.daily_workout_schedule(id),
  session_id UUID REFERENCES public.sessions(id),
  feedback_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transcription TEXT,
  mood_summary TEXT,
  mood_category TEXT,
  ai_analysis JSONB,
  difficulty_rating TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_workout_feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own feedback" ON public.post_workout_feedbacks
  FOR ALL TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Personals view client feedback" ON public.post_workout_feedbacks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_assignments
      WHERE client_assignments.client_id = post_workout_feedbacks.client_id
        AND client_assignments.personal_id = auth.uid()
        AND client_assignments.status = 'Ativo'::client_status
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );
