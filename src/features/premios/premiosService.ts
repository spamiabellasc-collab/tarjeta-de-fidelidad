import { supabase } from "../../api/supabase";

export async function obtenerPremios(empresa_id: string) {
  const { data, error } = await supabase
    .from("premios")
    .select("*")
    .eq("empresa_id", empresa_id)
    .order("sellos_requeridos", { ascending: true });

  return { data, error };
}

export async function crearPremio(data: {
  empresa_id: string;
  nombre: string;
  descripcion?: string | null;
  sellos_requeridos: number;
  activo: boolean;
}) {
  const { error } = await supabase.from("premios").insert([data]);
  return { error };
}

export async function actualizarPremio(
  id: string,
  data: {
    nombre?: string;
    descripcion?: string | null;
    sellos_requeridos?: number;
    activo?: boolean;
  }
) {
  const { error } = await supabase
    .from("premios")
    .update(data)
    .eq("id", id);

  return { error };
}

export async function eliminarPremio(id: string) {
  const { error } = await supabase.from("premios").delete().eq("id", id);
  return { error };
}