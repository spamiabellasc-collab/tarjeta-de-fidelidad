import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(JSON.stringify({ ok: true }), {
      headers: corsHeaders,
      status: 200,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      {
        headers: corsHeaders,
        status: 405,
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const secretKey = Deno.env.get("SB_SECRET_KEY") ?? "";

    if (!supabaseUrl || !secretKey) {
      return new Response(
        JSON.stringify({
          error: "Faltan SUPABASE_URL o SB_SECRET_KEY en los secrets",
        }),
        {
          headers: corsHeaders,
          status: 500,
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, secretKey);

    const body = await req.json();
    const { email, password, nombre, rol, empresa_id } = body as {
      email?: string;
      password?: string;
      nombre?: string;
      rol?: string;
      empresa_id?: string;
    };

    if (!email || !password || !empresa_id) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios" }),
        {
          headers: corsHeaders,
          status: 400,
        }
      );
    }

    const rolesPermitidos = ["admin", "recepcion", "marketing", "viewer"];
    const rolFinal = rolesPermitidos.includes((rol || "").toLowerCase())
      ? (rol || "").toLowerCase()
      : "recepcion";

    const { data: userData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        {
          headers: corsHeaders,
          status: 400,
        }
      );
    }

    const userId = userData.user?.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "No se pudo crear el usuario" }),
        {
          headers: corsHeaders,
          status: 400,
        }
      );
    }

    const { error: perfilError } = await supabaseAdmin
      .from("perfiles")
      .insert([
        {
          id: userId,
          empresa_id,
          nombre: nombre || email,
          email,
          rol: rolFinal,
          activo: true,
        },
      ]);

    if (perfilError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return new Response(
        JSON.stringify({ error: perfilError.message }),
        {
          headers: corsHeaders,
          status: 400,
        }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        user_id: userId,
      }),
      {
        headers: corsHeaders,
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: corsHeaders,
        status: 500,
      }
    );
  }
});