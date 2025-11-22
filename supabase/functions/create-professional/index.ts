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

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar se é ADMIN
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = userRoles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Apenas administradores podem criar profissionais');
    }

    const professionalData = await req.json();

    console.log('Creating professional:', professionalData.email);

    // Criar usuário usando Admin API (BYPASS trigger)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: professionalData.email,
      password: professionalData.password,
      email_confirm: true,
      user_metadata: {
        full_name: professionalData.full_name
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    console.log('User created:', newUser.user.id);

    // Atualizar perfil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: professionalData.full_name,
        phone: professionalData.phone || null,
        birth_date: professionalData.birth_date || null,
        gender: professionalData.gender || null,
        notes: professionalData.specializations || null,
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    console.log('Profile updated');

    // IMPORTANTE: Inserir role 'personal' (não 'client')
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'personal'
      });

    if (roleError) {
      console.error('Error inserting role:', roleError);
      throw roleError;
    }

    console.log('Role personal inserted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        professional_id: newUser.user.id,
        message: 'Profissional criado com sucesso'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in create-professional function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao criar profissional';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.toString() : String(error)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
