import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar se o usuário tem permissão (personal ou admin)
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasPermission = userRoles?.some(r => r.role === 'personal' || r.role === 'admin');
    if (!hasPermission) {
      throw new Error('User does not have permission to create clients');
    }

    const clientData = await req.json();
    console.log('Creating client with data:', { email: clientData.email, full_name: clientData.full_name });

    // Criar usuário usando Admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: clientData.email,
      password: clientData.password,
      email_confirm: true,
      user_metadata: {
        full_name: clientData.full_name
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('User created:', newUser.user.id);

    // Atualizar profile com dados adicionais
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        birth_date: clientData.birth_date || null,
        gender: clientData.gender || null,
        phone: clientData.phone || null,
        emergency_contact: clientData.emergency_contact || null,
        emergency_phone: clientData.emergency_phone || null,
        medical_conditions: clientData.medical_conditions || null,
        goals: clientData.goals || null,
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    console.log('Profile updated');

    // Criar assignment
    const { error: assignmentError } = await supabaseAdmin
      .from('client_assignments')
      .insert({
        personal_id: user.id,
        client_id: newUser.user.id,
        status: 'Ativo',
        start_date: clientData.start_date,
      });

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      throw assignmentError;
    }

    console.log('Assignment created');

    // Criar role de cliente
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'client'
      });

    if (roleError) {
      console.error('Error creating role:', roleError);
      throw roleError;
    }

    console.log('Role created');

    return new Response(
      JSON.stringify({ 
        success: true, 
        client_id: newUser.user.id,
        message: 'Cliente criado com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in create-client function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar cliente';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
