import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { client_workout_id } = await req.json();

    console.log('Scheduling workout sessions for client_workout_id:', client_workout_id);

    // 1. Buscar dados do client_workout
    const { data: clientWorkout, error: workoutError } = await supabaseAdmin
      .from('client_workouts')
      .select('client_id, workout_id, start_date, end_date')
      .eq('id', client_workout_id)
      .single();

    if (workoutError) {
      console.error('Error fetching client workout:', workoutError);
      throw workoutError;
    }

    console.log('Client workout data:', clientWorkout);

    // 2. Buscar sessões do treino (ordenadas)
    const { data: workoutSessions, error: sessionsError } = await supabaseAdmin
      .from('workout_sessions')
      .select('session_id, order_index')
      .eq('workout_id', clientWorkout.workout_id)
      .order('order_index');

    if (sessionsError) {
      console.error('Error fetching workout sessions:', sessionsError);
      throw sessionsError;
    }

    if (!workoutSessions || workoutSessions.length === 0) {
      console.log('No sessions found for this workout');
      return new Response(
        JSON.stringify({ success: true, message: 'No sessions to schedule' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Workout sessions found:', workoutSessions.length);

    // 3. Calcular distribuição de datas
    const startDate = new Date(clientWorkout.start_date);
    const endDate = clientWorkout.end_date 
      ? new Date(clientWorkout.end_date) 
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias padrão

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const sessionsCount = workoutSessions.length;
    
    // Calcular intervalo entre sessões (mínimo 1 dia)
    let interval = Math.max(1, Math.floor(totalDays / sessionsCount));
    
    // Se tem apenas 1 sessão, agendar a cada 2 dias
    if (sessionsCount === 1) {
      interval = 2;
    }

    console.log(`Scheduling ${sessionsCount} sessions over ${totalDays} days with ${interval} day interval`);

    // 4. Criar registros de agendamento
    const scheduleRecords = [];
    let currentDate = new Date(startDate);
    let sessionIndex = 0;

    while (currentDate <= endDate) {
      const session = workoutSessions[sessionIndex % sessionsCount];
      
      scheduleRecords.push({
        client_id: clientWorkout.client_id,
        client_workout_id: client_workout_id,
        session_id: session.session_id,
        session_order: session.order_index,
        scheduled_for: currentDate.toISOString().split('T')[0],
        completed: false
      });

      currentDate.setDate(currentDate.getDate() + interval);
      sessionIndex++;

      // Limitar a 100 registros para evitar loops infinitos
      if (scheduleRecords.length >= 100) break;
    }

    console.log(`Creating ${scheduleRecords.length} schedule records`);

    // 5. Inserir em batch
    const { error: insertError } = await supabaseAdmin
      .from('daily_workout_schedule')
      .insert(scheduleRecords);

    if (insertError) {
      console.error('Error inserting schedule records:', insertError);
      throw insertError;
    }

    console.log('Schedule created successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        scheduled_count: scheduleRecords.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in schedule-workout-sessions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});