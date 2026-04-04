import { supabase } from "../../api/supabase";

export async function obtenerUsuarios(empresaId: string) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, email, rol, activo, empresa_id, created_at")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: true });

  return { data, error };
}

export async function actualizarUsuario(
  id: string,
  data: {
    nombre?: string;
    rol?: string;
    activo?: boolean;
  }
) {
  const { error } = await supabase
    .from("perfiles")
    .update(data)
    .eq("id", id);

  return { error };
}

export async function crearUsuario(params: {
  email: string;
  password: string;
  nombre: string;
  rol: string;
  empresa_id: string;
}) {
  const { data, error } = await supabase.functions.invoke("create-user", {
    body: params,
  });

  return { data, error };
}