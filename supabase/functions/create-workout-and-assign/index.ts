import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionExercise {
  exercise_id: string;
  method_id: string;
  volume_id: string;
  order_index: number;
}

interface SessionData {
  name: string;
  description: string;
  exercises: SessionExercise[];
}

interface CreateWorkoutRequest {
  clientId: string;
  workoutName: string;
  session: SessionData;
  trainingType?: string;
  level?: string;
  gender?: string;
  startDate?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Autorização necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Parse request body
    const body: CreateWorkoutRequest = await req.json();
    const { clientId, workoutName, session, trainingType, level, gender, startDate } = body;

    console.log('Creating workout:', { workoutName, clientId, sessionName: session.name, exercisesCount: session.exercises.length });

    // Validate input
    if (!clientId || !workoutName || !session || !session.name || !session.exercises || session.exercises.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos. É necessário clientId, workoutName, session com nome e exercícios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 1: Create the workout
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        name: workoutName,
        training_type: trainingType || null,
        level: level || null,
        gender: gender || null,
        created_by: user.id,
        responsible_id: user.id,
      })
      .select()
      .single();

    if (workoutError || !workout) {
      console.error('Error creating workout:', workoutError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar treino', details: workoutError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Workout created:', workout.id);

    // Step 2: Create the session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        name: session.name,
        description: session.description || '',
        session_type: 'Musculação',
        created_by: user.id,
      })
      .select()
      .single();

    if (sessionError || !sessionData) {
      console.error('Error creating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar sessão', details: sessionError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session created:', sessionData.id);

    // Step 3: Link session to workout
    const { error: workoutSessionError } = await supabase
      .from('workout_sessions')
      .insert({
        workout_id: workout.id,
        session_id: sessionData.id,
        order_index: 0,
      });

    if (workoutSessionError) {
      console.error('Error linking session to workout:', workoutSessionError);
      return new Response(
        JSON.stringify({ error: 'Erro ao vincular sessão ao treino', details: workoutSessionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session linked to workout');

    // Step 4: Create session exercises
    const sessionExercises = session.exercises.map((ex) => ({
      session_id: sessionData.id,
      exercise_id: ex.exercise_id,
      method_id: ex.method_id,
      volume_id: ex.volume_id,
      order_index: ex.order_index,
    }));

    const { error: exercisesError } = await supabase
      .from('session_exercises')
      .insert(sessionExercises);

    if (exercisesError) {
      console.error('Error creating session exercises:', exercisesError);
      return new Response(
        JSON.stringify({ error: 'Erro ao adicionar exercícios à sessão', details: exercisesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session exercises created:', sessionExercises.length);

    // Step 5: Assign workout to client
    const assignmentStartDate = startDate || new Date().toISOString().split('T')[0];
    
    const { data: clientWorkout, error: clientWorkoutError } = await supabase
      .from('client_workouts')
      .insert({
        client_id: clientId,
        workout_id: workout.id,
        assigned_by: user.id,
        start_date: assignmentStartDate,
        status: 'Ativo',
        total_sessions: 1, // Uma sessão no treino
        completed_sessions: 0,
      })
      .select()
      .single();

    if (clientWorkoutError || !clientWorkout) {
      console.error('Error assigning workout to client:', clientWorkoutError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atribuir treino ao cliente', details: clientWorkoutError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Workout assigned to client:', clientWorkout.id);

    // Step 6: Create daily schedule for the first session
    const { error: scheduleError } = await supabase
      .from('daily_workout_schedule')
      .insert({
        client_id: clientId,
        client_workout_id: clientWorkout.id,
        session_id: sessionData.id,
        scheduled_for: assignmentStartDate,
        session_order: 0,
        completed: false,
      });

    if (scheduleError) {
      console.error('Error creating daily schedule:', scheduleError);
      // Non-critical error, just log it
      console.log('Schedule creation failed but continuing...');
    } else {
      console.log('Daily schedule created for date:', assignmentStartDate);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        workoutId: workout.id,
        sessionId: sessionData.id,
        clientWorkoutId: clientWorkout.id,
        message: 'Treino criado e atribuído com sucesso',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
