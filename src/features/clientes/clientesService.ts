import { supabase } from "../../api/supabase";

export async function obtenerClientes(empresaId: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("empresa_id", empresaId)
    .is("deleted_at", null)
    .order("nombre_completo", { ascending: true });

  return { data, error };
}

export async function obtenerClientePorId(id: string) {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return { data, error };
}

export async function crearCliente(data: {
  empresa_id: string;
  nombre_completo: string;
  fecha_nacimiento?: string | null;
  telefono: string;
  notas?: string | null;
  acepta_whatsapp?: boolean;
}) {
  const { data: result, error } = await supabase
    .from("clientes")
    .insert([
      {
        empresa_id: data.empresa_id,
        nombre_completo: data.nombre_completo,
        fecha_nacimiento: data.fecha_nacimiento ?? null,
        telefono: data.telefono,
        notas: data.notas ?? null,
        acepta_whatsapp: data.acepta_whatsapp ?? true,
      },
    ])
    .select()
    .single();

  return { data: result, error };
}

export async function actualizarCliente(
  id: string,
  data: {
    nombre_completo: string;
    fecha_nacimiento?: string | null;
    telefono: string;
    notas?: string | null;
  }
) {
  const { data: result, error } = await supabase
    .from("clientes")
    .update({
      nombre_completo: data.nombre_completo,
      fecha_nacimiento: data.fecha_nacimiento ?? null,
      telefono: data.telefono,
      notas: data.notas ?? null,
    })
    .eq("id", id)
    .select()
    .single();

  return { data: result, error };
}

export async function eliminarCliente(id: string) {
  const { error } = await supabase
    .from("clientes")
    .update({
      deleted_at: new Date().toISOString(),
      activo: false,
    })
    .eq("id", id);

  return { error };
}

export async function obtenerPremiosPorEmpresa(empresaId: string) {
  const { data, error } = await supabase
    .from("premios")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("activo", true)
    .order("sellos_requeridos", { ascending: true });

  return { data, error };
}

export async function obtenerMovimientosCliente(clienteId: string) {
  const { data, error } = await supabase
    .from("movimientos_sellos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function obtenerCanjesCliente(clienteId: string) {
  const { data, error } = await supabase
    .from("canjes")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("created_at", { ascending: false });

  return { data, error };
}

export async function agregarSelloCliente(params: {
  cliente_id: string;
  empresa_id: string;
  realizado_por: string;
  sellos_actuales: number;
  sellos_historicos: number;
}) {
  const nuevoTotalActual = Math.min((params.sellos_actuales || 0) + 1, 10);
  const nuevoTotalHistorico = (params.sellos_historicos || 0) + 1;
  const ahora = new Date().toISOString();

  const { error: errorCliente } = await supabase
    .from("clientes")
    .update({
      sellos_actuales: nuevoTotalActual,
      sellos_historicos: nuevoTotalHistorico,
      ultima_visita_at: ahora,
      updated_at: ahora,
    })
    .eq("id", params.cliente_id);

  if (errorCliente) {
    return { error: errorCliente };
  }

  const { error: errorMovimiento } = await supabase
    .from("movimientos_sellos")
    .insert([
      {
        empresa_id: params.empresa_id,
        cliente_id: params.cliente_id,
        tipo: "sello",
        cantidad: 1,
        descripcion: "Sello agregado",
        realizado_por: params.realizado_por,
      },
    ]);

  if (errorMovimiento) {
    return { error: errorMovimiento };
  }

  return { error: null };
}

export async function canjearPremioCliente(params: {
  cliente_id: string;
  empresa_id: string;
  premio_id: string;
  realizado_por: string;
  sellos_actuales: number;
  sellos_requeridos: number;
  sellos_requeridos_premio_final: number;
  ciclo_tarjeta: number;
  observacion?: string | null;
}) {
  const esPremioFinal =
    params.sellos_requeridos === params.sellos_requeridos_premio_final;

  const nuevosSellosActuales = esPremioFinal ? 0 : params.sellos_actuales;
  const nuevoCiclo = esPremioFinal ? params.ciclo_tarjeta + 1 : params.ciclo_tarjeta;
  const ahora = new Date().toISOString();

  const { error: errorCanje } = await supabase.from("canjes").insert([
    {
      empresa_id: params.empresa_id,
      cliente_id: params.cliente_id,
      premio_id: params.premio_id,
      ciclo_tarjeta: params.ciclo_tarjeta,
      sellos_descontados: esPremioFinal ? params.sellos_requeridos : 0,
      observacion: params.observacion ?? null,
      realizado_por: params.realizado_por,
    },
  ]);

  if (errorCanje) {
    return { error: errorCanje };
  }

  const { error: errorMovimiento } = await supabase
    .from("movimientos_sellos")
    .insert([
      {
        empresa_id: params.empresa_id,
        cliente_id: params.cliente_id,
        tipo: "canje",
        cantidad: esPremioFinal ? -params.sellos_requeridos : 0,
        descripcion: params.observacion ?? "Canje de premio",
        realizado_por: params.realizado_por,
      },
    ]);

  if (errorMovimiento) {
    return { error: errorMovimiento };
  }

  const { error: errorCliente } = await supabase
    .from("clientes")
    .update({
      sellos_actuales: nuevosSellosActuales,
      ciclo_tarjeta: nuevoCiclo,
      updated_at: ahora,
    })
    .eq("id", params.cliente_id);

  if (errorCliente) {
    return { error: errorCliente };
  }

  return { error: null };
}