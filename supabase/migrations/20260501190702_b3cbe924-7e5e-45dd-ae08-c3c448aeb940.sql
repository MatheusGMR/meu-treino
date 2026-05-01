INSERT INTO public.methods (name, reps_min, reps_max, rest_seconds, load_level, cadence_contraction, cadence_pause, cadence_stretch, reps_description, risk_level, energy_cost)
SELECT 'Padrão Mobilidade', 8, 12, 30, 'Baixa', 2, 1, 2, '8 a 12 repetições controladas', 'Baixo risco', 'Baixo'
WHERE NOT EXISTS (SELECT 1 FROM public.methods);

INSERT INTO public.volumes (name, num_series, num_exercises, series_min, series_max, exercise_min, exercise_max, weekly_volume_description)
SELECT 'Padrão Mobilidade', 3, 6, 2, 4, 4, 8, 'Volume leve para sessões de mobilidade e bem-estar'
WHERE NOT EXISTS (SELECT 1 FROM public.volumes);