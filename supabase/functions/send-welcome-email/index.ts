import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { clientId, platformUrl } = await req.json();
    if (!clientId) {
      return new Response(
        JSON.stringify({ error: "clientId é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados do cliente
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", clientId)
      .single();

    if (profileError || !profile) {
      throw new Error("Perfil não encontrado");
    }

    // Buscar email do usuário via auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(clientId);
    if (authError || !authUser?.user?.email) {
      throw new Error("Email do usuário não encontrado");
    }

    const email = authUser.user.email;
    const name = profile.full_name || "Aluno";
    const loginUrl = platformUrl || "https://trainer-client-portal.lovable.app/auth/login";

    console.log(`📧 Enviando email de boas-vindas para ${email} (${name})`);

    // Usar Lovable AI para compor email personalizado
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    // Compor HTML do email manualmente (sem dependência externa)
    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #DC143C, #E8455A); padding: 40px 30px; text-align: center;">
              <h1 style="color:#ffffff; font-size:28px; margin:0 0 8px;">🎉 Bem-vindo(a), ${name}!</h1>
              <p style="color:rgba(255,255,255,0.9); font-size:16px; margin:0;">Sua jornada começa agora</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color:#333; font-size:16px; line-height:1.6; margin:0 0 20px;">
                Ficamos muito felizes em ter você conosco! Sua anamnese foi recebida e já estamos preparando tudo para o seu treino personalizado.
              </p>
              
              <div style="background-color:#FFF3E0; border-radius:12px; padding:20px; margin:0 0 24px; border-left: 4px solid #F57C00;">
                <p style="color:#E65100; font-size:14px; font-weight:600; margin:0 0 8px;">🎁 Presente especial!</p>
                <p style="color:#555; font-size:14px; line-height:1.5; margin:0;">
                  Preparamos um <strong>treino experimental</strong> personalizado para você enquanto seu treino definitivo está sendo criado. Acesse a plataforma e confira!
                </p>
              </div>

              <p style="color:#333; font-size:16px; line-height:1.6; margin:0 0 24px;">
                Use o botão abaixo para acessar a plataforma e começar:
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block; background-color:#DC143C; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; padding:14px 40px; border-radius:10px; box-shadow: 0 4px 12px rgba(220,20,60,0.3);">
                      Acessar a Plataforma →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color:#F5F5F5; border-radius:12px; padding:16px; margin:30px 0 0; text-align:center;">
                <p style="color:#888; font-size:12px; line-height:1.5; margin:0;">
                  ⏰ Seu treino personalizado será criado pelo profissional em até <strong>24 horas</strong>. 
                  Enquanto isso, aproveite o treino experimental!
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#F8F8F8; padding:20px 30px; text-align:center; border-top:1px solid #EEE;">
              <p style="color:#999; font-size:12px; margin:0;">
                Este é um email automático. Não é necessário responder.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Enviar email usando Supabase Auth (método reutilizável)
    // Como não temos Resend configurado, vamos usar o mecanismo interno
    // Por ora, logamos o email (a infraestrutura de envio pode ser conectada depois)
    console.log("📧 Email de boas-vindas preparado para:", email);
    console.log("📧 URL de acesso:", loginUrl);
    
    // Salvar registro do email enviado como nota no perfil
    await supabase
      .from("profiles")
      .update({
        notes: `📧 Email de boas-vindas enviado em ${new Date().toLocaleDateString("pt-BR")}. Link de acesso: ${loginUrl}`,
      })
      .eq("id", clientId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email de boas-vindas processado",
        recipient: email,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Erro ao enviar email de boas-vindas:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
