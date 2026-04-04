import { supabase } from "../../api/supabase";

export async function obtenerEmpresaPorId(id: string) {
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { data, error };
}

export async function actualizarEmpresa(
  id: string,
  data: {
    nombre?: string;
    nombre_comercial?: string | null;
    nombre_tarjeta?: string | null;
    telefono?: string | null;
    color_primario?: string | null;
    color_secundario?: string | null;
    logo_url?: string | null;
    icono_sello?: string | null;
  }
) {
  const { error } = await supabase
    .from("empresas")
    .update(data)
    .eq("id", id);

  return { error };
}

export async function subirLogoEmpresa(empresaId: string, file: File) {
  const extension = file.name.split(".").pop() || "png";
  const filePath = `${empresaId}/logo.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("logos-empresas")
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) {
    return { data: null, error: uploadError };
  }

  const { data } = supabase.storage
    .from("logos-empresas")
    .getPublicUrl(filePath);

  return { data, error: null };
}

export async function obtenerConfiguracionEmpresa(empresaId: string) {
  const { data, error } = await supabase
    .from("configuracion_empresa")
    .select("*")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  return { data, error };
}

export async function guardarConfiguracionEmpresa(
  empresaId: string,
  data: {
    whatsapp_cumple_template?: string | null;
    whatsapp_premio_template?: string | null;
    whatsapp_inactivo_template?: string | null;
    icono_sello?: string | null;
    texto_tarjeta?: string | null;
    fondo_tarjeta_url?: string | null;
  }
) {
  const { data: existente, error: errorBusqueda } = await supabase
    .from("configuracion_empresa")
    .select("id")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (errorBusqueda) {
    return { error: errorBusqueda };
  }

  if (existente?.id) {
    const { error } = await supabase
      .from("configuracion_empresa")
      .update(data)
      .eq("empresa_id", empresaId);

    return { error };
  }

  const { error } = await supabase.from("configuracion_empresa").insert([
    {
      empresa_id: empresaId,
      ...data,
    },
  ]);

  return { error };
}

export function reemplazarVariablesTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
) {
  let resultado = template;

  Object.entries(variables).forEach(([clave, valor]) => {
    const valorFinal = valor == null ? "" : String(valor);
    resultado = resultado.replaceAll(`{{${clave}}}`, valorFinal);
  });

  return resultado;
}