-- Enable realtime for profiles table to track anamnesis status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;