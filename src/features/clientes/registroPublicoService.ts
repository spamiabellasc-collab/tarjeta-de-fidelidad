import { supabase } from "../../api/supabase";

type EmpresaPublica = {
  id: string;
  nombre: string;
  nombre_comercial: string | null;
  nombre_tarjeta: string | null;
  logo_url: string | null;
  color_primario: string | null;
  color_secundario: string | null;
  slug: string;
};

type RegistrarClienteInput = {
  empresa_id: string;
  nombre_completo: string;
  telefono: string;
  fecha_nacimiento?: string | null;
};

function normalizarTelefono(telefono: string) {
  return telefono.replace(/\s+/g, "").trim();
}

export async function obtenerEmpresaPublicaPorSlug(slug: string) {
  return supabase
    .from("empresas")
    .select(
      "id, nombre, nombre_comercial, nombre_tarjeta, logo_url, color_primario, color_secundario, slug"
    )
    .ilike("slug", slug)
    .maybeSingle<EmpresaPublica>();
}

export async function buscarClientePorTelefono(
  empresa_id: string,
  telefono: string
) {
  const telefonoNormalizado = normalizarTelefono(telefono);

  return supabase
    .from("clientes")
    .select("id, nombre_completo, telefono")
    .eq("empresa_id", empresa_id)
    .eq("telefono", telefonoNormalizado)
    .is("deleted_at", null)
    .maybeSingle();
}

export async function registrarClientePublico({
  empresa_id,
  nombre_completo,
  telefono,
  fecha_nacimiento,
}: RegistrarClienteInput) {
  const telefonoNormalizado = normalizarTelefono(telefono);

  return supabase
    .from("clientes")
    .insert({
      empresa_id,
      nombre_completo: nombre_completo.trim(),
      telefono: telefonoNormalizado,
      fecha_nacimiento: fecha_nacimiento || null,
      sellos_actuales: 0,
      sellos_historicos: 0,
      ciclo_tarjeta: 1,
      activo: true,
    })
    .select("id")
    .single();
}