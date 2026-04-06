import { supabase } from "../../api/supabase";

type EmpresaUpdate = {
  nombre?: string | null;
  nombre_comercial?: string | null;
  nombre_tarjeta?: string | null;
  telefono?: string | null;
  color_primario?: string | null;
  color_secundario?: string | null;
  logo_url?: string | null;
  icono_sello?: string | null;
  slug?: string | null;
};

type ConfigEmpresaUpdate = {
  whatsapp_cumple_template?: string | null;
  whatsapp_premio_template?: string | null;
  whatsapp_inactivo_template?: string | null;
};

export async function obtenerEmpresaPorId(empresaId: string) {
  return supabase
    .from("empresas")
    .select(
      "id, nombre, nombre_comercial, nombre_tarjeta, telefono, color_primario, color_secundario, logo_url, icono_sello, slug"
    )
    .eq("id", empresaId)
    .maybeSingle();
}

export async function actualizarEmpresa(
  empresaId: string,
  payload: EmpresaUpdate
) {
  return supabase.from("empresas").update(payload).eq("id", empresaId);
}

export async function subirLogoEmpresa(empresaId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const filePath = `empresas/${empresaId}/logo-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data } = supabase.storage.from("logos").getPublicUrl(filePath);

  return {
    data: {
      path: filePath,
      publicUrl: data.publicUrl,
    },
    error: null,
  };
}

export async function obtenerConfiguracionEmpresa(empresaId: string) {
  return supabase
    .from("configuracion_empresa")
    .select(
      "whatsapp_cumple_template, whatsapp_premio_template, whatsapp_inactivo_template"
    )
    .eq("empresa_id", empresaId)
    .maybeSingle();
}

export async function guardarConfiguracionEmpresa(
  empresaId: string,
  payload: ConfigEmpresaUpdate
) {
  return supabase.from("configuracion_empresa").upsert(
    {
      empresa_id: empresaId,
      ...payload,
    },
    {
      onConflict: "empresa_id",
    }
  );
}

export function reemplazarVariablesTemplate(
  template: string | null | undefined,
  variables: Record<string, string | number>
) {
  let texto = template || "";

  Object.entries(variables).forEach(([key, value]) => {
    texto = texto.replaceAll(`{{${key}}}`, String(value));
  });

  return texto;
}